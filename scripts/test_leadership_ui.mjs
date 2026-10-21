// Isolated in-memory app only; never points to Railway or the local preview database.
import {createRequire} from 'node:module';
import {once} from 'node:events';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createApp} from '../server/index.mjs';
import {hashPassword} from '../server/auth.mjs';
import {saveState} from '../server/database.mjs';
import {createDemo} from '../dist/data.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=createApp({databasePath:':memory:'});
const data=createDemo();data.students=data.students.slice(0,5);data.topics=[];data.groups=[];
const phones=['0911111111','0922222222','0933333333','0944444444','0955555555'];
data.students.forEach((s,i)=>Object.assign(s,{parentPhone:phones[i],demo:false}));
const password='Leadership-test-password',hash=await hashPassword(password),now=new Date().toISOString();
app.db.prepare('INSERT INTO users(id,email,name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)').run('admin','admin@example.test','Admin',hash,'owner',now);
for(let i=0;i<5;i++){
  app.db.prepare('INSERT INTO users(id,email,name,password_hash,role,created_at,phone,parent_activated_at) VALUES(?,?,?,?,?,?,?,?)').run('parent'+i,phones[i]+'@phone.internal',data.students[i].parent,hash,i===4?'editor':'viewer',now,phones[i],now);
  app.db.prepare('INSERT INTO class_access VALUES(?,?)').run('parent'+i,'default');
}
assert.equal(saveState(app.db,data,0,'admin').revision,1);
app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
const base=`http://127.0.0.1:${app.server.address().port}`;
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  const errors=[];
  async function login(username){const context=await browser.newContext({viewport:{width:390,height:950}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('#auth-email').fill(username);await page.locator('#auth-password').fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.locator('main h1').waitFor();return page;}
  async function groupDetail(page){await page.goto(base+'/#groups');await page.getByRole('button',{name:'Xem nhóm',exact:false}).first().click();await page.locator('.group-leadership-summary').waitFor();}
  const admin=await login('admin@example.test');await admin.goto(base+'/#students');
  for(const [i,slot] of [[0,'1'],[1,'2']]){
    await admin.getByRole('button',{name:'Sửa '+data.students[i].name,exact:true}).click();
    await admin.locator('[name=academicDeputy]').selectOption(slot);await admin.locator('#student-form button[type=submit]').click();await admin.locator('#toast').filter({hasText:'Đã cập nhật thông tin học sinh.'}).waitFor();
    await admin.locator('.local-indicator').filter({hasText:'Đã đồng bộ'}).waitFor({state:'attached'});
  }
  assert.equal(await admin.locator('.student-role-tag').count(),2);
  const deputy1=await login(phones[0]);await deputy1.goto(base+'/#topics');
  await deputy1.getByRole('button',{name:'Tạo chuyên đề',exact:true}).first().click();await deputy1.locator('#topic-form [name=name]').fill('Chuyên đề phân quyền');await deputy1.locator('#topic-form [name=due]').fill('2026-12-31');await deputy1.locator('#topic-form button[type=submit]').click();await deputy1.locator('#toast').filter({hasText:'Đã tạo chuyên đề “Chuyên đề phân quyền”.'}).waitFor();
  await deputy1.getByRole('button',{name:'Tạo nhóm học',exact:true}).first().click();await deputy1.locator('#group-form [name=name]').fill('Nhóm có trưởng và phó');
  for(const id of ['s3','s4','s5'])await deputy1.locator('#group-form [name=member][value="'+id+'"]').check();
  await deputy1.locator('[name=leaderId]').selectOption('s3');await deputy1.locator('[name=deputyLeaderId]').selectOption('s4');await deputy1.locator('#group-form button[type=submit]').click();await deputy1.locator('#toast').filter({hasText:'Đã tạo nhóm học “Nhóm có trưởng và phó”.'}).waitFor();
  await groupDetail(deputy1);assert.equal(await deputy1.locator('[data-action=edit-group]').count(),0);assert.equal(await deputy1.locator('[data-action=transfer-group]').count(),1);
  const leader=await login(phones[2]);await groupDetail(leader);assert.equal(await leader.locator('[data-action=edit-group]').count(),1);
  const vice=await login(phones[3]);await groupDetail(vice);assert.equal(await vice.locator('[data-action=edit-group]').count(),1);
  const member=await login(phones[4]);await groupDetail(member);assert.equal(await member.locator('[data-action=edit-group]').count(),0);assert.equal(await member.locator('[data-action=transfer-group]').count(),0);
  await member.locator('.modal-close').click();await member.goto(base+'/#topics');assert.equal(await member.locator('[data-action=new-topic]').count(),0);
  const deputy2=await login(phones[1]);await groupDetail(deputy2);await deputy2.locator('[data-action=transfer-group]').click();await deputy2.locator('#leadership-form [name=leaderId]').selectOption('s5');await deputy2.locator('#leadership-form button[type=submit]').click();await deputy2.locator('#toast').filter({hasText:'Đã cập nhật trưởng / phó nhóm.'}).waitFor();
  await leader.reload();await leader.locator('main h1').waitFor();await groupDetail(leader);assert.equal(await leader.locator('[data-action=edit-group]').count(),0);
  await member.reload();await member.locator('main h1').waitFor();await groupDetail(member);assert.equal(await member.locator('[data-action=edit-group]').count(),1);
  for(const width of [1440,768,390,320]){await deputy2.setViewportSize({width,height:1000});assert.equal(await deputy2.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await deputy2.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth),false);}
  await mkdir('artifacts',{recursive:true});await deputy2.screenshot({path:'artifacts/group-leadership-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
  console.log('PASS two admin-assigned deputy tags; viewer deputies create; selected leader/vice persist; editor member read-only; deputy transfer grants new leader and revokes old leader; responsive layout; no JS errors.');
}finally{if(browser)await browser.close();await new Promise(r=>app.server.close(r));app.db.close();}

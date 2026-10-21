import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from './index.mjs';
import { createDemo } from '../dist/data.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase, loadState } from './database.mjs';

test('migration from the deployed schema preserves the class, accounts and sessions',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'hoc-nhom-migration-')),filename=path.join(directory,'test.sqlite');
  let db=new DatabaseSync(filename);
  try{
    db.exec(`CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
      INSERT INTO schema_migrations VALUES(1,datetime('now')),(2,datetime('now'));
      CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE COLLATE NOCASE,name TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL,created_at TEXT NOT NULL);
      INSERT INTO users VALUES('old-admin','admin@example.test','Admin cũ','hash-old','owner','2026-01-01'),('old-parent','parent@example.test','PH cũ','hash-parent','viewer','2026-01-01');
      CREATE TABLE classroom(id INTEGER PRIMARY KEY CHECK(id=1),name TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,school_name TEXT NOT NULL);
      INSERT INTO classroom VALUES(1,'Lớp đang dùng',9,'2026-01-01','Trường đang dùng');
      CREATE TABLE auth_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf_token TEXT NOT NULL,expires_at INTEGER NOT NULL);
      INSERT INTO auth_sessions VALUES('old-session','old-admin','old-csrf',9999999999999);`);
    db.close();db=openDatabase(filename);
    assert.equal(loadState(db).data.className,'Lớp đang dùng');
    assert.equal(loadState(db).revision,9);
    assert.equal(db.prepare('SELECT password_hash FROM users WHERE id=?').get('old-admin').password_hash,'hash-old');
    assert.equal(db.prepare('SELECT count(*) AS n FROM auth_sessions').get().n,1);
    assert.equal(db.prepare('SELECT class_id FROM class_access WHERE user_id=?').get('old-parent').class_id,'default');
    assert.equal(db.prepare('SELECT count(*) AS n FROM class_spaces').get().n,1);
    assert.equal(db.prepare('SELECT parent_name FROM users WHERE id=?').get('old-parent').parent_name,'PH cũ');
    db.prepare('UPDATE users SET student_name=?,relationship=? WHERE id=?').run('Học sinh đã lưu','Bố','old-parent');
    db.close();db=openDatabase(filename);
    assert.equal(db.prepare('SELECT count(*) AS n FROM class_access').get().n,1);
    assert.equal(db.prepare('SELECT student_name,relationship FROM users WHERE id=?').get('old-parent').student_name,'Học sinh đã lưu');
  }finally{db.close();await rm(directory,{recursive:true,force:true});}
});

test('class isolation, phone accounts, forced password change, grants, profile and reset',async()=>{
  const app=createApp({databasePath:':memory:',setupKey:'isolated-test'});
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const base=`http://127.0.0.1:${app.server.address().port}`;
  async function request(route,method='GET',data,account={},extra={}){
    const response=await fetch(base+'/api'+route,{method,headers:{Origin:base,'Content-Type':'application/json',...(account.cookie?{Cookie:account.cookie,'X-CSRF-Token':account.csrf}:{}),...extra},...(data===undefined?{}:{body:JSON.stringify(data)})});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  const session=r=>({cookie:r.cookie,csrf:r.body.csrfToken});
  try{
    const owner=session(await request('/auth/setup','POST',{name:'Admin',email:'admin@example.test',password:'Admin-test-password',setupKey:'isolated-test'}));
    const data=createDemo();
    data.students[0].parentPhone='0912345678';data.students[0].demo=false;
    data.students[1].parentPhone='+84 912 345 678';data.students[1].demo=false;
    assert.equal((await request('/state','PUT',{data,revision:0},owner)).status,200);
    const created=await request('/classes','POST',{name:'Lớp 8A',schoolName:'Trường mới'},owner);
    assert.equal(created.status,201);const classId=created.body.id;
    const route='/state?classId='+classId;
    const blank=(await request(route,'GET',undefined,owner)).body;
    assert.equal(blank.data.students.length,0);
    assert.equal((await request(route,'PUT',{data:{...blank.data,students:[{...data.students[0],name:'Học sinh lớp khác'}]},revision:0},owner)).status,200);
    assert.equal((await request('/state','GET',undefined,owner)).body.data.students.length,20);
    assert.equal((await request(route,'PUT',{data:blank.data,revision:0},owner)).status,409);
    assert.equal((await request('/users','POST',{name:'Sai số',phone:'123',role:'viewer'},owner)).status,400);
    const requiredOnly={studentName:'Nguyễn Minh Anh',phone:'0901234567',role:'viewer',classIds:[classId]};
    for(const patch of [{studentName:''},{studentName:' '.repeat(3)},{parentName:42},{relationship:'x'.repeat(81)},{address:42},{address:'x'.repeat(501)},{classIds:[]},{classIds:['missing']},{phone:'123'}])assert.equal((await request('/users','POST',{...requiredOnly,...patch},owner)).status,400);
    assert.equal((await request('/users','POST',requiredOnly,owner)).status,201);
    assert.equal((await request('/users','POST',requiredOnly,owner)).status,409);
    const enrolled=(await request(route,'GET',undefined,owner)).body;
    assert.equal(enrolled.data.students.length,2);assert.equal(enrolled.data.students[1].name,requiredOnly.studentName);
    assert.equal(enrolled.data.students[1].parentPhone,requiredOnly.phone);assert.equal(enrolled.data.students[1].parent,'');
    assert.equal((await request('/state','GET',undefined,owner)).body.data.students.length,20);
    assert.equal((await request(route,'PUT',{data:enrolled.data,revision:1},owner)).status,409);
    const manual=(await request('/users','GET',undefined,owner)).body.users.find(u=>u.phone===requiredOnly.phone);
    assert.equal(manual.studentName,'Nguyễn Minh Anh');assert.equal(manual.parentName,'');assert.equal(manual.relationship,'');assert.deepEqual(manual.classIds,[classId]);
    const manualLogin=await request('/auth/login','POST',{username:requiredOnly.phone,password:'12345678'});
    assert.equal(manualLogin.status,200);assert.equal(manualLogin.body.user.mustChangePassword,true);
    assert.equal(manualLogin.body.user.name,'PH của Nguyễn Minh Anh');
    assert.equal((await request('/auth/session','GET',undefined,session(manualLogin))).body.user.studentName,'Nguyễn Minh Anh');
    assert.equal((await request(route,'GET',undefined,session(manualLogin))).status,403);
    const named={...requiredOnly,phone:'0901234568',address:'  12 Tây Sơn, Đà Nẵng  ',parentName:'  Nguyễn Thu Hà  ',relationship:'  Mẹ  '};
    assert.equal((await request('/users','POST',named,owner)).status,201);
    const namedUser=(await request('/users','GET',undefined,owner)).body.users.find(u=>u.phone===named.phone);
    assert.equal(namedUser.parentName,'Nguyễn Thu Hà');assert.equal(namedUser.name,'Nguyễn Thu Hà');assert.equal(namedUser.relationship,'Mẹ');
    const namedState=(await request(route,'GET',undefined,owner)).body;
    assert.equal(namedState.data.students.length,2);assert.equal(namedState.data.students[1].address,'12 Tây Sơn, Đà Nẵng');
    assert.equal(namedState.data.students[1].parentPhone,requiredOnly.phone);assert.equal(namedState.data.students[1].parentPhone2,named.phone);assert.equal(namedState.data.students[1].parent2,'Nguyễn Thu Hà');
    assert.equal(app.db.prepare('SELECT student_name FROM users WHERE id=?').get(namedUser.id).student_name,named.studentName);
    const bulk=await request('/users/from-students','POST',{},owner);
    assert.equal(bulk.body.created,1);assert.equal(bulk.body.skipped,18);
    assert.equal((await request('/users/from-students','POST',{},owner)).body.created,0);
    const first=await request('/auth/login','POST',{username:'+84 912 345 678',password:'12345678'});
    assert.equal(first.status,200);assert.equal(first.body.user.mustChangePassword,true);
    const initial=session(first);
    for(const endpoint of ['/state','/classes','/users'])assert.equal((await request(endpoint,'GET',undefined,initial)).status,403);
    assert.equal((await request('/auth/password','POST',{currentPassword:'12345678',password:'new-password'},initial,{'X-CSRF-Token':'wrong'})).status,403);
    assert.equal((await request('/auth/password','POST',{currentPassword:'wrong',password:'new-password'},initial)).status,403);
    assert.equal((await request('/auth/password','POST',{currentPassword:'12345678',password:'12345678'},initial)).status,400);
    const changed=await request('/auth/password','POST',{currentPassword:'12345678',password:'Parent-new-password'},initial);
    assert.equal(changed.status,200);assert.equal(changed.body.user.mustChangePassword,false);
    const parent=session(changed);
    assert.equal((await request('/state','GET',undefined,initial)).status,401);
    assert.equal((await request('/auth/login','POST',{username:'0912345678',password:'12345678'})).status,401);
    assert.equal((await request('/classes','GET',undefined,parent)).body.classes.length,1);
    assert.equal((await request(route,'GET',undefined,parent)).status,403);
    assert.equal((await request('/state','PUT',{data,revision:1},parent)).status,403);
    assert.equal((await request('/classes','POST',{name:'Bad',schoolName:'Bad'},parent)).status,404);
    const users=(await request('/users','GET',undefined,owner)).body.users;
    const user=users.find(u=>u.phone==='0912345678');assert(!JSON.stringify(users).includes('password_hash'));
    assert.equal(user.email,'');
    assert.equal((await request('/users/access','PUT',{id:user.id,classIds:[classId],role:'editor'},owner)).status,200);
    assert.equal((await request('/state','GET',undefined,parent)).status,403);
    const editorData=(await request(route,'GET',undefined,parent)).body;
    editorData.data.students[0].name='Tên mới';
    assert.equal((await request(route,'PUT',{data:editorData.data,revision:editorData.revision},parent)).status,403);
    assert.equal((await request('/students?classId='+classId,'PATCH',{id:editorData.data.students[0].id,revision:editorData.revision,changes:{name:'Tên mới'}},parent)).status,200);
    assert.equal((await request(route,'PUT',{data:{...editorData.data,className:'Đổi trái phép'},revision:editorData.revision+1},parent)).status,403);
    assert.equal((await request('/users/access','PUT',{id:user.id,classIds:['missing'],role:'viewer'},owner)).status,400);
    assert.equal((await request('/classes','GET',undefined,parent)).body.classes[0].id,classId);
    const profile=await request('/profile','PUT',{name:'Admin mới',email:'admin-new@example.test',phone:'0975163361'},owner);
    assert.equal(profile.status,200);assert.equal(profile.body.user.phone,'0975163361');
    assert.equal((await request('/auth/login','POST',{username:'0975163361',password:'Admin-test-password'})).status,200);
    assert.equal((await request('/profile','PUT',{name:'PH mới',email:'',phone:'0912345678'},parent)).status,200);
    assert.equal((await request('/profile','PUT',{name:'PH',email:'',phone:'0987654321'},parent)).status,403);
    assert.equal((await request('/users/reset-password','POST',{id:user.id},owner)).status,200);
    assert.equal((await request(route,'GET',undefined,parent)).status,401);
    const reset=await request('/auth/login','POST',{username:'0912345678',password:'12345678'});
    assert.equal(reset.body.user.mustChangePassword,true);
    assert.equal((await request('/auth/logout','POST',{},session(reset))).status,200);
  }finally{await new Promise(resolve=>app.server.close(resolve));app.db.close();}
});

test('production accepts the configured HTTPS origin behind a proxy and rejects other origins',async()=>{
  const app=createApp({databasePath:':memory:',production:true,publicUrl:'https://hoc-nhom.example.test/path',setupKey:'test-only'});
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const base=`http://127.0.0.1:${app.server.address().port}`;
  try{
    for(const [origin,status] of [['https://evil.example.test',403],['https://hoc-nhom.example.test',400]]){
      const response=await fetch(base+'/api/auth/setup',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({setupKey:'test-only'})});
      assert.equal(response.status,status);
    }
  }finally{await new Promise(resolve=>app.server.close(resolve));app.db.close();}
});

test('account enrollment reuses student records, preserves details and rolls back on failure',async()=>{
  const app=createApp({databasePath:':memory:',setupKey:'test'});
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const base=`http://127.0.0.1:${app.server.address().port}`;
  let auth={};
  async function request(route,method='GET',data){
    const response=await fetch(base+'/api'+route,{method,headers:{Origin:base,'Content-Type':'application/json',...auth},...(data===undefined?{}:{body:JSON.stringify(data)})});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  try{
    const setup=await request('/auth/setup','POST',{name:'Admin',email:'enroll@example.test',password:'Admin-test-password',setupKey:'test'});
    auth={Cookie:setup.cookie,'X-CSRF-Token':setup.body.csrfToken};
    const data=createDemo(),original=data.students[0];original.parentPhone='+84 912 345 678';original.demo=false;
    assert.equal((await request('/state','PUT',{data,revision:0})).status,200);
    const profile={studentName:original.name.toUpperCase(),phone:'0912345678',role:'viewer',parentName:'Tên phụ huynh mới',relationship:'Mẹ',classIds:['default']};
    assert.equal((await request('/users','POST',profile)).status,201);
    let state=(await request('/state')).body;
    assert.equal(state.data.students.length,20);
    assert.equal(state.data.students[0].id,original.id);assert.equal(state.data.students[0].address,original.address);
    assert.equal(state.data.students[0].parent,profile.parentName);assert.equal(state.data.students[0].relation,'Mẹ');
    assert.deepEqual(state.data.groups,data.groups);
    const before=structuredClone(state);
    app.db.exec("CREATE TRIGGER fail_enrollment BEFORE INSERT ON students BEGIN SELECT RAISE(ABORT,'test enrollment failure'); END;");
    assert.equal((await request('/users','POST',{...profile,phone:'0901234569',studentName:'Không được lưu'})).status,500);
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM users WHERE phone=?').get('0901234569').n,0);
    assert.deepEqual((await request('/state')).body,before);
    app.db.exec('DROP TRIGGER fail_enrollment');
    assert.equal((await request('/users','POST',{...profile,phone:'0901234569',studentName:'Học sinh mới',parentName:'',relationship:''})).status,201);
    state=(await request('/state')).body;assert.equal(state.data.students.length,21);
    assert.equal(state.data.students[20].parent,'');assert.equal(state.data.students[20].phone,'');assert.equal(state.data.students[20].parentPhone,'0901234569');
    const withAddress={...profile,phone:'0901234560',studentName:data.students[1].name,address:'Địa chỉ cập nhật'};
    const incomplete=(await request('/state')).body;incomplete.data.students[1].parentPhone='';
    assert.equal((await request('/state','PUT',{data:incomplete.data,revision:incomplete.revision})).status,200);
    assert.equal((await request('/users','POST',{...withAddress,parentName:data.students[1].parent})).status,201);
    const updated=(await request('/state')).body.data;assert.equal(updated.students.length,21);assert.equal(updated.students[1].address,withAddress.address);
  }finally{await new Promise(resolve=>app.server.close(resolve));app.db.close();}
});

test('one-time backfill enrolls earlier manual accounts without duplicating or restoring later removals',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'hoc-nhom-enroll-')),filename=path.join(directory,'test.sqlite');
  let db=openDatabase(filename);
  try{
    db.exec("DELETE FROM schema_migrations WHERE version=5");
    db.prepare("INSERT INTO users(id,email,name,password_hash,role,created_at,phone,student_name,parent_name,relationship) VALUES(?,?,?,?,?,?,?,?,?,?)").run('prior-parent','prior@phone.internal','PH','keep-hash','viewer','2026-10-20','0912345678','Học sinh vừa tạo','Phụ huynh cũ','Bố');
    db.prepare('INSERT INTO class_access VALUES(?,?)').run('prior-parent','default');
    db.close();db=openDatabase(filename);
    const state=loadState(db);assert.equal(state.data.students.length,1);
    assert.equal(state.data.students[0].name,'Học sinh vừa tạo');assert.equal(state.data.students[0].parent,'Phụ huynh cũ');assert.equal(state.data.students[0].relation,'Bố');
    assert.equal(db.prepare('SELECT password_hash FROM users WHERE id=?').get('prior-parent').password_hash,'keep-hash');
    db.close();db=openDatabase(filename);assert.equal(loadState(db).data.students.length,1);
    db.exec('DELETE FROM students');db.close();db=openDatabase(filename);
    assert.equal(loadState(db).data.students.length,0);
  }finally{db.close();await rm(directory,{recursive:true,force:true});}
});

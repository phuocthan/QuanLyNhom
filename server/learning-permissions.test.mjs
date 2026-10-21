import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createApp} from './index.mjs';
import {createDemo} from '../dist/data.js';

test('two academic deputies create learning activities; only current group leaders edit, and transfers revoke old access',async()=>{
  const app=createApp({databasePath:':memory:'});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const base=`http://127.0.0.1:${app.server.address().port}`;
  async function req(path,method='GET',body,account={}){
    const r=await fetch(base+'/api'+path,{method,headers:{Origin:base,'Content-Type':'application/json',...(account.cookie?{Cookie:account.cookie,'X-CSRF-Token':account.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  const session=r=>({cookie:r.cookie,csrf:r.body.csrfToken});
  try{
    const owner=session(await req('/auth/setup','POST',{name:'Admin',email:'owner@example.test',password:'Owner-test-password'}));
    const demo=createDemo(),data=structuredClone(demo);data.students=data.students.slice(0,5);data.topics=[];data.groups=[];
    const phones=['0911111111','0922222222','0933333333','0944444444','0955555555'];
    data.students.forEach((s,i)=>Object.assign(s,{parentPhone:phones[i],demo:false,academicDeputy:i<2?i+1:0}));
    assert.equal((await req('/state','PUT',{data,revision:0},owner)).status,200);
    assert.equal((await req('/users/from-students','POST',{},owner)).body.created,5);
    const accounts=[];
    for(const phone of phones){const login=session(await req('/auth/login','POST',{username:phone,password:'12345678'}));accounts.push(session(await req('/auth/password','POST',{currentPassword:'12345678',password:'Parent-new-password'},login)));}
    app.db.prepare("UPDATE users SET role='editor' WHERE phone=?").run(phones[4]);
    const current=()=>req('/state','GET',undefined,owner).then(r=>r.body);
    async function edit(account,change,expected=200){const state=await current();const next=structuredClone(state.data);change(next);const result=await req('/state','PUT',{data:next,revision:state.revision},account);assert.equal(result.status,expected,result.body.error);if(expected!==200)assert.deepEqual(await current(),state);return result;}
    await edit(accounts[4],d=>d.topics.push(demo.topics[0]),403);
    await edit(accounts[0],d=>d.topics.push(demo.topics[0]));
    await edit(accounts[1],d=>d.topics.push(demo.topics[1]));
    const g={...demo.groups[0],members:['s3','s4','s5'],hostId:'s3',leaderId:'s3',deputyLeaderId:'s4'};
    await edit(accounts[4],d=>d.groups.push(g),403);
    await edit(accounts[0],d=>d.groups.push(g));
    assert.equal((await current()).data.groups[0].leaderId,'s3');assert.equal((await current()).data.groups[0].deputyLeaderId,'s4');
    await edit(accounts[0],d=>d.groups[0].address='Class deputy cannot edit this group',403);
    await edit(accounts[2],d=>d.groups[0].note='Leader edit');
    await edit(accounts[3],d=>d.groups[0].note='Vice leader edit');
    await edit(accounts[4],d=>d.groups[0].note='Member edit',403);
    await edit(accounts[4],d=>{d.groups[0].leaderId='s5';d.groups[0].note='Self promotion';},403);
    await edit(accounts[1],d=>{d.groups[0].leaderId='s5';d.groups[0].note='Transfer plus forbidden content';},403);
    await edit(accounts[1],d=>{d.groups[0].leaderId='s5';});
    await edit(accounts[2],d=>d.groups[0].note='Former leader edit',403);
    await edit(accounts[4],d=>d.groups[0].note='New leader edit');
    await edit(accounts[3],d=>{d.groups[0].leaderId='s3';d.groups[0].deputyLeaderId='s5';});
    await edit(accounts[3],d=>d.groups[0].note='Former vice leader edit',403);
    await edit(accounts[4],d=>d.groups[0].note='New vice leader edit');
    await edit(accounts[0],d=>{d.groups[0].leaderId='s4';d.groups[0].deputyLeaderId='s3';});
    await edit(accounts[1],d=>{d.groups[0].deputyLeaderId=d.groups[0].leaderId;},400);
    await edit(owner,d=>{d.students[2].academicDeputy=1;},400);
    await edit(owner,d=>{d.students[2].academicDeputy=3;},400);
    await edit(accounts[4],d=>{d.students[0].academicDeputy=0;d.students[4].academicDeputy=1;},403);
    await edit(owner,d=>{d.students[0].academicDeputy=0;d.students[4].academicDeputy=1;});
    await edit(accounts[0],d=>d.topics.push({...demo.topics[2]}),403);
    await edit(accounts[4],d=>d.topics.push({...demo.topics[2]}));
    await edit(accounts[4],d=>{d.groups[0].leaderId='s1';},400);
    await edit(accounts[0],d=>d.groups.splice(0,1),403);
    await edit(owner,d=>d.groups.splice(0,1));
    const other=await req('/classes','POST',{name:'Other class',schoolName:'Other school'},owner);
    assert.equal((await req('/state?classId='+other.body.id,'PUT',{data:(await current()).data,revision:0},accounts[4])).status,403);
  }finally{await new Promise(r=>app.server.close(r));app.db.close();}
});

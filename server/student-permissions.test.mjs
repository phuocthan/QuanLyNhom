import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createApp} from './index.mjs';
import {createDemo} from '../dist/data.js';

test('parents can edit only their linked children; neither viewer nor editor can alter other families or associations',async()=>{
  const app=createApp({databasePath:':memory:'});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const base=`http://127.0.0.1:${app.server.address().port}`;
  async function req(path,method='GET',data,account={}){
    const r=await fetch(base+'/api'+path,{method,headers:{Origin:base,'Content-Type':'application/json',...(account.cookie?{Cookie:account.cookie,'X-CSRF-Token':account.csrf}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});
    return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  const session=r=>({cookie:r.cookie,csrf:r.body.csrfToken});
  try{
    const owner=session(await req('/auth/setup','POST',{name:'Admin',email:'owner@example.test',password:'Owner-test-password'}));
    const data=createDemo();data.groups=[];data.topics=[];data.students=data.students.slice(0,3);
    for(const [i,s] of data.students.entries())Object.assign(s,{demo:false,parentPhone:i===2?'0901234567':'0912345678',parent2:'Mẹ',parentPhone2:i===0?'0987654321':'',relation2:'Mẹ'});
    await req('/state','PUT',{data,revision:0},owner);await req('/users/from-students','POST',{},owner);
    const fatherLogin=session(await req('/auth/login','POST',{username:'0912345678',password:'12345678'}));
    assert.equal((await req('/students','PATCH',{id:data.students[0].id,revision:1,changes:{address:'Before activation'}},fatherLogin)).status,403);
    const father=session(await req('/auth/password','POST',{currentPassword:'12345678',password:'Father-new-password'},fatherLogin));
    const motherLogin=session(await req('/auth/login','POST',{username:'0987654321',password:'12345678'}));
    const mother=session(await req('/auth/password','POST',{currentPassword:'12345678',password:'Mother-new-password'},motherLogin));
    for(const role of ['viewer','editor']){
      app.db.prepare('UPDATE users SET role=? WHERE phone=?').run(role,'0912345678');
      for(const child of data.students.slice(0,2)){
        const current=(await req('/state','GET',undefined,father)).body;
        assert.equal((await req('/students','PATCH',{id:child.id,revision:current.revision,changes:{address:`Own home ${role}`,note:'Own child'}},father)).status,200);
        assert.equal((await req('/students','PATCH',{id:child.id,revision:current.revision,changes:{note:'Stale edit'}},father)).status,409);
      }
      const current=(await req('/state','GET',undefined,owner)).body;
      assert.equal((await req('/students','PATCH',{id:data.students[2].id,revision:current.revision,changes:{address:'Other home'}},father)).status,403);
      assert.equal((await req('/students','PATCH',{id:data.students[0].id,revision:current.revision,changes:{parentPhone:'0901234567'}},father)).status,400);
      assert.equal((await req('/students','PATCH',{id:data.students[0].id,revision:current.revision,changes:{id:data.students[2].id}},father)).status,400);
      for(const mutation of ['edit','delete','add']){
        const attempt=structuredClone(current.data);
        if(mutation==='edit')attempt.students[2].address='Other family';
        if(mutation==='delete')attempt.students.splice(2,1);
        if(mutation==='add')attempt.students.push({...attempt.students[0],id:'forged-child'});
        assert.equal((await req('/state','PUT',{data:attempt,revision:current.revision},father)).status,403);
      }
      assert.deepEqual((await req('/state','GET',undefined,owner)).body,current);
    }
    let current=(await req('/state','GET',undefined,owner)).body;
    assert.equal((await req('/students','PATCH',{id:data.students[0].id,revision:current.revision,changes:{phone:'0902223344'}},mother)).status,200);
    current=(await req('/state','GET',undefined,owner)).body;
    assert.equal((await req('/students','PATCH',{id:data.students[1].id,revision:current.revision,changes:{note:'Not her child'}},mother)).status,403);
    assert.equal((await req('/students?classId=unknown','PATCH',{id:data.students[0].id,revision:current.revision,changes:{note:'Other class'}},father)).status,403);
    current.data.students[0].parentPhone='0903334455';
    assert.equal((await req('/state','PUT',current,owner)).status,200);
    current=(await req('/state','GET',undefined,owner)).body;
    assert.equal((await req('/students','PATCH',{id:data.students[0].id,revision:current.revision,changes:{note:'Former link'}},father)).status,403);
    assert.equal((await req('/students','PATCH',{id:data.students[2].id,revision:current.revision,changes:{address:'Admin edit'}},owner)).status,200);
  }finally{await new Promise(r=>app.server.close(r));app.db.close();}
});

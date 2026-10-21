import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createApp } from './index.mjs';
import { createDemo, snapshotSession, uid } from '../dist/data.js';

test('private SQLite API: setup, auth, role enforcement, CSRF, revision conflicts, persistence and history',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'cung-hoc-test-'));
  const databasePath=path.join(directory,'isolated.sqlite');
  let app=createApp({databasePath,setupKey:'test-only-setup-key'});
  async function start(){app.server.listen(0,'127.0.0.1');await once(app.server,'listening');return `http://127.0.0.1:${app.server.address().port}`;}
  let base=await start();
  async function request(endpoint,method='GET',data,account={},extra={}){
    const response=await fetch(base+endpoint,{method,headers:{Origin:base,'Content-Type':'application/json',...(account.cookie?{Cookie:account.cookie,'X-CSRF-Token':account.csrf}:{}),...extra},...(data===undefined?{}:{body:JSON.stringify(data)})});
    const body=await response.json();return {status:response.status,body,cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  try{
    assert.equal((await request('/api/state')).status,401);
    assert.equal((await request('/api/auth/session')).body.setupRequired,true);
    const setup={name:'Test owner',email:'owner@example.test',password:'Test-only-password-123',setupKey:'wrong'};
    assert.equal((await request('/api/auth/setup','POST',setup)).status,403);
    setup.setupKey='test-only-setup-key';
    const registered=await request('/api/auth/setup','POST',setup);assert.equal(registered.status,201);
    const owner={cookie:registered.cookie,csrf:registered.body.csrfToken};
    assert.equal((await request('/api/auth/setup','POST',setup)).status,409);
    assert.equal((await request('/api/auth/login','POST',{email:setup.email,password:'wrong'})).status,401);
    let state=await request('/api/state','GET',undefined,owner);
    assert.equal(state.status,200);assert.equal(state.body.data.students.length,0);assert.equal(state.body.revision,0);
    const data=createDemo(),g=data.groups[0];g.history.push(snapshotSession(g));g.sessionId=uid();g.note='Buổi tiếp theo riêng';
    const payload={data,revision:0};
    assert.equal((await request('/api/state','PUT',payload,owner,{Origin:'https://evil.example'})).status,403);
    assert.equal((await request('/api/state','PUT',payload,owner,{'X-CSRF-Token':'invalid'})).status,403);
    const saved=await request('/api/state','PUT',payload,owner);assert.equal(saved.status,200);assert.equal(saved.body.revision,1);
    assert.equal((await request('/api/state','PUT',payload,owner)).status,409);
    assert.equal((await request('/api/state','PUT',{data:{},revision:1},owner)).status,400);
    state=await request('/api/state','GET',undefined,owner);assert.deepEqual(state.body.data,data);
    const viewer={studentName:'Học sinh Viewer',phone:'0912345678',role:'viewer'};
    assert.equal((await request('/api/users','POST',viewer,owner)).status,201);
    const firstLogin=await request('/api/auth/login','POST',{username:viewer.phone,password:'12345678'});
    const firstAccount={cookie:firstLogin.cookie,csrf:firstLogin.body.csrfToken};
    assert.equal(firstLogin.body.user.mustChangePassword,true);
    assert.equal((await request('/api/state','GET',undefined,firstAccount)).status,403);
    const logged=await request('/api/auth/password','POST',{currentPassword:'12345678',password:'Viewer-test-password-123'},firstAccount);
    const account={cookie:logged.cookie,csrf:logged.body.csrfToken};
    assert.equal((await request('/api/state','GET',undefined,account)).status,200);
    assert.equal((await request('/api/state','PUT',{data,revision:1},account)).status,403);
    assert.equal((await request('/api/users','POST',viewer,account)).status,404);
    assert.equal((await request('/api/auth/session','GET',undefined,owner)).body.user.role,'owner');
    assert.equal((await request('/api/users','GET',undefined,owner)).body.users.length,2);
    const extraClass=await request('/api/classes','POST',{name:'Lớp lưu bền',schoolName:'Trường thử nghiệm'},owner);
    const extraRoute='/api/state?classId='+extraClass.body.id;
    assert.equal((await request(extraRoute,'PUT',{data,revision:0},owner)).status,200);
    const enrolled=(await request('/api/state','GET',undefined,owner)).body;
    assert.equal(enrolled.data.students.length,21);assert.equal(enrolled.data.students[20].name,viewer.studentName);
    // The same SQLite file survives restarting the application; sessions also remain valid.
    await new Promise(resolve=>app.server.close(resolve));app.db.close();
    app=createApp({databasePath,setupKey:'test-only-setup-key'});base=await start();
    const restored=await request('/api/state','GET',undefined,owner);assert.equal(restored.status,200);assert.deepEqual(restored.body.data,enrolled.data);assert.equal(restored.body.revision,enrolled.revision);
    const extraRestored=await request(extraRoute,'GET',undefined,owner);assert.deepEqual(extraRestored.body.data,data);assert.equal(extraRestored.body.revision,1);
    assert.equal(app.db.prepare('SELECT count(*) AS total FROM study_sessions').get().total,7);
    const hashes=app.db.prepare('SELECT password_hash FROM users').all();assert(hashes.every(r=>!r.password_hash.includes('password')));
    assert.equal((await request('/api/auth/logout','POST',{},owner)).status,200);
    assert.equal((await request('/api/state','GET',undefined,owner)).status,401);
  }finally{await new Promise(resolve=>app.server.close(resolve));app.db.close();await rm(directory,{recursive:true,force:true});}
});

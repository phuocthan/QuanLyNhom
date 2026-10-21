import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from './index.mjs';
import { createDemo, validateData } from '../dist/data.js';
import { parseStudentsCSV } from '../dist/csv.js';

test('two parents per student activate independently after password change, and shared parents can have siblings',async()=>{
  const app=createApp({databasePath:':memory:'});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const base=`http://127.0.0.1:${app.server.address().port}`;
  async function req(route,method='GET',body,account={}){
    const response=await fetch(base+'/api'+route,{method,headers:{Origin:base,'Content-Type':'application/json',...(account.cookie?{Cookie:account.cookie,'X-CSRF-Token':account.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  const session=r=>({cookie:r.cookie,csrf:r.body.csrfToken});
  try{
    const owner=session(await req('/auth/setup','POST',{name:'Admin',email:'owner@example.test',password:'Owner-test-password-123'}));
    const data=createDemo();data.groups=[];data.topics=[];data.students=data.students.slice(0,2);
    Object.assign(data.students[0],{parent:'Cha khai báo',parentPhone:'0912345678',relation:'Bố',parent2:'Mẹ khai báo',parentPhone2:'0987654321',relation2:'Mẹ',demo:false});
    Object.assign(data.students[1],{parent:'Cha khai báo',parentPhone:'+84 912 345 678',relation:'Bố',parent2:'Mẹ thứ hai',parentPhone2:'0901234567',relation2:'Mẹ',demo:false});
    assert.equal((await req('/state','PUT',{data,revision:0},owner)).status,200);
    const invalid=structuredClone(data);invalid.students[0].parentPhone2='+84 912 345 678';
    assert.equal(validateData(invalid),false);
    assert.equal((await req('/state','PUT',{data:invalid,revision:1},owner)).status,400);
    assert.equal((await req('/users/from-students','POST',{},owner)).body.created,3);
    const users=(await req('/users','GET',undefined,owner)).body.users;
    const father=users.find(u=>u.phone==='0912345678');
    let links=(await req('/parent-links','GET',undefined,owner)).body.links;
    assert.equal(links[data.students[0].id].length,0);
    const fatherLogin=await req('/auth/login','POST',{username:'0912345678',password:'12345678'});
    assert.equal((await req('/parent-links','GET',undefined,session(fatherLogin))).status,403);
    assert.equal((await req('/parent-links','GET',undefined,owner)).body.links[data.students[0].id].length,0);
    const fatherChanged=await req('/auth/password','POST',{currentPassword:'12345678',password:'Father-new-password'},session(fatherLogin));
    const fatherAccount=session(fatherChanged);
    links=(await req('/parent-links','GET',undefined,owner)).body.links;
    assert.equal(links[data.students[0].id].length,1);assert.equal(links[data.students[1].id].length,1);
    assert.equal(links[data.students[0].id][0].relation,'Bố');
    assert.equal((await req('/profile','PUT',{name:'Tên cha đã xác nhận',phone:'0912345678',email:''},fatherAccount)).status,200);
    assert.equal((await req('/parent-links','GET',undefined,owner)).body.links[data.students[0].id][0].name,'Tên cha đã xác nhận');
    const motherLogin=await req('/auth/login','POST',{username:'0987654321',password:'12345678'});
    assert.equal((await req('/parent-links','GET',undefined,owner)).body.links[data.students[0].id].length,1);
    assert.equal((await req('/auth/password','POST',{currentPassword:'12345678',password:'Mother-new-password'},session(motherLogin))).status,200);
    links=(await req('/parent-links','GET',undefined,owner)).body.links;
    assert.equal(links[data.students[0].id].length,2);assert.equal(links[data.students[1].id].length,1);
    assert.deepEqual(links[data.students[0].id].map(p=>p.phone),['0912345678','0987654321']);
    assert.equal((await req('/state','GET',undefined,owner)).body.revision,1);
    assert.equal((await req('/users/reset-password','POST',{id:father.id},owner)).status,200);
    assert.equal((await req('/parent-links','GET',undefined,owner)).body.links[data.students[0].id].length,1);
    const again=await req('/auth/login','POST',{username:'0912345678',password:'12345678'});
    assert.equal((await req('/auth/password','POST',{currentPassword:'12345678',password:'Father-second-password'},session(again))).status,200);
    assert.equal((await req('/parent-links','GET',undefined,owner)).body.links[data.students[0].id].length,2);
    const other=await req('/classes','POST',{name:'Lớp khác',schoolName:'Trường khác'},owner);
    assert.equal((await req('/users/access','PUT',{id:father.id,role:'viewer',classIds:[other.body.id]},owner)).status,200);
    assert.equal((await req('/parent-links','GET',undefined,owner)).body.links[data.students[0].id].length,1);
    assert.equal((await req('/parent-links?classId='+other.body.id,'GET',undefined,owner)).status,200);
    assert.equal((await req('/parent-links?classId=unknown','GET',undefined,owner)).status,403);
  }finally{await new Promise(r=>app.server.close(r));app.db.close();}
});

test('CSV supports second parents and Google Sheet headers while preserving legacy five-column imports',()=>{
  const parsed=parseStudentsCSV('Họ Tên Học Sinh,Số Điện Thoại HS,Họ Tên Phụ Huynh,Vai trò (Cha/Mẹ/Khác)),,Số Điện Thoại Phụ Huynh 1,Số Điện Thoại Phụ Huynh 2,Địa Chỉ Nhà\nNguyễn An,,Nguyễn Bình,Cha,,0912345678,0987654321,');
  assert.equal(parsed[0].parentPhone,'0912345678');assert.equal(parsed[0].parentPhone2,'0987654321');
  assert.equal(parsed[0].relation,'Cha');
  assert.equal(validateData({...createDemo(),students:parsed,groups:[]}),true);
  assert.throws(()=>parseStudentsCSV('Tên HS,Tên PH,Địa chỉ,SĐT HS,SĐT PH,SĐT PH 2\nAn,Bình,,,0912345678,+84 912 345 678'),/trùng/);
});

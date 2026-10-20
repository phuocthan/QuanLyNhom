import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { openDatabase, loadState, saveState, emptyClassroom } from './database.mjs';
import { hashPassword, verifyPassword, createSession, readSession, publicUser, sessionCookie, safeEqual, normalizePhone } from './auth.mjs';

const ROOT=fileURLToPath(new URL('../dist/',import.meta.url));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.csv':'text/csv; charset=utf-8','.webmanifest':'application/manifest+json'};
export function createApp(config={}) {
  const production=config.production??process.env.NODE_ENV==='production';
  const db=openDatabase(config.databasePath||process.env.DATABASE_PATH||'.local/cung-hoc.sqlite');
  const setupKey=config.setupKey??process.env.SETUP_KEY??'';
  const publicUrl=config.publicUrl||process.env.APP_PUBLIC_URL||(production&&process.env.RAILWAY_PUBLIC_DOMAIN?`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`:'');
  const configuredOrigin=publicUrl?new URL(publicUrl.trim()).origin:null;
  const canAccess=(user,id)=>user.role==='owner'||!!db.prepare('SELECT 1 FROM class_access WHERE user_id=? AND class_id=?').get(user.id,id);
  const classList=user=>db.prepare('SELECT id FROM class_spaces ORDER BY rowid').all().filter(row=>canAccess(user,row.id)).map(row=>{const {data,revision}=loadState(db,row.id);return {id:row.id,name:data.className,schoolName:data.schoolName,students:data.students.length,revision};});
  const attempts=new Map();
  const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(value));};
  const setupRequired=()=>!db.prepare('SELECT id FROM users LIMIT 1').get();
  function limited(key){
    const now=Date.now();if(attempts.size>10000)for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);
    let current=attempts.get(key);if(!current||current.until<now){current={count:0,until:now+15*60000};attempts.set(key,current);}return ++current.count>15;
  }
  async function body(req){
    let bytes=0,chunks=[];
    for await(const chunk of req){bytes+=chunk.length;if(bytes>10*1024*1024)throw Object.assign(Error('Tệp dữ liệu vượt 10 MB.'),{status:413});chunks.push(chunk);}
    try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(Error('Nội dung JSON không hợp lệ.'),{status:400});}
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Frame-Options','DENY');
    const origin=configuredOrigin||`${production?'https':'http'}://${req.headers.host}`;
    let url;try{url=new URL(req.url,origin);}catch{return json(res,400,{error:'Đường dẫn không hợp lệ.'});}
    try{
      if(url.pathname==='/api/health')return json(res,200,{ok:true,storage:'sqlite',demo:false});
      if(url.pathname==='/runtime.js'){res.writeHead(200,{'Content-Type':TYPES['.js'],'Cache-Control':'no-store'}).end('window.CUNG_HOC_STORAGE="server";');return;}
      if(!url.pathname.startsWith('/api/')){
        if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Phương thức không được hỗ trợ.'});
        const filename=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
        if(!filename.startsWith(ROOT))return json(res,403,{error:'Không được phép truy cập.'});
        const bytes=await readFile(filename);res.writeHead(200,{'Content-Type':TYPES[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'}).end(req.method==='HEAD'?undefined:bytes);return;
      }
      const mutation=!['GET','HEAD'].includes(req.method);
      if(mutation&&(req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json')))return json(res,403,{error:'Yêu cầu không cùng nguồn hoặc sai định dạng.'});
      const user=readSession(db,req);
      if(url.pathname==='/api/auth/session'&&req.method==='GET')return json(res,200,{authenticated:!!user,setupRequired:setupRequired(),...(user?{user:publicUser(user),csrfToken:user.csrf_token}:{})});
      if(url.pathname==='/api/auth/setup'&&req.method==='POST'){
        const key='setup:'+req.socket.remoteAddress;if(limited(key))return json(res,429,{error:'Thử quá nhiều lần. Vui lòng chờ 15 phút.'});
        if(!setupRequired())return json(res,409,{error:'Tài khoản quản trị đã được tạo. Vui lòng đăng nhập.'});
        const input=await body(req);
        if((production&&!setupKey)||(setupKey&&!safeEqual(String(input.setupKey||''),setupKey)))return json(res,403,{error:'Mã thiết lập không đúng.'});
        const {email,name,password}=input;
        if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||email.length>200||typeof name!=='string'||!name.trim()||name.length>100||typeof password!=='string'||password.length<12||password.length>200)return json(res,400,{error:'Điền tên, email hợp lệ và mật khẩu từ 12–200 ký tự.'});
        const passwordHash=await hashPassword(password);
        db.exec('BEGIN IMMEDIATE');
        try{if(!setupRequired()){db.exec('ROLLBACK');return json(res,409,{error:'Tài khoản quản trị đã được tạo.'});}db.prepare('INSERT INTO users(id,email,name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),email.trim().toLowerCase(),name.trim(),passwordHash,'owner',new Date().toISOString());db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
        const owner=db.prepare('SELECT * FROM users LIMIT 1').get(),session=createSession(db,owner.id);res.setHeader('Set-Cookie',sessionCookie(session.token,production));return json(res,201,{user:publicUser(owner),csrfToken:session.csrf});
      }
      if(url.pathname==='/api/auth/login'&&req.method==='POST'){
        const input=await body(req),login=input.username??input.email;if(typeof login!=='string'||login.length>200||typeof input.password!=='string'||input.password.length>200)return json(res,400,{error:'Tên đăng nhập hoặc mật khẩu không hợp lệ.'});
        if(limited('login:'+req.socket.remoteAddress+':'+login.toLowerCase().slice(0,200)))return json(res,429,{error:'Thử quá nhiều lần. Vui lòng chờ 15 phút.'});
        const account=db.prepare('SELECT * FROM users WHERE email=? OR phone=?').get(login.trim().toLowerCase(),normalizePhone(login)||null);
        if(!account||!await verifyPassword(input.password,account.password_hash))return json(res,401,{error:'Số điện thoại / email hoặc mật khẩu không đúng.'});
        const session=createSession(db,account.id);res.setHeader('Set-Cookie',sessionCookie(session.token,production));return json(res,200,{user:publicUser(account),csrfToken:session.csrf});
      }
      if(!user)return json(res,401,{error:'Vui lòng đăng nhập để xem dữ liệu lớp.'});
      if(mutation&&!safeEqual(String(req.headers['x-csrf-token']||''),user.csrf_token))return json(res,403,{error:'Phiên xác thực không hợp lệ. Tải lại trang.'});
      if(url.pathname==='/api/auth/logout'&&req.method==='POST'){db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(user.token_hash);res.setHeader('Set-Cookie',sessionCookie('',production,0));return json(res,200,{ok:true});}
      if(url.pathname==='/api/auth/password'&&req.method==='POST'){
        const input=await body(req),account=db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
        if(typeof input.currentPassword!=='string'||input.currentPassword.length>200||typeof input.password!=='string'||input.password.length<8||input.password.length>200||input.password===input.currentPassword||input.password==='12345678')return json(res,400,{error:'Mật khẩu mới cần 8–200 ký tự, khác mật khẩu cũ và khác mật khẩu mặc định.'});
        if(limited('password:'+user.id))return json(res,429,{error:'Thử quá nhiều lần. Vui lòng chờ 15 phút.'});
        if(!await verifyPassword(input.currentPassword,account.password_hash))return json(res,403,{error:'Mật khẩu hiện tại không đúng.'});
        const hash=await hashPassword(input.password);
        db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?').run(hash,user.id);db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
        const session=createSession(db,user.id);res.setHeader('Set-Cookie',sessionCookie(session.token,production));return json(res,200,{user:publicUser({...account,must_change_password:0}),csrfToken:session.csrf});
      }
      if(user.must_change_password)return json(res,403,{error:'Vui lòng đổi mật khẩu mặc định trước khi sử dụng.',mustChangePassword:true});
      if(url.pathname==='/api/profile'&&req.method==='PUT'){
        const input=await body(req),phone=normalizePhone(input.phone);
        if(typeof input.name!=='string'||!input.name.trim()||input.name.length>100)return json(res,400,{error:'Nhập tên từ 1–100 ký tự.'});
        if(user.role!=='owner'&&(input.phone!==user.phone||input.email!==publicUser(user).email))return json(res,403,{error:'Liên hệ admin để đổi số điện thoại đăng nhập.'});
        const email=user.role==='owner'?String(input.email||'').trim().toLowerCase():user.email;
        if(user.role==='owner'&&(!/^\S+@\S+\.\S+$/.test(email)||email.length>200||(input.phone&&!phone)))return json(res,400,{error:'Email hoặc số điện thoại không hợp lệ.'});
        try{db.prepare('UPDATE users SET name=?,email=?,phone=? WHERE id=?').run(input.name.trim(),email,phone||null,user.id);}catch(error){if(error.message.includes('UNIQUE'))return json(res,409,{error:'Email hoặc số điện thoại đã được sử dụng.'});throw error;}
        return json(res,200,{user:publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
      }
      if(url.pathname==='/api/classes'&&req.method==='GET')return json(res,200,{classes:classList(user)});
      if(url.pathname==='/api/classes'&&req.method==='POST'&&user.role==='owner'){
        const input=await body(req);
        if(typeof input.name!=='string'||!input.name.trim()||input.name.length>80||typeof input.schoolName!=='string'||!input.schoolName.trim()||input.schoolName.length>150)return json(res,400,{error:'Nhập tên lớp và trường hợp lệ.'});
        const id=randomUUID(),data={...emptyClassroom(),className:input.name.trim(),schoolName:input.schoolName.trim()};
        db.prepare('INSERT INTO class_spaces VALUES(?,?,0,?)').run(id,JSON.stringify(data),new Date().toISOString());return json(res,201,{id,classes:classList(user)});
      }
      const classId=url.searchParams.get('classId')||'default';
      if(url.pathname==='/api/state'&&(!db.prepare('SELECT 1 FROM class_spaces WHERE id=?').get(classId)||!canAccess(user,classId)))return json(res,403,{error:'Bạn chưa được cấp quyền vào lớp này.'});
      if(url.pathname==='/api/state'&&req.method==='GET')return json(res,200,loadState(db,classId));
      if(url.pathname==='/api/state'&&req.method==='PUT'){
        if(user.role==='viewer')return json(res,403,{error:'Tài khoản chỉ có quyền xem.'});
        const input=await body(req);
        if(user.role!=='owner'){
          const current=loadState(db,classId).data;
          if(input.data?.className!==current.className||input.data?.schoolName!==current.schoolName)return json(res,403,{error:'Chỉ admin có quyền đổi thông tin lớp.'});
        }
        const result=saveState(db,input.data,input.revision,user.id,classId);
        if(result.error==='conflict')return json(res,409,{error:'Thiết bị khác đã cập nhật lớp. Tải bản mới trước khi sửa tiếp.',revision:result.revision});
        if(result.error)return json(res,400,{error:'Dữ liệu lớp không hợp lệ.'});return json(res,200,result);
      }
      if(url.pathname==='/api/users'&&req.method==='GET'&&user.role==='owner')return json(res,200,{users:db.prepare('SELECT * FROM users ORDER BY created_at').all().map(u=>({...publicUser(u),classIds:db.prepare('SELECT class_id FROM class_access WHERE user_id=?').all(u.id).map(r=>r.class_id)}))});
      if(url.pathname==='/api/users'&&req.method==='POST'&&user.role==='owner'){
        const input=await body(req);
        const phone=normalizePhone(input.phone),classIds=Array.isArray(input.classIds)?[...new Set(input.classIds)]:[classId];
        if(typeof input.name!=='string'||!input.name.trim()||input.name.length>100||!phone||!['editor','viewer'].includes(input.role)||!classIds.length||classIds.some(id=>typeof id!=='string'||!db.prepare('SELECT 1 FROM class_spaces WHERE id=?').get(id)))return json(res,400,{error:'Nhập tên, số điện thoại hợp lệ và chọn ít nhất một lớp.'});
        const hash=await hashPassword('12345678'),id=randomUUID();
        db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO users(id,email,name,password_hash,role,created_at,phone,must_change_password) VALUES(?,?,?,?,?,?,?,1)').run(id,phone+'@phone.internal',input.name.trim(),hash,input.role,new Date().toISOString(),phone);for(const target of classIds)db.prepare('INSERT INTO class_access VALUES(?,?)').run(id,target);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');if(error.message.includes('UNIQUE'))return json(res,409,{error:'Số điện thoại này đã có tài khoản. Hãy cập nhật quyền lớp cho tài khoản hiện có.'});throw error;}return json(res,201,{ok:true});
      }
      if(url.pathname==='/api/users/from-students'&&req.method==='POST'&&user.role==='owner'){
        if(!db.prepare('SELECT 1 FROM class_spaces WHERE id=?').get(classId))return json(res,404,{error:'Không tìm thấy lớp.'});
        const {data}=loadState(db,classId),parents=new Map();let skipped=0;
        for(const s of data.students){const phone=normalizePhone(s.parentPhone);if(!phone||s.demo||!s.parent?.trim()){skipped++;continue;}parents.set(phone,s.parent.trim());}
        const hash=await hashPassword('12345678');let created=0,linked=0;
        db.exec('BEGIN IMMEDIATE');try{for(const [phone,name] of parents){let account=db.prepare('SELECT id,role FROM users WHERE phone=?').get(phone);if(!account){account={id:randomUUID()};db.prepare('INSERT INTO users(id,email,name,password_hash,role,created_at,phone,must_change_password) VALUES(?,?,?,?,?,?,?,1)').run(account.id,phone+'@phone.internal',name,hash,'viewer',new Date().toISOString(),phone);created++;}if(account.role!=='owner')linked+=db.prepare('INSERT OR IGNORE INTO class_access VALUES(?,?)').run(account.id,classId).changes;}db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}return json(res,201,{created,linked,skipped});
      }
      if(url.pathname==='/api/users/access'&&req.method==='PUT'&&user.role==='owner'){
        const input=await body(req),account=db.prepare('SELECT id,role FROM users WHERE id=?').get(String(input.id||'')),ids=Array.isArray(input.classIds)?[...new Set(input.classIds)]:[];
        if(!account||account.role==='owner'||!['editor','viewer'].includes(input.role)||!ids.length||ids.some(id=>typeof id!=='string'||!db.prepare('SELECT 1 FROM class_spaces WHERE id=?').get(id)))return json(res,400,{error:'Chọn tài khoản, quyền và ít nhất một lớp hợp lệ.'});
        db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET role=? WHERE id=?').run(input.role,account.id);db.prepare('DELETE FROM class_access WHERE user_id=?').run(account.id);for(const id of ids)db.prepare('INSERT INTO class_access VALUES(?,?)').run(account.id,id);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}return json(res,200,{ok:true});
      }
      if(url.pathname==='/api/users/reset-password'&&req.method==='POST'&&user.role==='owner'){
        const input=await body(req),account=db.prepare('SELECT id FROM users WHERE id=? AND role!=?').get(String(input.id||''),'owner');
        if(!account)return json(res,404,{error:'Không tìm thấy tài khoản phụ huynh.'});
        const hash=await hashPassword('12345678');db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE users SET password_hash=?,must_change_password=1 WHERE id=?').run(hash,account.id);db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(account.id);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}return json(res,200,{ok:true});
      }
      return json(res,404,{error:'Không tìm thấy chức năng.'});
    }catch(error){if(error.code==='ENOENT')return json(res,404,{error:'Không tìm thấy tệp.'});console.error('Request failed:',error.code||error.name);if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'Không lưu được dữ liệu. Vui lòng thử lại.'});}
  });
  return {server,db};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {server,db}=createApp();const port=Number(process.env.PORT||5173);
  server.listen(port,'0.0.0.0',()=>console.log(`Học Nhóm ready on port ${port}; SQLite storage enabled.`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
}

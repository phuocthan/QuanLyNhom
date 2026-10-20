import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { openDatabase, loadState, saveState } from './database.mjs';
import { hashPassword, verifyPassword, createSession, readSession, publicUser, sessionCookie, safeEqual } from './auth.mjs';

const ROOT=fileURLToPath(new URL('../dist/',import.meta.url));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.csv':'text/csv; charset=utf-8','.webmanifest':'application/manifest+json'};
export function createApp(config={}) {
  const production=config.production??process.env.NODE_ENV==='production';
  const db=openDatabase(config.databasePath||process.env.DATABASE_PATH||'.local/cung-hoc.sqlite');
  const setupKey=config.setupKey??process.env.SETUP_KEY??'';
  const publicUrl=config.publicUrl||process.env.APP_PUBLIC_URL||'';
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
    const origin=publicUrl?new URL(publicUrl).origin:`http://${req.headers.host}`;
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
        try{if(!setupRequired()){db.exec('ROLLBACK');return json(res,409,{error:'Tài khoản quản trị đã được tạo.'});}db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(randomUUID(),email.trim().toLowerCase(),name.trim(),passwordHash,'owner',new Date().toISOString());db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
        const owner=db.prepare('SELECT * FROM users LIMIT 1').get(),session=createSession(db,owner.id);res.setHeader('Set-Cookie',sessionCookie(session.token,production));return json(res,201,{user:publicUser(owner),csrfToken:session.csrf});
      }
      if(url.pathname==='/api/auth/login'&&req.method==='POST'){
        const input=await body(req);if(typeof input.email!=='string'||typeof input.password!=='string'||input.password.length>200)return json(res,400,{error:'Email hoặc mật khẩu không hợp lệ.'});
        if(limited('login:'+req.socket.remoteAddress+':'+input.email.toLowerCase().slice(0,200)))return json(res,429,{error:'Thử quá nhiều lần. Vui lòng chờ 15 phút.'});
        const account=db.prepare('SELECT * FROM users WHERE email=?').get(input.email.trim().toLowerCase());
        if(!account||!await verifyPassword(input.password,account.password_hash))return json(res,401,{error:'Email hoặc mật khẩu không đúng.'});
        const session=createSession(db,account.id);res.setHeader('Set-Cookie',sessionCookie(session.token,production));return json(res,200,{user:publicUser(account),csrfToken:session.csrf});
      }
      if(!user)return json(res,401,{error:'Vui lòng đăng nhập để xem dữ liệu lớp.'});
      if(mutation&&!safeEqual(String(req.headers['x-csrf-token']||''),user.csrf_token))return json(res,403,{error:'Phiên xác thực không hợp lệ. Tải lại trang.'});
      if(url.pathname==='/api/auth/logout'&&req.method==='POST'){db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(user.token_hash);res.setHeader('Set-Cookie',sessionCookie('',production,0));return json(res,200,{ok:true});}
      if(url.pathname==='/api/state'&&req.method==='GET')return json(res,200,loadState(db));
      if(url.pathname==='/api/state'&&req.method==='PUT'){
        if(user.role==='viewer')return json(res,403,{error:'Tài khoản chỉ có quyền xem.'});
        const input=await body(req),result=saveState(db,input.data,input.revision,user.id);
        if(result.error==='conflict')return json(res,409,{error:'Thiết bị khác đã cập nhật lớp. Tải bản mới trước khi sửa tiếp.',revision:result.revision});
        if(result.error)return json(res,400,{error:'Dữ liệu lớp không hợp lệ.'});return json(res,200,result);
      }
      if(url.pathname==='/api/users'&&req.method==='GET'&&user.role==='owner')return json(res,200,{users:db.prepare('SELECT id,email,name,role FROM users ORDER BY created_at').all()});
      if(url.pathname==='/api/users'&&req.method==='POST'&&user.role==='owner'){
        const input=await body(req);
        if(typeof input.name!=='string'||!input.name.trim()||input.name.length>100||typeof input.email!=='string'||!/^\S+@\S+\.\S+$/.test(input.email)||input.email.length>200||typeof input.password!=='string'||input.password.length<12||input.password.length>200||!['editor','viewer'].includes(input.role))return json(res,400,{error:'Điền tên, email, quyền và mật khẩu từ 12–200 ký tự.'});
        const hash=await hashPassword(input.password);try{db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(randomUUID(),input.email.trim().toLowerCase(),input.name.trim(),hash,input.role,new Date().toISOString());}catch(error){if(error.message.includes('UNIQUE'))return json(res,409,{error:'Email này đã có tài khoản.'});throw error;}return json(res,201,{ok:true});
      }
      return json(res,404,{error:'Không tìm thấy chức năng.'});
    }catch(error){if(error.code==='ENOENT')return json(res,404,{error:'Không tìm thấy tệp.'});console.error('Request failed:',error.code||error.name);if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'Không lưu được dữ liệu. Vui lòng thử lại.'});}
  });
  return {server,db};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {server,db}=createApp();const port=Number(process.env.PORT||5173);
  server.listen(port,'0.0.0.0',()=>console.log(`Cùng học ready on port ${port}; SQLite storage enabled.`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
}

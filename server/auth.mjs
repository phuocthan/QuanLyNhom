import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive=promisify(scrypt);
export const hashToken=token=>createHash('sha256').update(token).digest('hex');
export const safeEqual=(a,b)=>{const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);};
export async function hashPassword(value){const salt=randomBytes(16).toString('hex');return `${salt}:${(await derive(value,salt,64)).toString('hex')}`;}
export async function verifyPassword(value,stored){const [salt,hash]=stored.split(':');return safeEqual((await derive(value,salt,64)).toString('hex'),hash);}
export function createSession(db,userId){
  const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url'),expires=Date.now()+7*86400000;
  db.prepare('DELETE FROM auth_sessions WHERE expires_at<?').run(Date.now());
  db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?)').run(hashToken(token),userId,csrf,expires);
  return {token,csrf,expires};
}
export function readSession(db,req){
  const cookies=String(req.headers.cookie||'').split(';').map(x=>x.trim());
  const token=cookies.find(x=>x.startsWith('cung_hoc_session='))?.slice(17);
  if(!token||token.length>100)return null;
  return db.prepare('SELECT u.id,u.email,u.name,u.phone,u.must_change_password,u.role,s.csrf_token,s.token_hash FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires_at>?').get(hashToken(token),Date.now())||null;
}
export const publicUser=user=>({id:user.id,email:user.email.endsWith('@phone.internal')?'':user.email,name:user.name,phone:user.phone||'',role:user.role,mustChangePassword:!!user.must_change_password});
export const normalizePhone=value=>{let phone=String(value||'').replace(/[\s().-]/g,'');if(phone.startsWith('+84'))phone='0'+phone.slice(3);else if(phone.startsWith('84')&&phone.length===11)phone='0'+phone.slice(2);return /^0[35789]\d{8}$/.test(phone)?phone:'';};
export const sessionCookie=(token,secure=false,maxAge=604800)=>`cung_hoc_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;

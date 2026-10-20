const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class CloudStore {
  constructor(){this.revision=0;this.data=null;this.user=null;this.csrf='';this.busy=false;this.pending=null;this.classId='default';this.classes=[];}
  async request(path,options={}){
    let response;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{response=await fetch('/api'+path,{...options,signal:controller.signal,credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':this.csrf,...options.headers}});}catch{throw Object.assign(Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'),{status:0});}finally{clearTimeout(timer);}
    let result;try{result=await response.json();}catch{throw Object.assign(Error('Máy chủ tạm thời chưa sẵn sàng. Vui lòng thử lại.'),{status:response.status});}if(!response.ok)throw Object.assign(Error(result.error||'Không thực hiện được yêu cầu.'),{status:response.status});return result;
  }
  statePath(){return '/state?classId='+encodeURIComponent(this.classId);}
  async loadClasses(){const result=await this.request('/classes');this.classes=result.classes;return this.classes;}
  async load(){const result=await this.request(this.statePath());this.data=result.data;this.revision=result.revision;return result;}
  async save(data){const result=await this.request(this.statePath(),{method:'PUT',body:JSON.stringify({data,revision:this.revision})});this.data=structuredClone(data);this.revision=result.revision;this.pending=null;return result;}
  async logout(){await this.request('/auth/logout',{method:'POST',body:'{}'});location.reload();}
  async addUser(data){return this.request('/users?classId='+encodeURIComponent(this.classId),{method:'POST',body:JSON.stringify(data)});}
}

export async function connectCloud(){
  const store=new CloudStore();
  const root=document.createElement('section');root.id='auth-root';root.setAttribute('aria-label','Đăng nhập Học Nhóm');document.body.append(root);document.body.classList.add('auth-mode');
  const fragment=new URLSearchParams(location.hash.slice(1));
  const setupKey=fragment.get('setup')||'';
  if(setupKey)history.replaceState(null,'',location.pathname+location.search);
  root.innerHTML='<div class="auth-card"><img src="/icon.svg" width="52" height="52" alt=""><h1>Học Nhóm</h1><p>Đang kết nối dữ liệu lớp học…</p></div>';
  let auth;
  try{auth=await store.request('/auth/session');}catch(error){root.innerHTML=`<div class="auth-card"><h1>Chưa kết nối được</h1><p>${esc(error.message)}</p><button class="btn primary" id="auth-retry">Thử lại</button></div>`;root.querySelector('button').onclick=()=>location.reload();return new Promise(()=>{});}
  if(!auth.authenticated){
    const setup=auth.setupRequired;
    root.innerHTML=`<div class="auth-card"><a class="auth-brand" href="/"><img src="/icon.svg" width="48" height="48" alt=""><strong>Học Nhóm</strong></a><h1>${setup?'Tạo tài khoản quản trị':'Đăng nhập'}</h1><p>${setup?'Thiết lập một lần cho không gian học nhóm riêng của bạn.':'Theo dõi lớp học, lịch học nhóm và kết nối với phụ huynh.'}</p><form id="auth-form"><div class="form-error" role="alert"></div><div class="form-grid">${setup?'<div class="field full"><label for="auth-name">Tên của bạn</label><input id="auth-name" name="name" required maxlength="100" autocomplete="name"></div>':''}<div class="field full"><label for="auth-email">${setup?'Email quản trị':'Số điện thoại / Email admin'}</label><input type="${setup?'email':'text'}" id="auth-email" name="${setup?'email':'username'}" required maxlength="200" autocomplete="username" placeholder="${setup?'admin@example.com':'Số điện thoại đã được admin cấp'}"></div><div class="field full"><label for="auth-password">Mật khẩu${setup?' (ít nhất 12 ký tự)':''}</label><input type="password" id="auth-password" name="password" required ${setup?'minlength="12"':''} maxlength="200" autocomplete="${setup?'new-password':'current-password'}"></div>${setup?'<div class="field full" id="setup-key-field"><label for="auth-setup">Mã thiết lập</label><input id="auth-setup" name="setupKey" autocomplete="off" type="password"><small>Mã nằm trong đường dẫn thiết lập riêng được cung cấp khi triển khai.</small></div>':''}</div><button type="submit" class="btn primary auth-submit">${setup?'Tạo tài khoản & bắt đầu':'Đăng nhập'}</button></form><p class="auth-footnote">Phụ huynh dùng số điện thoại đã được admin thêm vào danh sách. Mật khẩu lần đầu: <strong>12345678</strong>. Bạn sẽ được yêu cầu đổi mật khẩu sau khi đăng nhập.</p><a class="admin-contact" href="https://zalo.me/0975163361" target="_blank" rel="noopener noreferrer">Liên hệ Zalo admin · 0975 163 361 ↗</a></div>`;
    if(setupKey&&setup){root.querySelector('[name=setupKey]').value=setupKey;root.querySelector('#setup-key-field').classList.add('hidden');}
    await new Promise(resolve=>{
      root.querySelector('form').onsubmit=async e=>{
        e.preventDefault();const form=e.target,error=form.querySelector('.form-error'),button=form.querySelector('button[type=submit]');error.textContent='';button.disabled=true;button.textContent='Đang xử lý…';
        try{const input=Object.fromEntries(new FormData(form));auth=await store.request(setup?'/auth/setup':'/auth/login',{method:'POST',body:JSON.stringify(input)});resolve();}
        catch(reason){error.textContent=reason.message;button.disabled=false;button.textContent=setup?'Tạo tài khoản & bắt đầu':'Đăng nhập';}
      };
    });
  }
  store.user=auth.user;store.csrf=auth.csrfToken;
  if(store.user.mustChangePassword)await requirePasswordChange(store,root);
  try{
    await store.loadClasses();
    let preferred;try{preferred=sessionStorage.getItem('hoc-nhom-class');}catch{}
    store.classId=store.classes.some(c=>c.id===preferred)?preferred:store.classes[0]?.id;
    if(!store.classId)throw Error('Bạn chưa được cấp lớp học. Liên hệ Zalo admin 0975 163 361.');
  }catch(error){root.innerHTML=`<div class="auth-card"><h1>Chưa có lớp học</h1><p>${esc(error.message)}</p><a class="admin-contact" href="https://zalo.me/0975163361">Liên hệ Zalo admin</a><button class="btn" id="auth-logout">Đăng xuất</button></div>`;root.querySelector('button').onclick=()=>store.logout();return new Promise(()=>{});}

  try{await store.load();}catch(error){root.innerHTML=`<div class="auth-card"><h1>Chưa tải được lớp học</h1><p>${esc(error.message)}</p><button class="btn primary" id="auth-retry">Tải lại</button></div>`;root.querySelector('button').onclick=()=>location.reload();return new Promise(()=>{});}
  root.remove();document.body.classList.remove('auth-mode');return store;
}

export function passwordFields(){return '<div class="field full"><label for="current-password">Mật khẩu hiện tại</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required maxlength="200"></div><div class="field full"><label for="new-password">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="new-password" name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="200"></div><div class="field full"><label for="confirm-password">Nhập lại mật khẩu mới</label><input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="200"></div>';}
export async function changePassword(store,form){
  const input=Object.fromEntries(new FormData(form));
  if(input.password!==input.confirmPassword)throw Error('Hai lần nhập mật khẩu mới chưa khớp.');
  const result=await store.request('/auth/password',{method:'POST',body:JSON.stringify(input)});store.user=result.user;store.csrf=result.csrfToken;
}
async function requirePasswordChange(store,root){
  root.innerHTML=`<div class="auth-card"><a class="auth-brand" href="/"><img src="/icon.svg" width="48" height="48" alt=""><strong>Học Nhóm</strong></a><h1>Đổi mật khẩu lần đầu</h1><p>Chào ${esc(store.user.name)}, hãy thay mật khẩu mặc định để bắt đầu sử dụng lớp học.</p><form id="first-password-form"><div class="form-error" role="alert"></div><div class="form-grid">${passwordFields()}</div><button class="btn primary auth-submit" type="submit">Đổi mật khẩu & tiếp tục</button></form><button class="btn auth-submit" id="change-logout">Đăng xuất</button></div>`;
  root.querySelector('#change-logout').onclick=()=>store.logout();
  await new Promise(resolve=>{root.querySelector('form').onsubmit=async e=>{e.preventDefault();const form=e.target,button=form.querySelector('button');button.disabled=true;form.querySelector('.form-error').textContent='';try{await changePassword(store,form);resolve();}catch(error){form.querySelector('.form-error').textContent=error.message;}finally{button.disabled=false;}};});
}

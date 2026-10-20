const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class CloudStore {
  constructor(){this.revision=0;this.data=null;this.user=null;this.csrf='';this.busy=false;this.pending=null;}
  async request(path,options={}){
    let response;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{response=await fetch('/api'+path,{...options,signal:controller.signal,credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':this.csrf,...options.headers}});}catch{throw Object.assign(Error('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'),{status:0});}finally{clearTimeout(timer);}
    let result;try{result=await response.json();}catch{throw Object.assign(Error('Máy chủ tạm thời chưa sẵn sàng. Vui lòng thử lại.'),{status:response.status});}if(!response.ok)throw Object.assign(Error(result.error||'Không thực hiện được yêu cầu.'),{status:response.status});return result;
  }
  async load(){const result=await this.request('/state');this.data=result.data;this.revision=result.revision;return result;}
  async save(data){const result=await this.request('/state',{method:'PUT',body:JSON.stringify({data,revision:this.revision})});this.data=structuredClone(data);this.revision=result.revision;this.pending=null;return result;}
  async logout(){await this.request('/auth/logout',{method:'POST',body:'{}'});location.reload();}
  async addUser(data){return this.request('/users',{method:'POST',body:JSON.stringify(data)});}
}

export async function connectCloud(){
  const store=new CloudStore();
  const root=document.createElement('section');root.id='auth-root';root.setAttribute('aria-label','Đăng nhập Cùng học');document.body.append(root);document.body.classList.add('auth-mode');
  const fragment=new URLSearchParams(location.hash.slice(1));
  const setupKey=fragment.get('setup')||'';
  if(setupKey)history.replaceState(null,'',location.pathname+location.search);
  root.innerHTML='<div class="auth-card"><img src="/icon.svg" width="52" height="52" alt=""><h1>Cùng học</h1><p>Đang kết nối dữ liệu lớp học…</p></div>';
  let auth;
  try{auth=await store.request('/auth/session');}catch(error){root.innerHTML=`<div class="auth-card"><h1>Chưa kết nối được</h1><p>${esc(error.message)}</p><button class="btn primary" id="auth-retry">Thử lại</button></div>`;root.querySelector('button').onclick=()=>location.reload();return new Promise(()=>{});}
  if(!auth.authenticated){
    const setup=auth.setupRequired;
    root.innerHTML=`<div class="auth-card"><a class="auth-brand" href="/"><img src="/icon.svg" width="48" height="48" alt=""><strong>Cùng học</strong></a><h1>${setup?'Tạo tài khoản quản trị':'Chào bạn trở lại'}</h1><p>${setup?'Thiết lập một lần cho không gian học nhóm riêng của bạn.':'Đăng nhập để dùng cùng dữ liệu lớp học trên điện thoại và máy tính.'}</p><form id="auth-form"><div class="form-error" role="alert"></div><div class="form-grid">${setup?'<div class="field full"><label for="auth-name">Tên của bạn</label><input id="auth-name" name="name" required maxlength="100" autocomplete="name"></div>':''}<div class="field full"><label for="auth-email">Email</label><input type="email" id="auth-email" name="email" required maxlength="200" autocomplete="username"></div><div class="field full"><label for="auth-password">Mật khẩu${setup?' (ít nhất 12 ký tự)':''}</label><input type="password" id="auth-password" name="password" required ${setup?'minlength="12"':''} maxlength="200" autocomplete="${setup?'new-password':'current-password'}"></div>${setup?'<div class="field full" id="setup-key-field"><label for="auth-setup">Mã thiết lập</label><input id="auth-setup" name="setupKey" autocomplete="off" type="password"><small>Mã nằm trong đường dẫn thiết lập riêng được cung cấp khi triển khai.</small></div>':''}</div><button type="submit" class="btn primary auth-submit">${setup?'Tạo tài khoản & bắt đầu':'Đăng nhập'}</button></form><p class="auth-footnote">Database riêng cho Cùng học. Chỉ tài khoản được quản trị viên cấp quyền mới truy cập được.</p></div>`;
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
  try{await store.load();}catch(error){root.innerHTML=`<div class="auth-card"><h1>Chưa tải được lớp học</h1><p>${esc(error.message)}</p><button class="btn primary" id="auth-retry">Tải lại</button></div>`;root.querySelector('button').onclick=()=>location.reload();return new Promise(()=>{});}
  root.remove();document.body.classList.remove('auth-mode');return store;
}

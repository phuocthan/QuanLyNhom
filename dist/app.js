import { studentParents, parentPhoneKey, STORAGE_KEY, localDate, uid, fold, createDemo, validateData, normalizeData, validDate, snapshotSession, allSessions } from './data.js';
import { parseStudentsCSV, studentKey } from './csv.js';
import { connectCloud, passwordFields, changePassword } from './cloud.js';

const paths = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  book:'<path d="M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2zM12 6v15"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8"/><circle cx="9" cy="7" r="4"/>',
  group:'<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M4 4a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M4 14a4 4 0 0 0-3 4v2m19-6a4 4 0 0 1 3 4v2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-12 4h2m3 0h2m-7 3h2"/>',
  search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  left:'<path d="m15 5-7 7 7 7"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>',
  settings:'<path d="m9 3 1-2h4l1 2 2 1 2-.2 2 3.4-1.2 1.8v2l1.2 1.8-2 3.4-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3.4L4.2 11V9L3 7.2l2-3.4L7 4Z" transform="translate(0 2)"/><circle cx="12" cy="12" r="3"/>',
  school:'<path d="m2 10 10-7 10 7M4 9v12h16V9M9 21v-7h6v7M10 8h4"/>',
  edit:'<path d="m16 3 5 5M4 20l4-1L21 6a2 2 0 0 0-3-3L5 16z"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload:'<path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  leaf:'<path d="M20 3C8 1 2 9 5 16c8 6 17 0 15-13ZM4 21 16 9m-7 7v-6m0 6h6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  rocket:'<path d="M8 14C8 7 14 2 22 2c0 8-5 14-12 14M8 9H4l-3 6 7-1m7 2v4l-6 3 1-7M5 19l-3 3"/><circle cx="16" cy="8" r="2"/>',
  math:'<path d="M4 6h6M7 3v6m7-3h6M4 16l6 6m-6 0 6-6m4 1h6m-6 4h6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  refresh:'<path d="M20 7a8 8 0 1 0 1 8M20 2v6h-6"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.book}</svg>`;
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (selector,scope=document) => scope.querySelector(selector);
const $$ = (selector,scope=document) => [...scope.querySelectorAll(selector)];
const el = $('#main');
const modal = $('#modal');
const content = $('#modal-content');
let storageFailed=false,loadFailed=false,hadStoredData=false;
const cloud=window.CUNG_HOC_STORAGE==='server'?await connectCloud():null;
if(cloud)document.body.classList.add('cloud-mode');
let db;
if(cloud)db=normalizeData(cloud.data);
else try {const raw=localStorage.getItem(STORAGE_KEY);hadStoredData=!!raw; if(raw){const parsed=JSON.parse(raw);if(!validateData(parsed))throw Error('Dữ liệu không hợp lệ');db=normalizeData(parsed);}else db=createDemo();}catch {db=createDemo();loadFailed=true;}
let page='overview',routeId='',filter='active',query='',topicFilter='all';
let monthDate=new Date(new Date().getFullYear(),new Date().getMonth(),1),selectedDate=localDate();
let selectedMembers=new Set(),editingGroup=null,dirty=false,modalKind='',previousFocus=null,toastTimer;
let confirmCallback=null,confirmCancel=null,csvImportRows=[];
const COLORS=['purple','orange','blue','green','pink'];
const SUBJECTS=['Khoa học tự nhiên','Ngữ văn','Toán học','Tiếng Anh','Lịch sử & Địa lý','Tin học','Mỹ thuật','Hoạt động trải nghiệm','Khác'];
const navigations=[['overview','Tổng quan','home'],['topics','Chuyên đề','book'],['groups','Nhóm học','group'],['students','Học sinh','users'],['calendar','Lịch học nhóm','calendar']];
const dDate = date=>new Date(date+'T12:00:00');
const dateLabel = (date,opts={day:'numeric',month:'numeric'})=>new Intl.DateTimeFormat('vi-VN',opts).format(dDate(date));
const weekday = date=>new Intl.DateTimeFormat('vi-VN',{weekday:'long'}).format(dDate(date));
const initials = name=>String(name).trim().split(/\s+/).slice(-2).map(s=>s[0]).join('').toUpperCase();
const avatar=(name,i=0)=>`<span class="avatar c${i%5}" aria-hidden="true">${esc(initials(name))}</span>`;
const student = id=>db.students.find(s=>s.id===id);
const visibleParents=s=>!s?[]:cloud?(cloud.parentLinks[s.id]||[]).filter(p=>studentParents(s).some(c=>parentPhoneKey(c.phone)===p.phone)):studentParents(s);
const parentNames=s=>visibleParents(s).map(p=>p.name||p.relation).join(', ')||'Chưa có phụ huynh kích hoạt';
const parentSearch=s=>(cloud?.user.role==='owner'?studentParents(s):visibleParents(s)).map(p=>p.name+' '+p.phone).join(' ');
const linkedParentInfo=s=>visibleParents(s).map(p=>`<div class="linked-parent"><strong>${esc(p.name)} <span class="optional">(${esc(p.relation)})</span></strong><small class="phone-text">${esc(p.phone)}</small></div>`).join('')||'<span class="helper">Chưa có phụ huynh kích hoạt</span>';
const linkedParentContacts=s=>visibleParents(s).map(p=>`<div class="linked-parent-actions">${contacts(p.phone,p.name)}</div>`).join('')||'<span class="helper">—</span>';

const topic = id=>db.topics.find(t=>t.id===id);
const group = id=>db.groups.find(g=>g.id===id);
const topicIcon=t=>t?.color==='orange'?'book':t?.color==='blue'?'math':t?.color==='green'?'globe':t?.color==='pink'?'leaf':'rocket';
const countGroups = id=>db.groups.filter(g=>g.topicId===id).length;
const subjectBadge=t=>`<span class="subject ${esc(t?.color||'purple')}">${icon(topicIcon(t))}${esc(t?.subject||'Chuyên đề')}</span>`;
const numberFormat = n=>new Intl.NumberFormat('vi-VN').format(n);
const dateTime = g=>new Date(`${g.date}T${g.end}`);
const upcoming = ()=>db.groups.filter(g=>!g.done&&dateTime(g)>=new Date()).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
const needsNextSession = ()=>db.groups.filter(g=>!g.done&&dateTime(g)<new Date()).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
function relativeDay(date){const delta=Math.round((dDate(date)-dDate(localDate()))/86400000);return delta===0?'Hôm nay':delta===1?'Ngày mai':delta===-1?'Hôm qua':dateLabel(date);}
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db));storageFailed=false;$('.local-indicator').innerHTML='<i></i> Đã lưu trên máy';return true;}
  catch {storageFailed=true;$('.local-indicator').textContent='Chưa lưu được';notify('Trình duyệt không lưu được dữ liệu. Hãy xuất bản sao trước khi đóng trang.');return false;}
}
function committed(message){
  render();if(!cloud){const saved=persist();if(saved)notify(message);return;}
  const snapshot=structuredClone(db);cloud.busy=true;setCloudBusy(true);updateCloudIndicator('Đang lưu…');
  cloud.save(snapshot).then(()=>{storageFailed=false;render();updateCloudIndicator('Đã đồng bộ');notify(message);}).catch(error=>{
    cloud.pending=snapshot;storageFailed=true;updateCloudIndicator('Chưa đồng bộ');
    showModal(modalHeader(error.status===409?'Dữ liệu đã thay đổi':'Chưa lưu được lên máy chủ')+`<div class="modal-body"><p class="confirm-text">${esc(error.message)}</p><p class="helper">Thay đổi của bạn đang được giữ tạm trong tab này. Xuất bản sao để giữ lại trước khi tải dữ liệu mới.</p></div><div class="modal-footer"><button class="btn" data-action="export">Xuất bản sao của tôi</button>${error.status!==409?'<button class="btn" data-action="retry-cloud">Thử lưu lại</button>':''}<button class="btn primary" data-action="reload-cloud">Tải dữ liệu mới</button></div>`,'sync-error');
  }).finally(()=>{cloud.busy=false;setCloudBusy(false);});
}
function setCloudBusy(busy){for(const selector of ['.app-shell','.sidebar','#mobile-nav','#modal'])$(selector).inert=busy;}
function updateCloudIndicator(label){if(cloud)$('.local-indicator').innerHTML=`<i></i> ${esc(label)}`;}
function phoneDigits(phone){return String(phone||'').replace(/[^+\d]/g,'');}
function isDemoPhone(phone){return /^0{3}/.test(phoneDigits(phone));}
function contacts(phone,name,small=false){
  if(!phone)return '<span class="badge-small">Chưa có SĐT</span>';
  const label=esc(name),demo=isDemoPhone(phone);
  const attrs=demo?'href="#" data-action="demo-phone"':`href="tel:${esc(phoneDigits(phone))}"`;
  const zalo=demo?'href="#" data-action="demo-phone"':`href="https://zalo.me/${esc(phoneDigits(phone).replace(/^\+84/,'0'))}" target="_blank" rel="noopener noreferrer"`;
  return `<span class="contact-buttons"><a class="icon-btn" ${attrs} aria-label="Gọi ${label}" title="Gọi ${label}">${icon('phone')}</a><a class="icon-btn zalo" ${zalo} aria-label="Mở Zalo của ${label}" title="Mở liên hệ Zalo">Zalo</a></span>`;
}
function renderNav(){
  $('#nav').innerHTML=navigations.map(([id,label,ico])=>`<a data-section="${id}" class="nav-item ${page===id?'active':''}" href="#${id}" ${page===id?'aria-current="page"':''}>${icon(ico)}<span>${label}</span>${id==='students'?`<span class="nav-count">${db.students.length}</span>`:''}</a>`).join('');
  $('#mobile-nav').innerHTML=navigations.map(([id,label,ico])=>`<a data-section="${id}" href="#${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(ico)}<span>${id==='calendar'?'Lịch học':label}</span></a>`).join('');
  if(cloud){
    $('#nav').insertAdjacentHTML('beforeend',`<a class="nav-item ${page==='classes'?'active':''}" href="#classes">${icon('school')}<span>${cloud.user.role==='owner'?'Quản lý lớp':'Lớp của tôi'}</span></a><a class="nav-item ${page==='profile'?'active':''}" href="#profile">${icon('users')}<span>${cloud.user.role==='owner'?'Hồ sơ admin':'Hồ sơ cá nhân'}</span></a>`);
    $('#class-switcher').innerHTML='<option disabled>Chọn lớp học</option>'+cloud.classes.map(c=>`<option value="${esc(c.id)}" ${c.id===cloud.classId?'selected':''}>${esc(c.id===cloud.classId?db.className:c.name)}</option>`).join('');
  }
  $('#sidebar-class').textContent=db.className;$('#top-class').textContent=db.className;$('.class-symbol').textContent=db.className.replace(/^Lớp\s*/i,'');$('#sidebar-school').textContent=db.schoolName;$('#top-school').textContent=db.schoolName;
}
function heading(title,sub,action,label){return `<div class="page-heading"><div><h1>${esc(title)}</h1>${sub?`<p class="page-subtitle">${esc(sub)}</p>`:''}</div>${action?`<button class="btn primary" data-action="${action}" aria-label="${esc(label)}">${icon('plus')}<span>${esc(label)}</span></button>`:''}</div>`;}
function empty(title,text,action='',label=''){return `<div class="empty">${icon('book')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action?`<button class="btn soft" data-action="${action}">${icon('plus')}${esc(label)}</button>`:''}</div>`;}
function statusTopic(t){return t.done?'<span class="status done">✓ Đã hoàn thành</span>':t.due<localDate()?'<span class="status overdue">Quá hạn</span>':'<span class="status">Đang thực hiện</span>';}
function sessionCard(g){
  const t=topic(g.topicId),host=student(g.hostId),members=g.members.map(student).filter(Boolean);
  const status=g.done?'Đã hoàn thành':g.archived?'Đã chuyển buổi':dateTime(g)<new Date()?'Chưa hoàn thành':relativeDay(g.date);
  return `<article class="session-card" data-color="${esc(t?.color||'purple')}"><div class="session-body"><div class="card-top">${subjectBadge(t)}<span class="when-tag ${g.done?'done':g.archived?'archived':dateTime(g)<new Date()?'pending':g.date===localDate()?'today':'scheduled'}">${esc(status)}</span></div><h3>${esc(g.name)}</h3><p class="topic-name">${esc(t?.name)} · Buổi ${g.sessionNumber||(g.history||[]).length+1}</p><div class="session-info"><div class="info-line">${icon('clock')}<span><strong>${esc(g.start)} – ${esc(g.end)}</strong><span> · ${esc(dateLabel(g.date))}</span></span></div><div class="info-line">${icon('pin')}<span class="truncate" title="${esc(g.address)}">${esc(g.address||'Chưa có địa điểm')}</span></div></div><div class="host-line">${avatar(g.hostName||'Chủ nhà',3)}<div class="truncate"><strong>${esc(g.hostName||'Chưa chọn chủ nhà')}</strong>${host?`Phụ huynh của ${esc(host.name.split(' ').slice(-2).join(' '))}`:'Chủ nhà đón nhóm'}</div></div></div><div class="session-footer"><div class="avatar-stack">${members.slice(0,3).map((s,i)=>avatar(s.name,i)).join('')}${members.length>3?`<span class="avatar more-avatar">+${members.length-3}</span>`:''}<span class="member-label">${members.length} thành viên</span></div><button class="text-link" data-action="group-detail" data-id="${esc(g.id)}" data-session="${esc(g.sessionId||'')}">Xem nhóm ${icon('arrow')}</button></div></article>`;
}
function pendingSessionsHTML(){
  const list=needsNextSession();if(!list.length)return '';
  return `<section class="pending-sessions"><div class="section-head"><h2>Đang tiếp tục <span class="subcount">${list.length}</span></h2></div><p class="helper">Đã qua giờ hẹn nhưng chưa được đánh dấu hoàn thành.</p><div class="session-grid">${list.map(sessionCard).join('')}</div></section>`;
}
function renderOverview(){
  const list=upcoming(),active=db.topics.filter(t=>!t.done);
  el.innerHTML=heading('Tổng quan','','new-topic','Tạo chuyên đề')+
  `<div class="stats">${[[db.students.length,'Học sinh trong lớp','users','blue'],[active.length,'Chuyên đề đang làm','book','purple'],[db.groups.filter(g=>!g.done).length,'Nhóm đang hoạt động','group','orange'],[list.length,'Buổi học sắp tới','calendar','green']].map(([n,label,ico,color])=>`<div class="stat" data-color="${color}"><span class="stat-icon ${color}">${icon(ico)}</span><div><strong>${numberFormat(n)}</strong><small>${label}</small></div></div>`).join('')}</div>`+
  `<div class="dashboard-grid"><div><section class="upcoming-panel"><div class="section-head"><h2>Buổi học sắp tới <span class="subcount">${list.length}</span></h2><a href="#calendar" class="text-link">Xem lịch học ${icon('arrow')}</a></div>${list.length?`<div class="session-grid">${list.slice(0,2).map(sessionCard).join('')}</div>`:empty('Chưa có buổi học sắp tới','Chọn một chuyên đề và hẹn buổi học cho các con.','new-group','Tạo nhóm học')}</section>${pendingSessionsHTML()}<section class="dashboard-topics"><div class="section-head"><h2>Chuyên đề đang thực hiện</h2><a href="#topics" class="text-link">Tất cả chuyên đề ${icon('arrow')}</a></div>${active.length?`<div class="topic-rows">${active.slice(0,3).map(t=>`<a class="topic-row" data-color="${esc(t.color)}" href="#topics/${esc(t.id)}"><span class="topic-mark ${esc(t.color)}">${icon(topicIcon(t))}</span><div class="truncate"><h3 class="truncate">${esc(t.name)}</h3><p>${esc(t.subject)} · ${countGroups(t.id)} nhóm học</p></div><span class="due">Hạn ${esc(dateLabel(t.due))}</span>${icon('chevron')}</a>`).join('')}</div>`:empty(db.topics.length?'Mọi chuyên đề đã hoàn thành':'Chưa có chuyên đề','Tạo chuyên đề để bắt đầu chia nhóm.','new-topic','Tạo chuyên đề')}</section></div><aside class="dashboard-right"><div class="mini-calendar">${calendarHTML(false)}</div></aside></div>`;
}
function topicCard(t){
  return `<article class="topic-card" data-color="${esc(t.color)}"><div class="card-top"><span class="topic-mark ${esc(t.color)}">${icon(topicIcon(t))}</span>${statusTopic(t)}</div><h3>${esc(t.name)}</h3><p>${esc(t.description||'Chưa có mô tả cho chuyên đề này.')}</p><div class="topic-card-meta"><span>${icon('group')}${countGroups(t.id)} nhóm học</span><span>${icon('calendar')}Hạn ${esc(dateLabel(t.due))}</span></div><div class="topic-card-bottom">${subjectBadge(t)}<a href="#topics/${esc(t.id)}" class="text-link">Xem chuyên đề ${icon('arrow')}</a></div></article>`;
}
function renderTopics(){
  el.innerHTML=heading('Chuyên đề','','new-topic','Tạo chuyên đề')+`<div class="toolbar"><div class="tabs" aria-label="Lọc chuyên đề">${[['active','Đang thực hiện'],['done','Đã hoàn thành'],['all','Tất cả']].map(([id,label])=>`<button data-action="filter" data-id="${id}" class="${filter===id?'active':''}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><label class="search-field">${icon('search')}<input type="search" id="list-search" name="topicSearch" aria-label="Tìm chuyên đề" placeholder="Tìm tên chuyên đề…" value="${esc(query)}" autocomplete="off"></label></div><div id="topic-list"></div>`;renderTopicList();
}
function renderTopicList(){const list=db.topics.filter(t=>(filter==='all'||(filter==='done')===t.done)&&fold(t.name+' '+t.subject).includes(fold(query)));$('#topic-list').innerHTML=list.length?`<div class="full-grid">${list.map(topicCard).join('')}</div>`:empty('Chưa tìm thấy chuyên đề','Thử tên khác hoặc tạo chuyên đề mới.','new-topic','Tạo chuyên đề');}
function renderTopicDetail(id){
  const t=topic(id);if(!t){location.hash='topics';return;}
  const list=db.groups.filter(g=>g.topicId===id);
  el.innerHTML=`<a class="back-link" href="#topics">${icon('left')}Tất cả chuyên đề</a>`+heading(t.name,`${t.subject} · Hạn hoàn thành ${dateLabel(t.due,{day:'numeric',month:'numeric',year:'numeric'})}`,'','')+`<section class="topic-detail-summary" data-color="${esc(t.color)}"><div class="card-top">${subjectBadge(t)}${statusTopic(t)}</div><p class="wrap-text">${esc(t.description||'Chưa có mô tả.')}</p><div class="detail-actions"><button class="btn small" data-action="edit-topic" data-id="${esc(t.id)}">${icon('edit')}Sửa chuyên đề</button><button class="btn small" data-action="toggle-topic" data-id="${esc(t.id)}">${icon(t.done?'refresh':'check')}${t.done?'Mở lại chuyên đề':'Đánh dấu hoàn thành'}</button><button class="icon-btn" data-action="delete-topic" data-id="${esc(t.id)}" aria-label="Xóa chuyên đề">${icon('trash')}</button></div></section><div class="section-head"><h2>Các nhóm học <span class="subcount">${list.length}</span></h2><button class="btn primary small" data-action="new-group" data-id="${esc(t.id)}">${icon('plus')}Tạo nhóm</button></div>${list.length?`<div class="full-grid">${list.map(sessionCard).join('')}</div>`:empty('Chuyên đề chưa có nhóm','Chọn các bạn trong lớp để tạo nhóm đầu tiên.','new-group','Tạo nhóm học')}`;
}
function renderGroups(){
  el.innerHTML=heading('Nhóm học','','new-group','Tạo nhóm học')+`<div class="toolbar"><div class="tabs" aria-label="Lọc nhóm học">${[['active','Đang hoạt động'],['done','Đã hoàn thành'],['all','Tất cả']].map(([id,label])=>`<button data-action="filter" data-id="${id}" class="${filter===id?'active':''}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><div class="actions-wrap"><label class="search-field">${icon('search')}<input id="list-search" name="groupSearch" type="search" autocomplete="off" placeholder="Tìm nhóm hoặc học sinh…" aria-label="Tìm nhóm hoặc học sinh" value="${esc(query)}"></label><select id="topic-filter" name="topicFilter" aria-label="Lọc theo chuyên đề"><option value="all">Tất cả chuyên đề</option>${db.topics.map(t=>`<option value="${esc(t.id)}" ${topicFilter===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div></div><div id="group-list"></div>`;renderGroupList();
}
function renderGroupList(){
  const list=db.groups.filter(g=>(filter==='all'||(filter==='done')===g.done)&&(topicFilter==='all'||g.topicId===topicFilter)&&fold(g.name+' '+topic(g.topicId)?.name+' '+g.members.map(id=>student(id)?.name).join(' ')).includes(fold(query))).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  $('#group-list').innerHTML=list.length?`<p class="group-filter-info">${list.length} nhóm học</p><div class="full-grid">${list.map(sessionCard).join('')}</div>`:empty('Chưa tìm thấy nhóm học','Thử thay đổi bộ lọc hoặc tạo một nhóm mới.','new-group','Tạo nhóm học');
}
function renderStudents(){
  el.innerHTML=heading('Học sinh','','new-student','Thêm học sinh')+`<div class="toolbar"><div class="actions-wrap csv-actions"><button class="btn small" data-action="import-csv">${icon('upload')}Nhập CSV</button><a class="btn small" href="/hoc-sinh-demo.csv" download>${icon('download')}Tải CSV mẫu</a></div><p class="group-filter-info" style="margin:0">${db.students.length} học sinh · ${db.students.reduce((n,s)=>n+visibleParents(s).length,0)} phụ huynh đã kích hoạt</p><label class="search-field">${icon('search')}<input id="list-search" type="search" name="studentSearch" autocomplete="off" aria-label="Tìm học sinh hoặc phụ huynh" placeholder="Tìm học sinh, phụ huynh, số điện thoại…" value="${esc(query)}"></label></div><div id="student-list"></div>`;renderStudentList();
}
function renderStudentList(){
  const list=db.students.filter(s=>fold(s.name+' '+parentSearch(s)+' '+s.phone).includes(fold(query)));
  $('#student-list').innerHTML=list.length?`<div class="students-panel"><table class="students-table"><thead><tr><th>Học sinh</th><th class="student-phone-col">Số điện thoại học sinh</th><th>Phụ huynh đã kích hoạt</th><th>Liên hệ phụ huynh</th><th><span class="optional">Thao tác</span></th></tr></thead><tbody>${list.map((s,i)=>`<tr><td><div class="student-name">${avatar(s.name,i)}<div><strong>${esc(s.name)}</strong>${s.address?`<small class="student-address">${esc(s.address)}</small>`:''}<small>${db.groups.filter(g=>g.members.includes(s.id)).length} nhóm học${s.demo?' · Mẫu':''}</small></div></div></td><td class="student-phone-col"><span class="phone-text">${esc(s.phone||'Chưa có SĐT')}</span></td><td class="parent-info">${linkedParentInfo(s)}</td><td class="contact-cell">${linkedParentContacts(s)}</td><td class="record-actions"><button class="icon-btn" data-action="edit-student" data-id="${esc(s.id)}" aria-label="Sửa ${esc(s.name)}">${icon('edit')}</button><button class="icon-btn" data-action="delete-student" data-id="${esc(s.id)}" aria-label="Xóa ${esc(s.name)}">${icon('trash')}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Chưa tìm thấy học sinh','Tìm bằng tên có hoặc không dấu, tên phụ huynh hay số điện thoại.','new-student','Thêm học sinh');
}
function calendarHTML(big){
  const y=monthDate.getFullYear(),m=monthDate.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),offset=(first.getDay()+6)%7;
  const title=new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(monthDate);
  const cells=[];
  for(let i=0;i<offset;i++)cells.push(`<span class="outside">${new Date(y,m,-offset+i+1).getDate()}</span>`);
  for(let day=1;day<=last.getDate();day++){
    const value=localDate(new Date(y,m,day)),events=allSessions(db).filter(g=>g.date===value);
    cells.push(`<button data-action="calendar-day" data-id="${value}" class="${value===localDate()?'today':''} ${value===selectedDate?'selected':''} ${events.length?'has-event':''}" aria-label="${esc(dateLabel(value,{day:'numeric',month:'long',year:'numeric'}))}${events.length?`, ${events.length} buổi học`:''}" ${value===selectedDate?'aria-pressed="true"':''}><span>${day}</span>${big?events.slice(0,2).map(g=>`<span class="event-dot ${esc(topic(g.topicId)?.color)}">${esc(g.start)} ${esc(g.name)}</span>`).join(''):''}</button>`);
  }
  const remaining=(7-cells.length%7)%7;for(let i=1;i<=remaining;i++)cells.push(`<span class="outside">${i}</span>`);
  return `<div class="calendar-header"><h3>${esc(title[0].toUpperCase()+title.slice(1))}</h3><div class="calendar-buttons">${big?'<button class="btn small" data-action="calendar-today">Hôm nay</button>':''}<button class="icon-btn" data-action="calendar-prev" aria-label="Tháng trước">${icon('left')}</button><button class="icon-btn" data-action="calendar-next" aria-label="Tháng sau">${icon('chevron')}</button></div></div><div class="calendar-weekdays">${['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-days">${cells.join('')}</div>${big?'':'<div class="calendar-legend"><i></i> Có buổi học nhóm</div>'}`;
}
function renderCalendar(){
  const list=allSessions(db).filter(g=>g.date===selectedDate).sort((a,b)=>a.start.localeCompare(b.start));
  el.innerHTML=heading('Lịch học nhóm','','new-group','Thêm buổi học')+`<div class="calendar-layout"><section class="big-calendar">${calendarHTML(true)}</section><section class="day-agenda"><h2>${esc(weekday(selectedDate))}, ${esc(dateLabel(selectedDate,{day:'numeric',month:'numeric',year:'numeric'}))}</h2>${list.length?list.map(sessionCard).join(''):empty('Chưa có buổi học','','new-group','Hẹn buổi học')}</section></div>`;
}
function render(){
  el.dataset.page=page;
  renderNav();
  if(page==='profile'&&cloud)renderProfile();
  else if(page==='classes'&&cloud)renderClasses();
  else if(page==='topics'&&routeId)renderTopicDetail(routeId);
  else if(page==='topics')renderTopics();else if(page==='groups')renderGroups();else if(page==='students')renderStudents();else if(page==='calendar')renderCalendar();else renderOverview();
  $$('.topbar [data-icon],.sidebar [data-icon]').forEach(n=>n.innerHTML=icon(n.dataset.icon));
  if(cloud){$('.profile-button').dataset.action='profile';$('.profile-button').setAttribute('aria-label','Mở hồ sơ cá nhân');$('.profile-button').textContent=initials(cloud.user.name);$('.sidebar-profile').setAttribute('data-action','profile');updateCloudIndicator(cloud.busy?'Đang lưu…':storageFailed?'Chưa đồng bộ':'Đã đồng bộ');$('.sidebar-profile strong').textContent=cloud.user.name;$('.sidebar-profile small').textContent=cloud.user.role==='owner'?'Quản trị lớp học':cloud.user.role==='viewer'?'Chỉ xem':'Cùng chỉnh sửa';}
}
function readRoute(){
  const [base,params='']=(location.hash.slice(1)||'overview').split('?');const [next,id='']=base.split('/');
  const nextPage=(navigations.some(n=>n[0]===next)||(cloud&&['profile','classes'].includes(next)))?next:'overview';
  if(nextPage!==page){filter='active';query='';topicFilter='all';}
  page=nextPage;routeId=id;
  const routeParams=new URLSearchParams(params);
  filter=['active','done','all'].includes(routeParams.get('status'))?routeParams.get('status'):'active';
  query=routeParams.get('q')||'';topicFilter=routeParams.get('topic')||'all';
  if(page==='calendar'){const date=new URLSearchParams(params).get('date');if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(dDate(date).valueOf())){selectedDate=date;const d=dDate(date);monthDate=new Date(d.getFullYear(),d.getMonth(),1);}}
  closeModal(true);render();
  if(page==='classes'&&cloud)cloud.loadClasses().then(()=>{if(page==='classes')render();}).catch(error=>notify(error.message));
  if(page==='groups'&&routeId&&group(routeId))openGroupDetail(routeId);
}

function showModal(html,kind='form',drawer=false){
  if(!modal.open)previousFocus=document.activeElement;
  dirty=false;modalKind=kind;modal.className=drawer?'drawer':kind==='search'?'search-modal':'';
  content.innerHTML=html;if(!modal.open)modal.showModal();modal.scrollTop=0;document.body.classList.add('modal-open');
  if(innerWidth<=760&&kind==='form')$('.modal-header .icon-btn',content)?.focus({preventScroll:true});
}
function modalHeader(title,sub=''){return `<div class="modal-header"><div><h2 id="modal-title">${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">${icon('close')}</button></div><div id="discard-warning"></div>`;}
function closeModal(force=false){
  if(!modal.open)return;
  if(dirty&&!force){$('#discard-warning').innerHTML='<div class="discard-notice">Bạn có thay đổi chưa lưu. Tiếp tục nhập hoặc bỏ các thay đổi?<div><button type="button" class="btn small" data-action="keep-editing">Tiếp tục nhập</button><button type="button" class="btn small danger" data-action="discard">Bỏ thay đổi</button></div></div>';$('#discard-warning').scrollIntoView({block:'nearest'});return;}
  modal.close();document.body.classList.remove('modal-open');dirty=false;modalKind='';previousFocus?.focus?.({preventScroll:true});
}
function formFooter(label='Lưu thay đổi'){return `<div class="modal-footer"><button type="button" class="btn" data-action="close-modal">Hủy</button><button class="btn primary" type="submit">${icon('check')}${esc(label)}</button></div>`;}
function field(label,name,value='',type='text',required=false,full=false,placeholder=''){
  return `<div class="field ${full?'full':''}"><label for="f-${name}">${esc(label)}${required?'':' <span class="optional">(không bắt buộc)</span>'}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} maxlength="${type==='tel'?20:250}" ${placeholder?`placeholder="${esc(placeholder)}"`:''} autocomplete="${type==='tel'?'tel':name==='parent'?'name':'off'}" ${type==='tel'?'inputmode="tel"':''}></div>`;
}
function openStudentForm(id){
  const s=student(id)||{};
  showModal(modalHeader(id?'Sửa thông tin học sinh':'Thêm học sinh','Tối đa 2 số phụ huynh. Thông tin chỉ hiện khi tài khoản đăng nhập và đổi mật khẩu.')+`<form id="student-form" data-id="${esc(id||'')}" novalidate><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${field('Họ và tên học sinh','name',s.name,'text',true,true,'VD: Nguyễn Minh Anh…')}${field('Số điện thoại học sinh','phone',s.phone,'tel',false,true,'VD: 0912 345 678…')}${field('Địa chỉ nhà','address',s.address,'text',false,true,'Số nhà, đường, phường, tỉnh/thành phố…')}<div class="form-divider">Phụ huynh 1</div>${field('Họ và tên phụ huynh','parent',s.parent,'text',false,true,'VD: Nguyễn Thu Hương…')}<div class="field"><label for="f-relation">Mối quan hệ</label><select id="f-relation" name="relation">${['Mẹ','Bố','Cha','Người giám hộ','Khác'].map(r=>`<option ${r===s.relation?'selected':''}>${r}</option>`).join('')}</select></div>${field('Số điện thoại phụ huynh','parentPhone',s.parentPhone,'tel',false,false,'VD: 0912 345 678…')}<div class="form-divider">Phụ huynh 2</div>${field('Họ và tên phụ huynh 2','parent2',s.parent2,'text',false,true)}<div class="field"><label for="f-relation2">Mối quan hệ</label><select id="f-relation2" name="relation2">${['Bố','Mẹ','Cha','Người giám hộ','Khác'].map(r=>`<option ${r===(s.relation2||'Bố')?'selected':''}>${r}</option>`).join('')}</select></div>${field('Số điện thoại phụ huynh 2','parentPhone2',s.parentPhone2,'tel',false,false,'VD: 0912 345 678…')}<div class="field full"><label for="f-note">Ghi chú <span class="optional">(không bắt buộc)</span></label><textarea id="f-note" name="note" maxlength="2000" placeholder="Thông tin cần lưu ý…">${esc(s.note||'')}</textarea></div></div></div>${formFooter(id?'Lưu thay đổi':'Thêm học sinh')}</form>`);
}
function openTopicForm(id){
  const t=topic(id)||{color:'purple',due:localDate()};
  showModal(modalHeader(id?'Sửa chuyên đề':'Tạo chuyên đề','Bắt đầu từ một ý tưởng, cùng nhau học điều mới.')+`<form id="topic-form" data-id="${esc(id||'')}" novalidate><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${field('Tên chuyên đề','name',t.name,'text',true,true,'VD: Khám phá hệ Mặt Trời…')}<div class="field"><label for="f-subject">Môn học</label><select id="f-subject" name="subject">${[...new Set([...SUBJECTS,t.subject].filter(Boolean))].map(s=>`<option ${s===t.subject?'selected':''}>${esc(s)}</option>`).join('')}</select></div>${field('Hạn hoàn thành','due',t.due,'date',true)}<div class="field full"><label for="f-color">Màu nhận diện</label><select id="f-color" name="color">${COLORS.map((c,i)=>`<option value="${c}" ${c===t.color?'selected':''}>${['Tím khám phá','Cam ấm áp','Xanh bầu trời','Xanh lá cây','Hồng dịu dàng'][i]}</option>`).join('')}</select></div><div class="field full"><label for="f-description">Nội dung chuyên đề <span class="optional">(không bắt buộc)</span></label><textarea id="f-description" name="description" maxlength="3000" placeholder="Các con sẽ làm gì? Cần chuẩn bị những gì?…">${esc(t.description||'')}</textarea></div></div></div>${formFooter(id?'Lưu chuyên đề':'Tạo chuyên đề')}</form>`);
}
function memberOptions(q=''){
  const list=db.students.filter(s=>fold(s.name+' '+parentSearch(s)).includes(fold(q)));
  return list.length?list.map((s,i)=>`<label class="member-option"><input type="checkbox" name="member" value="${esc(s.id)}" ${selectedMembers.has(s.id)?'checked':''}>${avatar(s.name,i)}<span><strong>${esc(s.name)}</strong><small>PH: ${esc(parentNames(s))}</small></span><span class="check-group">${db.groups.filter(g=>g.members.includes(s.id)).length} nhóm</span></label>`).join(''):'<p class="picker-empty">Không tìm thấy tên. Thêm học sinh ở Danh sách lớp trước.</p>';
}
function renderSelected(){
  $('#selected-members').innerHTML=[...selectedMembers].map(id=>{const s=student(id);return `<button type="button" class="member-chip" data-action="remove-member" data-id="${esc(id)}" aria-label="Bỏ chọn ${esc(s?.name)}">${esc(s?.name)}${icon('close')}</button>`;}).join('');
  $('#selection-count').textContent=`Đã chọn ${selectedMembers.size} bạn`;
  const select=$('#f-hostId'),previous=select.value;
  select.innerHTML='<option value="">Nhập chủ nhà khác / chọn sau</option>'+[...selectedMembers].map(id=>{const s=student(id);return `<option value="${esc(id)}">Nhà ${esc(s?.name)} — PH: ${esc(parentNames(s))}</option>`;}).join('');
  if(selectedMembers.has(previous))select.value=previous;else{select.value='';if(previous){$('#f-hostName').value='';$('#f-hostPhone').value='';}}
}
function openGroupForm(id,topicId=''){
  if(!db.students.length){notify('Thêm học sinh vào danh sách lớp trước khi tạo nhóm.');openStudentForm();return;}
  if(!db.topics.length){notify('Tạo chuyên đề trước khi chia nhóm học.');openTopicForm();return;}
  const g=group(id)||{topicId:topicId||(page==='topics'&&routeId?routeId:db.topics.find(t=>!t.done)?.id||db.topics[0].id),date:page==='calendar'?selectedDate:localDate(),start:'18:30',end:'20:00',members:[]};
  selectedMembers=new Set(g.members);editingGroup=g;
  showModal(modalHeader(id?'Sửa nhóm học':'Tạo nhóm học','Chọn các bạn, hẹn thời gian và một nơi để cùng học.')+`<form id="group-form" data-id="${esc(id||'')}" novalidate><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid"><div class="field full"><label for="f-topicId">Chuyên đề</label><select id="f-topicId" name="topicId" required>${db.topics.map(t=>`<option value="${esc(t.id)}" ${t.id===g.topicId?'selected':''}>${esc(t.name)}${t.done?' (đã hoàn thành)':''}</option>`).join('')}</select></div>${field('Tên nhóm','name',g.name,'text',true,true,'VD: Những nhà du hành…')}<div class="field full"><div class="form-label-row"><label class="form-label" for="member-search">Thành viên nhóm</label><span id="selection-count" class="selection-count"></span></div><div class="member-picker"><input id="member-search" class="picker-search" name="memberSearch" type="search" aria-label="Tìm và chọn học sinh" autocomplete="off" placeholder="Gõ tên học sinh hoặc phụ huynh…"><div id="member-options" class="member-options">${memberOptions()}</div></div><div id="selected-members" class="selected-members"></div></div><div class="form-divider">Thời gian học nhóm</div>${field('Ngày học','date',g.date,'date',true,true)}<div class="field time-half"><label for="f-start">Bắt đầu</label><input id="f-start" name="start" type="time" required value="${esc(g.start)}"></div><div class="field time-half"><label for="f-end">Kết thúc</label><input id="f-end" name="end" type="time" required value="${esc(g.end)}"></div><div id="schedule-warning" class="inline-warning full hidden" style="grid-column:1/-1" role="status"></div><div class="form-divider">Địa điểm & người đón nhóm</div><div class="field full"><label for="f-hostId">Nhà của thành viên <span class="optional">(không bắt buộc)</span></label><select id="f-hostId" name="hostId"></select><small>Chọn một bạn để điền nhanh thông tin phụ huynh. Bạn vẫn có thể sửa người liên hệ bên dưới.</small></div>${field('Người liên hệ chủ nhà','hostName',g.hostName,'text',false,true,'Họ tên phụ huynh hoặc học sinh chủ nhà…')}${field('Số điện thoại chủ nhà','hostPhone',g.hostPhone,'tel',false,true,'VD: 0912 345 678…')}${field('Địa chỉ học nhóm','address',g.address,'text',false,true,'Số nhà, đường, phường, tỉnh/thành phố…')}<div class="field full"><label for="f-note">Lưu ý cho buổi học <span class="optional">(không bắt buộc)</span></label><textarea id="f-note" name="note" maxlength="2000" placeholder="Đồ dùng cần mang, giờ đón con…">${esc(g.note||'')}</textarea></div></div></div>${formFooter(id?'Lưu nhóm học':'Tạo nhóm học')}</form>`, 'form',true);
  renderSelected();$('#f-hostId').value=g.hostId||'';checkConflict();
}
function checkConflict(){
  const form=$('#group-form');if(!form)return;
  const f=new FormData(form),id=form.dataset.id;
  const conflicting=db.groups.filter(g=>g.id!==id&&!g.done&&g.date===f.get('date')&&g.start<f.get('end')&&g.end>f.get('start')&&g.members.some(s=>selectedMembers.has(s)));
  const box=$('#schedule-warning');box.classList.toggle('hidden',!conflicting.length);box.textContent=conflicting.length?`Lưu ý: có bạn trùng giờ với nhóm ${conflicting.map(g=>g.name).join(', ')}. Bạn vẫn có thể lưu nếu đã sắp xếp lại.`:'';
}
function openGroupDetail(id, sessionId='') {
  const current=group(id);if(!current)return;
  const past=(current.history||[]).find(h=>h.id===sessionId);
  const number=past?current.history.indexOf(past)+1:current.history.length+1;
  const g=past?{...current,...past,id:current.id}:current;
  const t=topic(g.topicId),members=g.members.map(student).filter(Boolean),host=student(g.hostId);
  const isPast=!!past;
  const status=g.done?'✓ Đã hoàn thành':isPast?'Đã chuyển buổi tiếp theo':dateTime(g)<new Date()?'Chưa hoàn thành':'Đang tiếp tục';
  showModal(modalHeader(g.name,`${t?.name||'Nhóm học'} · Buổi ${number}`)+`
    <div class="detail-body" data-color="${esc(t?.color||'purple')}">
      <div class="card-top">${subjectBadge(t)}<span class="status ${g.done?'done':isPast?'archived':dateTime(g)<new Date()?'pending':'ongoing'}">${status}</span></div>
      ${isPast?`<div class="settings-notice">Bạn đang xem buổi ${number} trong lịch sử. Lịch và ghi chú được giữ theo từng buổi.<button class="text-link" data-action="group-detail" data-id="${esc(id)}">Về buổi hiện tại ${icon('arrow')}</button></div>`:''}
      <div class="session-heading"><h3>Buổi ${number}${isPast?' · Lịch sử':''}</h3>${!isPast?`<button class="text-link" data-action="reschedule-session" data-id="${esc(id)}">${icon('calendar')}Đổi lịch buổi này</button>`:''}</div>
      <div class="detail-schedule"><div class="date-tile"><span>Tháng ${dDate(g.date).getMonth()+1}</span><strong>${dDate(g.date).getDate()}</strong></div><div><h3>${esc(weekday(g.date))}, ${esc(dateLabel(g.date,{day:'numeric',month:'numeric',year:'numeric'}))}</h3><p>${esc(g.start)} – ${esc(g.end)}</p></div></div>
      ${!isPast?`<div class="session-continue"><p>${g.done?'Buổi này đã hoàn thành. Bạn có thể mở lại hoặc hẹn buổi mới.':'Nhóm tiếp tục cho đến khi bạn đánh dấu hoàn thành, kể cả khi đã qua giờ hẹn.'}</p><button class="btn primary" data-action="next-session" data-id="${esc(id)}">${icon('plus')}Hẹn buổi tiếp theo</button></div>`:''}
      <section class="detail-section"><div class="section-head"><h3>${icon('book')}Ghi chú buổi ${number}</h3>${!isPast?`<button class="text-link" data-action="edit-session-note" data-id="${esc(id)}">${icon('edit')}Sửa ghi chú</button>`:''}</div><p class="detail-note">${esc(g.note||'Chưa có ghi chú cho buổi này.')}</p></section>
      <section class="detail-section"><h3>${icon('pin')}Địa điểm & chủ nhà</h3><div class="location-box"><p class="wrap-text">${esc(g.address||'Chưa có địa chỉ. Sửa nhóm để bổ sung địa điểm.')}</p><div class="host-detail">${avatar(g.hostName||'Chủ nhà',3)}<div><strong class="wrap-text">${esc(g.hostName||'Chưa có người liên hệ')}</strong><small>${host?`Nhà ${esc(host.name)}`:esc(g.hostPhone||'Chưa có số điện thoại')}</small>${host&&g.hostPhone?`<small>${esc(g.hostPhone)}</small>`:''}</div>${contacts(g.hostPhone,g.hostName)}</div>${g.address?`<a class="btn soft" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}" target="_blank" rel="noopener noreferrer">${icon('pin')}Mở địa chỉ trên Google Maps ${icon('arrow')}</a>`:''}</div></section>
      <section class="detail-section"><h3>${icon('users')}Thành viên nhóm (${members.length})</h3>${members.map((s,i)=>`<div class="detail-member">${avatar(s.name,i)}<div><strong>${esc(s.name)}</strong><small>PH: ${esc(s.parent)}</small></div>${linkedParentContacts(s)}</div>${s.phone?`<div class="student-extra-phone">SĐT học sinh: ${esc(s.phone)} ${contacts(s.phone,s.name,true)}</div>`:''}`).join('')}</section>
      ${current.history.length?`<section class="detail-section"><h3>${icon('clock')}Các buổi trước (${current.history.length})</h3><div class="session-history">${current.history.map((h,i)=>`<button class="session-history-row" data-action="group-detail" data-id="${esc(id)}" data-session="${esc(h.id)}"><span><strong>Buổi ${i+1} · ${esc(dateLabel(h.date))}</strong><small>${esc(h.start)} – ${esc(h.end)} · ${h.done?'Đã hoàn thành':'Đã chuyển buổi tiếp theo'}</small><span class="history-note">${esc(h.note||'Chưa có ghi chú')}</span></span>${icon('chevron')}</button>`).reverse().join('')}</div></section>`:''}

    </div>
    <div class="modal-footer detail-footer">${isPast?`<button class="btn primary" data-action="group-detail" data-id="${esc(id)}">Về buổi hiện tại</button>`:`<button class="btn primary" data-action="edit-group" data-id="${esc(id)}">${icon('edit')}Sửa nhóm học</button><button class="btn" data-action="toggle-group" data-id="${esc(id)}">${icon(g.done?'refresh':'check')}${g.done?'Mở lại':'Hoàn thành'}</button><button class="btn" data-action="copy-group" data-id="${esc(id)}" aria-label="Sao chép thông tin nhóm">${icon('copy')}</button><button class="btn danger" data-action="delete-group" data-id="${esc(id)}" aria-label="Xóa nhóm học">${icon('trash')}</button>`}</div>`, 'detail',true);
}

function updateHostContact(old,s){
  db.groups.forEach(g=>{if(g.hostId===s.id){if(g.hostName===old.parent)g.hostName=s.parent;if(g.hostPhone===old.parentPhone)g.hostPhone=s.parentPhone;if(g.address===old.address)g.address=s.address;}});
}
function openSessionForm(id,mode){
  const g=group(id);if(!g)return;
  if(mode==='next'&&g.history.length>=1000){notify('Nhóm đã có 1.000 buổi lưu trữ. Xuất bản sao trước khi tạo nhóm tiếp nối.');return;}
  const next=mode==='next',notesOnly=mode==='note';
  let date=g.date;
  if(next){const base=dDate(g.date>localDate()?g.date:localDate());base.setDate(base.getDate()+1);date=localDate(base);}
  const number=g.history.length+(next?2:1);
  const title=notesOnly?`Sửa ghi chú buổi ${number}`:next?'Hẹn buổi tiếp theo':'Đổi lịch buổi này';
  showModal(modalHeader(title,`${g.name} · Buổi ${number}`)+`<form id="session-form" data-id="${esc(id)}" data-mode="${mode}" novalidate><div class="modal-body"><div class="form-error" role="alert"></div>
    ${next?`<div class="settings-notice">Lịch và ghi chú buổi ${number-1} sẽ được lưu trong lịch sử. ${g.done?'Lưu buổi tiếp theo sẽ mở lại nhóm để tiếp tục.':'Nhóm vẫn chưa hoàn thành cho đến khi bạn đánh dấu.'}</div>`:''}
    <div class="form-grid">${notesOnly?'':`${field('Ngày học','date',date,'date',true,true)}<div class="field time-half"><label for="f-start">Bắt đầu</label><input id="f-start" name="start" type="time" value="${esc(g.start)}" required></div><div class="field time-half"><label for="f-end">Kết thúc</label><input id="f-end" name="end" type="time" value="${esc(g.end)}" required></div><div class="inline-warning full hidden" id="session-conflict" style="grid-column:1/-1" role="status"></div>`}
    <div class="field full"><label for="f-note">Ghi chú cho buổi ${number} <span class="optional">(không bắt buộc)</span></label><textarea name="note" id="f-note" maxlength="2000" rows="5" placeholder="Nội dung tiếp tục, đồ dùng cần chuẩn bị, lưu ý đón con…">${esc(next?'':g.note)}</textarea></div></div>
    ${next&&g.note?`<details class="previous-note"><summary>Tham khảo ghi chú buổi trước</summary><p>${esc(g.note)}</p></details>`:''}</div>${formFooter(notesOnly?'Lưu ghi chú':next?'Lưu buổi tiếp theo':'Lưu lịch học')}</form>`);
  checkSessionConflict();
}
function checkSessionConflict(){
  const form=$('#session-form');if(!form||form.dataset.mode==='note')return;
  const g=group(form.dataset.id),f=new FormData(form);
  const conflicting=db.groups.filter(other=>other.id!==g.id&&!other.done&&other.date===f.get('date')&&other.start<f.get('end')&&other.end>f.get('start')&&other.members.some(id=>g.members.includes(id)));
  const box=$('#session-conflict');box.classList.toggle('hidden',!conflicting.length);box.textContent=conflicting.length?`Có thành viên trùng giờ với nhóm ${conflicting.map(g=>g.name).join(', ')}. Bạn vẫn có thể lưu nếu đã thống nhất lại.`:'';
}
function saveSessionForm(form){
  const g=group(form.dataset.id);if(!g)return;
  const f=new FormData(form),mode=form.dataset.mode,get=k=>String(f.get(k)||'').trim();
  if(mode!=='note'){
    if(!validDate(get('date')))return errorForm(form,'Chọn ngày học hợp lệ.','date');
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(get('start'))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(get('end'))||get('start')>=get('end'))return errorForm(form,'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.','end');
    if(mode==='next'&&(get('date')+get('start')<=g.date+g.start))return errorForm(form,'Buổi tiếp theo cần sau buổi hiện tại. Dùng “Đổi lịch buổi này” để dời lịch hiện tại.','date');
    if(mode==='next'){g.history.push(snapshotSession(g));g.sessionId=uid();g.done=false;topic(g.topicId).done=false;}
    g.date=get('date');g.start=get('start');g.end=get('end');
  }
  g.note=get('note');closeModal(true);
  committed(mode==='next'?'Đã hẹn buổi tiếp theo và giữ lại lịch sử.':mode==='note'?'Đã lưu ghi chú cho buổi học.':'Đã đổi lịch buổi học.');openGroupDetail(g.id);
}
function openCSVImport(){
  csvImportRows=[];
  showModal(modalHeader('Nhập danh sách từ CSV','Thêm học sinh mới hoặc cập nhật thông tin có sẵn.')+`<div class="modal-body"><p class="helper">Tệp gồm 5 cột: <strong>Tên HS, Tên PH, Địa chỉ, SĐT HS, SĐT PH</strong>. Tên học sinh và phụ huynh bắt buộc. Số điện thoại và địa chỉ có thể để trống.</p><div class="csv-import-actions"><a class="btn" href="/hoc-sinh-demo.csv" download>${icon('download')}Tải CSV mẫu 20 học sinh</a><button class="btn primary" data-action="choose-csv">${icon('upload')}Chọn tệp CSV</button><input type="file" id="csv-file" accept=".csv,text/csv" class="hidden" aria-label="Chọn danh sách CSV"></div><p class="helper">Lưu CSV UTF-8 để giữ dấu tiếng Việt. Khi sửa bằng Excel, để cột điện thoại dạng Văn bản để giữ số 0 đầu. Số bắt đầu bằng 000 là số demo và không thực hiện liên hệ.</p><div id="csv-error" class="form-error" role="alert"></div><div id="csv-preview"></div></div><div class="modal-footer"><button class="btn" data-action="close-modal">Đóng</button><button id="csv-commit" class="btn primary" data-action="commit-csv" disabled>Nhập danh sách</button></div>`,'csv');
}
function csvMatches(s){return db.students.filter(old=>studentKey(old)===studentKey(s));}
async function previewCSVFile(file){
  csvImportRows=[];$('#csv-commit').disabled=true;$('#csv-preview').innerHTML='';$('#csv-error').textContent='';if(!file)return;
  try{
    if(file.size>5*1024*1024)throw Error('Chọn tệp CSV nhỏ hơn 5 MB.');
    const parsed=parseStudentsCSV(await file.text());
    if(!$('#csv-preview'))return;
    if(parsed.some(s=>csvMatches(s).length>1))throw Error('Danh sách lớp có học sinh trùng cả tên và phụ huynh. Sửa tên phân biệt trước khi nhập để tránh cập nhật nhầm.');
    const updated=parsed.filter(s=>csvMatches(s).length===1).length,added=parsed.length-updated;
    if(db.students.length+added>5000)throw Error('Sau khi nhập sẽ vượt 5.000 học sinh. Hãy giảm số dòng.');
    csvImportRows=parsed;
    $('#csv-preview').innerHTML=`<div class="settings-notice"><strong>${added} học sinh mới · ${updated} học sinh sẽ cập nhật</strong><br>Trùng cả tên học sinh và tên phụ huynh: cập nhật địa chỉ, số điện thoại. Các ô trống trong tệp cũng sẽ ghi đè dữ liệu cũ. Nhóm, lịch và ghi chú vẫn được giữ.</div><div class="csv-table-wrap"><table class="csv-preview-table"><thead><tr><th>Tên HS</th><th>Tên PH</th><th>Địa chỉ</th><th>SĐT HS</th><th>SĐT PH 1</th><th>SĐT PH 2</th></tr></thead><tbody>${parsed.slice(0,20).map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.parent)}</td><td>${esc(s.address)}</td><td>${esc(s.phone)}</td><td>${esc(s.parentPhone)}</td><td>${esc(s.parentPhone2||'')}</td></tr>`).join('')}</tbody></table></div><p class="helper">Xem trước ${Math.min(20,parsed.length)} / ${parsed.length} học sinh. Bấm “Nhập danh sách” để xác nhận.</p>`;
    $('#csv-commit').disabled=false;
  }catch(error){if($('#csv-error'))$('#csv-error').textContent=error.message;}
}
function commitCSVImport(){
  if(!csvImportRows.length)return;
  if(csvImportRows.some(s=>csvMatches(s).length>1)){notify('Danh sách lớp đã thay đổi. Vui lòng chọn lại tệp để kiểm tra.');return;}
  const addedCount=csvImportRows.filter(s=>csvMatches(s).length===0).length;
  if(db.students.length+addedCount>5000){notify('Danh sách vượt 5.000 học sinh.');return;}
  for(const incoming of csvImportRows){const old=csvMatches(incoming)[0];if(old){const updated={...old,name:incoming.name,parent:incoming.parent,phone:incoming.phone,parentPhone:incoming.parentPhone,address:incoming.address,demo:incoming.demo,...(incoming.parentPhone2===undefined?{}:{parent2:incoming.parent2,parentPhone2:incoming.parentPhone2,relation2:incoming.relation2})};db.students[db.students.indexOf(old)]=updated;updateHostContact(old,updated);}else db.students.push(incoming);}
  const count=csvImportRows.length;csvImportRows=[];closeModal(true);committed(`Đã nhập ${count} học sinh: ${addedCount} mới, ${count-addedCount} cập nhật.`);
}
async function openUserManagement(){
  if(!cloud||cloud.user.role!=='owner')return;
  try{
    await cloud.loadClasses();const {users}=await cloud.request('/users');
    showModal(modalHeader('Tài khoản phụ huynh','Đăng nhập bằng số điện thoại. Mật khẩu lần đầu: 12345678; bắt buộc đổi sau khi đăng nhập.')+`<div class="modal-body"><div class="settings-notice">Sau khi nhập danh sách học sinh, có thể cấp tài khoản theo số điện thoại phụ huynh. Cấp cho cả 2 số của mỗi học sinh. Thông tin chỉ hiển thị sau khi phụ huynh đăng nhập và đổi mật khẩu. Số trống, số giả lập và số sai định dạng sẽ được bỏ qua. Tài khoản đã có giữ nguyên mật khẩu.<button class="btn soft" data-action="parents-from-students">Cấp tài khoản từ danh sách lớp</button></div><div class="account-list">${users.map(u=>`<div class="account-row"><strong>${esc(u.studentName||u.name)}</strong>${u.studentName?`<small>Phụ huynh: ${esc(u.parentName||'Chưa bổ sung')}${u.relationship?` · ${esc(u.relationship)}`:''}</small>`:''}<small>${esc(u.phone||u.email)} · ${u.role==='owner'?'Admin':u.role==='viewer'?'Chỉ xem':'Cùng chỉnh sửa'}${u.mustChangePassword?' · Chờ đổi mật khẩu':''}</small>${u.role!=='owner'?`<form class="access-form" data-id="${esc(u.id)}"><div class="field"><label>Quyền<select name="role"><option value="viewer" ${u.role==='viewer'?'selected':''}>Chỉ xem</option><option value="editor" ${u.role==='editor'?'selected':''}>Cùng chỉnh sửa</option></select></label></div><fieldset class="class-checks"><legend>Lớp được truy cập</legend>${classChecks(u.classIds)}</fieldset><button class="btn small" type="submit">Lưu quyền</button><button class="btn small danger" type="button" data-action="reset-parent-password" data-id="${esc(u.id)}">Đặt lại mật khẩu</button></form>`:''}</div>`).join('')}</div><h3 class="account-form-title">Thêm phụ huynh</h3><form id="user-form"><div class="form-error" role="alert"></div><div class="form-grid">${field('Họ tên học sinh','studentName','','text',true,true)}${field('Số điện thoại phụ huynh (đăng nhập)','phone','','tel',true,true)}${field('Địa chỉ nhà','address','','text',false,true,'Số nhà, đường, phường, tỉnh/thành phố')}${field('Họ tên phụ huynh','parentName','','text',false,true)}${field('Mối quan hệ với học sinh','relationship','','text',false,true,'Ví dụ: Bố, mẹ, ông, bà')}<div class="field full"><label for="f-role">Quyền truy cập</label><select id="f-role" name="role"><option value="viewer">Chỉ xem thông tin và liên hệ</option><option value="editor">Cùng chỉnh sửa dữ liệu lớp</option></select></div><div class="field full"><label for="f-account-class">Lớp</label><select id="f-account-class" name="classIds" required>${cloud.classes.map(c=>`<option value="${esc(c.id)}" ${c.id===cloud.classId?'selected':''}>${esc(c.name)} · ${esc(c.schoolName)}</option>`).join('')}</select></div></div><button type="submit" class="btn primary auth-submit">Tạo tài khoản</button></form></div><div class="modal-footer"><button class="btn" data-action="close-modal">Đóng</button></div>`,'users');
    for(const [name,max] of [['studentName',100],['parentName',100],['relationship',80],['address',500]])$('#user-form').elements.namedItem(name).maxLength=max;
  }catch(error){notify(error.message);}
}
function classChecks(selected){return cloud.classes.map(c=>`<label><input type="checkbox" name="classIds" value="${esc(c.id)}" ${selected.includes(c.id)?'checked':''}> ${esc(c.name)} · ${esc(c.schoolName)}</label>`).join('');}
function renderProfile(){
  const u=cloud.user,admin=u.role==='owner';
  el.innerHTML=heading(admin?'Hồ sơ admin':'Hồ sơ cá nhân','')+`<div class="profile-grid"><section class="profile-panel"><div class="profile-title">${avatar(u.name)}<div><h2>${esc(u.name)}</h2><p>${admin?'Quản trị viên · Toàn quyền':'Phụ huynh · '+(u.role==='viewer'?'Chỉ xem':'Cùng chỉnh sửa')}</p></div></div><form id="profile-form"><div class="form-error" role="alert"></div><div class="form-grid">${field('Họ và tên','name',u.name,'text',true,true)}${admin?field('Email đăng nhập','email',u.email,'email',true,true)+field('Số điện thoại','phone',u.phone,'tel',false,true):`<p class="helper full">Số điện thoại đăng nhập: <strong>${esc(u.phone||u.email)}</strong>. Liên hệ admin khi cần thay đổi.</p>`}</div><button class="btn primary auth-submit" type="submit">Lưu hồ sơ</button></form><div class="settings-actions">${admin?'<a class="btn soft" href="#classes">Quản lý lớp</a><button class="btn soft" data-action="manage-users">Quản lý phụ huynh</button>':''}<button class="btn" data-action="logout">Đăng xuất</button></div></section><section class="profile-panel password-panel"><h2>Đổi mật khẩu</h2><p class="helper">Đặt mật khẩu riêng có ít nhất 8 ký tự.</p><form id="password-form"><div class="form-error" role="alert"></div><div class="form-grid">${passwordFields()}</div><button class="btn primary auth-submit" type="submit">Lưu mật khẩu mới</button></form></section></div>`;
}
function renderClasses(){
  el.innerHTML=heading(cloud.user.role==='owner'?'Quản lý lớp':'Lớp của tôi','',cloud.user.role==='owner'?'create-class':'', 'Thêm lớp')+`<div class="class-grid">${cloud.classes.map(c=>`<article class="class-space" data-current="${c.id===cloud.classId}"><span class="class-label">${c.id===cloud.classId?'Đang xem':'Lớp học'}</span><h2>${esc(c.id===cloud.classId?db.className:c.name)}</h2><p>${esc(c.id===cloud.classId?db.schoolName:c.schoolName)}</p><p>${c.id===cloud.classId?db.students.length:c.students} học sinh</p><button class="btn primary" data-action="open-class" data-id="${esc(c.id)}">Xem lớp ${icon('arrow')}</button></article>`).join('')}</div>`;
}
function openClassForm(){if(cloud?.user.role!=='owner')return;showModal(modalHeader('Thêm lớp học','Tạo danh sách học sinh và lịch học riêng cho lớp mới.')+`<form id="create-class-form"><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${field('Tên lớp','name','','text',true,true)}${field('Trường','schoolName',db.schoolName,'text',true,true)}</div></div>${formFooter('Tạo lớp')}</form>`);}
async function switchClass(id){
  if(!cloud||cloud.busy||cloud.pending||dirty){if(cloud)$('#class-switcher').value=cloud.classId;notify('Lưu hoặc xử lý thay đổi hiện tại trước khi chuyển lớp.');return;}
  const old=cloud.classId;cloud.classId=id;cloud.busy=true;setCloudBusy(true);
  try{await cloud.load();db=normalizeData(cloud.data);try{sessionStorage.setItem('hoc-nhom-class',id);}catch{}query='';filter='active';topicFilter='all';selectedMembers.clear();closeModal(true);location.hash='overview';render();}
  catch(error){cloud.classId=old;$('#class-switcher').value=old;notify(error.message);}
  finally{cloud.busy=false;setCloudBusy(false);updateCloudIndicator('Đã đồng bộ');}
}
function openSettings(){
  showModal(modalHeader('Dữ liệu & cài đặt','Giữ thông tin lớp học gọn gàng và dễ mang theo.')+`<div class="modal-body"><div class="settings-notice">${cloud?'Dữ liệu lớp được lưu trong database riêng trên máy chủ và đồng bộ giữa các thiết bị sau khi đăng nhập. Hãy xuất bản sao định kỳ.':'Đây là bản trải nghiệm lưu trên trình duyệt hiện tại. Dữ liệu chưa đồng bộ giữa điện thoại, máy tính hoặc các phụ huynh. Xuất bản sao để chuyển sang thiết bị khác.'}</div>${cloud?`<section class="settings-block"><h3>Tài khoản đang đăng nhập</h3><p>${esc(cloud.user.name)} · ${esc(cloud.user.phone||cloud.user.email)}</p><div class="settings-actions">${cloud.user.role==='owner'?'<button class="btn" data-action="manage-users">Quản lý tài khoản phụ huynh</button>':''}<button class="btn" data-action="logout">Đăng xuất</button></div></section>`:''}<section class="settings-block"><h3>Lớp & trường</h3><form id="class-form" class="settings-class-row"><div class="field"><label for="f-className">Tên lớp</label><input id="f-className" name="className" value="${esc(db.className)}" maxlength="80" required autocomplete="off"></div><div class="field"><label for="f-schoolName">Trường</label><input id="f-schoolName" name="schoolName" value="${esc(db.schoolName)}" maxlength="150" required autocomplete="off"></div><button type="submit" class="btn primary">Lưu</button></form></section><section class="settings-block"><h3>Sao lưu & khôi phục</h3><p>Xuất toàn bộ ${db.students.length} học sinh, ${db.topics.length} chuyên đề và ${db.groups.length} nhóm học thành tệp JSON. Nhập bản sao sẽ thay thế dữ liệu hiện tại.</p><div class="settings-actions"><button class="btn" data-action="export">${icon('download')}Xuất bản sao</button><button class="btn" data-action="import">${icon('upload')}Nhập bản sao</button><input type="file" id="import-file" accept=".json,application/json" class="hidden" aria-label="Chọn tệp sao lưu"></div></section><section class="settings-block"><h3>Nhập danh sách học sinh từ CSV</h3><p>5 cột: Tên HS, Tên PH, Địa chỉ, SĐT HS, SĐT PH. Có thể thêm Tên PH 2, SĐT PH 2, Quan hệ PH 1, Quan hệ PH 2. Hỗ trợ tiêu đề Số Điện Thoại Phụ Huynh 1/2 từ Google Sheet.</p><div class="settings-actions"><button class="btn" data-action="import-csv">${icon('upload')}Nhập CSV</button><a class="btn" href="/hoc-sinh-demo.csv" download>${icon('download')}Tải CSV mẫu</a></div></section><section class="settings-block"><h3>Dữ liệu giả lập</h3><p>20 học sinh, 20 phụ huynh, 4 chuyên đề và 6 nhóm mẫu. Số bắt đầu bằng 000 là số giả, các nút liên hệ sẽ không thực hiện cuộc gọi.</p><button class="btn danger" data-action="reset-demo">${icon('refresh')}Khôi phục dữ liệu mẫu</button></section></div><div class="modal-footer"><button class="btn" data-action="close-modal">Đóng</button></div>`,'settings');
  if(cloud&&cloud.user.role!=='owner')$('#class-form').innerHTML=`<p><strong>${esc(db.className)}</strong><br>${esc(db.schoolName)}</p>`;
}
function confirmAction(title,text,callback,cancel=null,label='Xác nhận'){
  confirmCallback=callback;confirmCancel=cancel;
  showModal(modalHeader(title)+`<div class="modal-body"><p class="confirm-text">${esc(text)}</p></div><div class="modal-footer"><button class="btn" data-action="cancel-confirm">Hủy</button><button class="btn danger" data-action="confirm">${esc(label)}</button></div>`,'confirm');
}
function openSearch(){
  showModal(modalHeader('Tìm trong lớp học')+`<div class="modal-body" style="padding-top:10px;padding-bottom:0"><label class="search-dialog-field">${icon('search')}<input id="global-search" type="search" name="globalSearch" aria-label="Tìm học sinh, phụ huynh, nhóm hoặc chuyên đề" placeholder="Học sinh, phụ huynh, nhóm, chuyên đề…" autocomplete="off"></label></div><div id="global-results" class="search-results"><p class="search-instruction">Gõ tên có hoặc không dấu để tìm nhanh trong lớp.</p></div>`,'search');
  $('#global-search').focus();
}
function globalSearch(q){
  const key=fold(q.trim()),target=$('#global-results');if(!key){target.innerHTML='<p class="search-instruction">Gõ tên có hoặc không dấu để tìm nhanh trong lớp.</p>';return;}
  const students=db.students.filter(s=>fold(s.name+' '+parentSearch(s)+' '+s.phone).includes(key)).slice(0,6),topics=db.topics.filter(t=>fold(t.name+' '+t.subject).includes(key)).slice(0,4),groups=db.groups.filter(g=>fold(g.name+' '+g.hostName).includes(key)).slice(0,4);
  target.innerHTML=(students.length?'<p class="search-result-label">Học sinh & phụ huynh</p>'+students.map((s,i)=>`<button class="search-result" data-action="edit-student" data-id="${esc(s.id)}">${avatar(s.name,i)}<span>${esc(s.name)}<small>PH: ${esc(s.parent)}</small></span>${icon('chevron')}</button>`).join(''):'')+(topics.length?'<p class="search-result-label">Chuyên đề</p>'+topics.map(t=>`<a class="search-result" href="#topics/${esc(t.id)}"><span class="topic-mark ${esc(t.color)}">${icon(topicIcon(t))}</span><span>${esc(t.name)}<small>${esc(t.subject)}</small></span>${icon('chevron')}</a>`).join(''):'')+(groups.length?'<p class="search-result-label">Nhóm học</p>'+groups.map(g=>`<button class="search-result" data-action="group-detail" data-id="${esc(g.id)}">${icon('group')}<span>${esc(g.name)}<small>${esc(dateLabel(g.date))} · ${esc(g.start)}</small></span>${icon('chevron')}</button>`).join(''):'')||'<p class="search-instruction">Chưa có kết quả. Thử tên ngắn hơn hoặc kiểm tra danh sách lớp.</p>';
}
function errorForm(form,message,name){
  const box=$('.form-error',form);box.textContent=message;box.scrollIntoView({block:'nearest'});
  if(name){const input=form.elements.namedItem(name);input?.setAttribute('aria-invalid','true');input?.focus();}
  return false;
}
function requiredForm(form){
  $$('#modal [aria-invalid=true]').forEach(n=>n.removeAttribute('aria-invalid'));
  for(const input of [...form.elements])if(input.required&&!String(input.value).trim())return errorForm(form,'Vui lòng điền đầy đủ các trường bắt buộc.',input.name);
  for(const input of $$('input[type=tel]',form))if(input.value.trim()&&!/^(?:\+?\d[\d\s().-]{7,18}\d)$/.test(input.value.trim()))return errorForm(form,'Số điện thoại cần có 9–20 ký tự, chỉ gồm số, dấu +, khoảng trắng hoặc dấu ngăn cách.',input.name);
  return true;
}
function exportData(){
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`hoc-nhom-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Đã xuất bản sao dữ liệu lớp học.');
}
async function copyGroup(id){
  const g=group(id);if(!g)return;const text=`${g.name} — ${topic(g.topicId)?.name}\n${dateLabel(g.date,{day:'numeric',month:'numeric',year:'numeric'})}, ${g.start}–${g.end}\nĐịa điểm: ${g.address||'Chưa có'}\nChủ nhà: ${g.hostName||'Chưa có'} — ${g.hostPhone||'Chưa có SĐT'}\nThành viên: ${g.members.map(id=>student(id)?.name).join(', ')}${g.note?'\nLưu ý: '+g.note:''}`;
  try{await navigator.clipboard.writeText(text);notify('Đã sao chép thông tin nhóm.');}catch{showModal(modalHeader('Sao chép thông tin nhóm')+`<div class="modal-body"><div class="field"><label for="copy-text">Chọn nội dung và sao chép</label><textarea id="copy-text" readonly rows="10">${esc(text)}</textarea></div></div><div class="modal-footer"><button class="btn" data-action="close-modal">Đóng</button></div>`,'copy');$('#copy-text').select();}
}

document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  const {action,id}=button.dataset;
  if(button.tagName==='A'&&button.getAttribute('href')==='#')e.preventDefault();
  if(cloud?.busy){e.preventDefault();return;}
  if(cloud?.pending&&!['export','retry-cloud','reload-cloud'].includes(action)){notify('Có thay đổi chưa đồng bộ. Xuất bản sao hoặc tải dữ liệu mới trước khi tiếp tục.');return;}
  if(cloud?.user.role==='viewer'&&/^(new-|edit-|delete-|toggle-|reset-|commit-|import|next-|reschedule-)/.test(action)){notify('Tài khoản này chỉ có quyền xem dữ liệu.');return;}
  switch(action){
    case 'profile':location.hash='profile';break;
    case 'create-class':openClassForm();break;
    case 'open-class':await switchClass(id);break;
    case 'parents-from-students':confirmAction('Cấp tài khoản phụ huynh?', 'Tạo tài khoản chỉ xem cho các số điện thoại hợp lệ trong lớp hiện tại, với mật khẩu mặc định 12345678. Tài khoản đã có sẽ được cấp thêm lớp và giữ nguyên mật khẩu.', async()=>{try{const result=await cloud.request('/users/from-students?classId='+encodeURIComponent(cloud.classId),{method:'POST',body:'{}'});await openUserManagement();notify(`Đã tạo ${result.created} tài khoản, thêm ${result.linked} quyền lớp; bỏ qua ${result.skipped} dòng.`);}catch(error){notify(error.message);}},null,'Cấp tài khoản');break;
    case 'reset-parent-password':confirmAction('Đặt lại mật khẩu?', 'Mật khẩu trở về 12345678. Phụ huynh sẽ bị đăng xuất và phải đổi mật khẩu trong lần đăng nhập tiếp theo.',async()=>{try{await cloud.request('/users/reset-password',{method:'POST',body:JSON.stringify({id})});await openUserManagement();notify('Đã đặt lại mật khẩu.');}catch(error){notify(error.message);}},null,'Đặt lại');break;
    case 'logout':if(cloud){if(dirty)confirmAction('Đăng xuất và bỏ thay đổi?', 'Những thông tin đang nhập chưa được lưu.',async()=>{dirty=false;await cloud.logout();},null,'Đăng xuất');else await cloud.logout();}break;
    case 'manage-users':await openUserManagement();break;
    case 'retry-cloud':committed('Đã lưu lại lên database.');closeModal(true);break;
    case 'reload-cloud':try{await cloud.load();db=normalizeData(cloud.data);cloud.pending=null;storageFailed=false;closeModal(true);render();notify('Đã tải dữ liệu mới từ database.');}catch(error){notify(error.message);}break;
    case 'new-topic':openTopicForm();break;
    case 'edit-topic':openTopicForm(id);break;
    case 'new-student':openStudentForm();break;
    case 'edit-student':openStudentForm(id);break;
    case 'new-group':openGroupForm('',id);break;
    case 'edit-group':openGroupForm(id);break;
    case 'group-detail':openGroupDetail(id,button.dataset.session);break;
    case 'next-session':openSessionForm(id,'next');break;
    case 'reschedule-session':openSessionForm(id,'reschedule');break;
    case 'edit-session-note':openSessionForm(id,'note');break;
    case 'import-csv':openCSVImport();break;
    case 'choose-csv':$('#csv-file').click();break;
    case 'commit-csv':commitCSVImport();break;
    case 'settings':openSettings();break;
    case 'search':openSearch();break;
    case 'close-modal':closeModal();break;
    case 'keep-editing':$('#discard-warning').innerHTML='';break;
    case 'discard':closeModal(true);break;
    case 'demo-phone':notify('Đây là số điện thoại giả lập. Sửa thông tin và nhập số thật để gọi hoặc mở Zalo.');break;
    case 'filter':filter=id;setURLFilter();if(page==='topics')renderTopics();else renderGroups();break;
    case 'calendar-prev':monthDate=new Date(monthDate.getFullYear(),monthDate.getMonth()-1,1);render();break;
    case 'calendar-next':monthDate=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,1);render();break;
    case 'calendar-today':selectedDate=localDate();monthDate=new Date(new Date().getFullYear(),new Date().getMonth(),1);history.replaceState(null,'',`#calendar?date=${selectedDate}`);render();break;
    case 'calendar-day':selectedDate=id;if(page==='overview'){location.hash=`calendar?date=${id}`;}else{history.replaceState(null,'',`#calendar?date=${id}`);render();}break;
    case 'remove-member':selectedMembers.delete(id);$('#member-options').innerHTML=memberOptions($('#member-search').value);renderSelected();dirty=true;checkConflict();break;
    case 'toggle-group':{const g=group(id);g.done=!g.done;if(!g.done)topic(g.topicId).done=false;committed(g.done?'Đã đánh dấu buổi học hoàn thành.':'Đã mở lại để tiếp tục. Bạn có thể đổi lịch hoặc hẹn buổi tiếp theo.');openGroupDetail(id);break;}
    case 'toggle-topic':{const t=topic(id);if(!t.done&&db.groups.some(g=>g.topicId===id&&!g.done)){notify('Còn nhóm chưa hoàn thành. Hãy hoàn thành các nhóm trước khi kết thúc chuyên đề.');break;}t.done=!t.done;committed(t.done?'Đã hoàn thành chuyên đề.':'Đã mở lại chuyên đề.');break;}
    case 'delete-group':{const g=group(id);confirmAction('Xóa nhóm học?',`Nhóm “${g.name}” và lịch hẹn của nhóm sẽ bị xóa. Các học sinh vẫn được giữ trong danh sách lớp.`,()=>{db.groups=db.groups.filter(g=>g.id!==id);closeModal(true);if(page==='groups'&&routeId){location.hash='groups';routeId='';}committed('Đã xóa nhóm học.');},()=>openGroupDetail(id),'Xóa nhóm');break;}
    case 'delete-topic':{const t=topic(id),n=countGroups(id);confirmAction('Xóa chuyên đề?',`Xóa “${t.name}” cùng ${n} nhóm và lịch hẹn trong chuyên đề này? Học sinh vẫn được giữ trong danh sách lớp.`,()=>{db.topics=db.topics.filter(t=>t.id!==id);db.groups=db.groups.filter(g=>g.topicId!==id);closeModal(true);routeId='';location.hash='topics';committed('Đã xóa chuyên đề và các nhóm liên quan.');},null,'Xóa chuyên đề');break;}
    case 'delete-student':{const s=student(id),n=db.groups.filter(g=>g.members.includes(id)||(g.history||[]).some(h=>h.members.includes(id))).length;if(n){notify(`Học sinh đang thuộc ${n} nhóm hoặc có trong lịch sử buổi học. Hãy giữ thông tin để bảo toàn danh sách.`);break;}confirmAction('Xóa học sinh?',`Xóa thông tin ${s.name} và phụ huynh ${s.parent} khỏi danh sách lớp?`,()=>{db.students=db.students.filter(s=>s.id!==id);closeModal(true);committed('Đã xóa học sinh.');},null,'Xóa học sinh');break;}
    case 'confirm':{const cb=confirmCallback;confirmCallback=null;button.disabled=true;try{await cb?.();}finally{button.disabled=false;}break;}
    case 'cancel-confirm':{const cb=confirmCancel;closeModal(true);confirmCancel=null;cb?.();break;}
    case 'copy-group':await copyGroup(id);break;
    case 'export':exportData();break;
    case 'import':$('#import-file').click();break;
    case 'reset-demo':confirmAction('Khôi phục dữ liệu mẫu?','Toàn bộ dữ liệu lớp hiện tại sẽ được thay bằng bộ mẫu 20 học sinh. Hãy xuất bản sao trước nếu cần giữ dữ liệu hiện tại.',()=>{db=createDemo();closeModal(true);committed('Đã khôi phục bộ dữ liệu mẫu.');},()=>openSettings(),'Khôi phục');break;
  }
});
function setURLFilter(){const base=location.hash.split('?')[0]||`#${page}`;const p=new URLSearchParams();if(filter!=='active')p.set('status',filter);if(query)p.set('q',query);if(topicFilter!=='all')p.set('topic',topicFilter);history.replaceState(null,'',base+(p.size?'?'+p.toString():''));}
document.addEventListener('input',e=>{
  const target=e.target;
  if(target.closest('form')&&target.id!=='member-search')dirty=true;
  target.removeAttribute('aria-invalid');
  if(target.id==='list-search'){query=target.value;setURLFilter();if(page==='students')renderStudentList();else if(page==='groups')renderGroupList();else renderTopicList();}
  if(target.id==='member-search')$('#member-options').innerHTML=memberOptions(target.value);
  if(target.id==='global-search')globalSearch(target.value);
  if(['f-date','f-start','f-end'].includes(target.id)){checkConflict();checkSessionConflict();}
});
document.addEventListener('change',async e=>{
  const target=e.target;
  if(target.closest('form'))dirty=true;
  if(target.name==='member'){
    target.checked?selectedMembers.add(target.value):selectedMembers.delete(target.value);renderSelected();checkConflict();
  }
  if(target.id==='f-hostId'){
    const s=student(target.value);if(s){const p=visibleParents(s)[0];$('#f-hostName').value=p?.name||'';$('#f-hostPhone').value=p?.phone||'';$('#f-address').value=s.address||'';}
  }
  if(target.id==='csv-file')await previewCSVFile(target.files?.[0]);
  if(target.id==='topic-filter'){topicFilter=target.value;setURLFilter();renderGroupList();}
  if(target.id==='import-file'){
    const file=target.files?.[0];if(!file)return;if(file.size>5*1024*1024){notify('Tệp quá lớn. Chọn bản sao JSON nhỏ hơn 5 MB.');target.value='';return;}
    try{const parsed=JSON.parse(await file.text());if(!validateData(parsed))throw Error();confirmAction('Nhập bản sao dữ liệu?',`Thay thế dữ liệu hiện tại bằng ${parsed.students.length} học sinh, ${parsed.topics.length} chuyên đề và ${parsed.groups.length} nhóm từ tệp này?`,()=>{db=normalizeData(parsed);closeModal(true);committed('Đã nhập bản sao dữ liệu.');},()=>openSettings(),'Nhập và thay thế');}catch{notify('Tệp không hợp lệ. Chọn bản sao JSON được xuất từ Học Nhóm.');target.value='';}
  }
});
document.addEventListener('submit',async e=>{
  const special=e.target;
  if(['profile-form','password-form','create-class-form'].includes(special.id)||special.classList.contains('access-form')){
    e.preventDefault();if(!cloud||cloud.busy||cloud.pending)return;
    const button=special.querySelector('button[type=submit]'),input=Object.fromEntries(new FormData(special));button.disabled=true;
    try{
      if(special.id==='password-form'){await changePassword(cloud,special);special.reset();dirty=false;notify('Đã đổi mật khẩu. Các phiên đăng nhập khác đã kết thúc.');}
      else if(special.id==='profile-form'){const result=await cloud.request('/profile',{method:'PUT',body:JSON.stringify({...input,phone:input.phone??cloud.user.phone,email:input.email??cloud.user.email})});cloud.user=result.user;dirty=false;render();notify('Đã cập nhật hồ sơ.');}
      else if(special.classList.contains('access-form')){await cloud.request('/users/access',{method:'PUT',body:JSON.stringify({...input,id:special.dataset.id,classIds:new FormData(special).getAll('classIds')})});dirty=false;await openUserManagement();notify('Đã lưu quyền truy cập.');}
      else {const result=await cloud.request('/classes',{method:'POST',body:JSON.stringify(input)});cloud.classes=result.classes;dirty=false;closeModal(true);await switchClass(result.id);notify('Đã tạo lớp. Bạn có thể thêm học sinh hoặc nhập CSV.');}
    }catch(error){const target=special.querySelector('.form-error');if(target)target.textContent=error.message;else notify(error.message);}
    finally{button.disabled=false;}return;
  }
  const form=e.target;if(!['student-form','topic-form','group-form','class-form','session-form','user-form'].includes(form.id))return;e.preventDefault();
  if(cloud?.busy||cloud?.pending)return;
  if(cloud?.user.role==='viewer'){notify('Tài khoản chỉ có quyền xem.');return;}
  if(form.id==='user-form'){const button=$('button[type=submit]',form);button.disabled=true;try{await cloud.addUser({...Object.fromEntries(new FormData(form)),classIds:new FormData(form).getAll('classIds')});dirty=false;await cloud.load();db=normalizeData(cloud.data);render();await openUserManagement();notify('Đã tạo tài khoản và cập nhật học sinh vào lớp. Phụ huynh đăng nhập bằng số điện thoại và mật khẩu lần đầu 12345678.');}catch(error){$('.form-error',form).textContent=error.message;}finally{button.disabled=false;}return;}
  const f=new FormData(form),id=form.dataset.id;
  const get=k=>String(f.get(k)||'').trim();
  if(form.id==='class-form'){if(cloud&&cloud.user.role!=='owner'){notify('Chỉ admin có quyền đổi thông tin lớp.');return;}const name=get('className');if(!name){form.elements.className.focus();return;}const school=get('schoolName');if(!school){form.elements.schoolName.focus();return;}db.className=name;db.schoolName=school;dirty=false;committed('Đã lưu lớp và trường.');return;}
  if(!requiredForm(form))return;
  if(form.id==='session-form'){saveSessionForm(form);return;}
  if(form.id==='student-form'){
    const old=student(id),s={id:id||uid(),name:get('name'),phone:get('phone'),parent:get('parent'),parentPhone:get('parentPhone'),parent2:get('parent2'),parentPhone2:get('parentPhone2'),relation2:get('relation2'),address:get('address'),relation:get('relation'),note:get('note'),demo:!!old?.demo};
    if(s.parentPhone2&&!/^0[35789]\d{8}$/.test(parentPhoneKey(s.parentPhone2)))return errorForm(form,'Số phụ huynh 2 cần là số di động Việt Nam hợp lệ.','parentPhone2');
    if(s.parentPhone&&s.parentPhone2&&parentPhoneKey(s.parentPhone)===parentPhoneKey(s.parentPhone2))return errorForm(form,'Hai số phụ huynh phải khác nhau.','parentPhone2');
    if(old){db.students[db.students.indexOf(old)]=s;updateHostContact(old,s);}else{db.students.push(s);}
    closeModal(true);committed(id?'Đã cập nhật thông tin học sinh.':'Đã thêm học sinh vào lớp.');
  }else if(form.id==='topic-form'){
    const old=topic(id),t={id:id||uid(),name:get('name'),subject:get('subject'),due:get('due'),color:get('color'),description:get('description'),done:old?.done||false};
    if(!/^\d{4}-\d{2}-\d{2}$/.test(t.due)||Number.isNaN(dDate(t.due).valueOf()))return errorForm(form,'Chọn ngày hoàn thành hợp lệ.','due');
    if(old)db.topics[db.topics.indexOf(old)]=t;else db.topics.push(t);closeModal(true);committed(id?'Đã lưu chuyên đề.':'Đã tạo chuyên đề. Bây giờ bạn có thể thêm nhóm học.');
    if(!id)location.hash=`topics/${t.id}`;
  }else if(form.id==='group-form'){
    if(!selectedMembers.size)return errorForm(form,'Chọn ít nhất một học sinh cho nhóm.','memberSearch');
    if(get('start')>=get('end'))return errorForm(form,'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.','end');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(get('date'))||Number.isNaN(dDate(get('date')).valueOf()))return errorForm(form,'Chọn ngày học hợp lệ.','date');
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(get('start'))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(get('end')))return errorForm(form,'Chọn giờ bắt đầu và kết thúc hợp lệ.','start');
    const old=group(id),g={id:id||uid(),topicId:get('topicId'),name:get('name'),members:[...selectedMembers],hostId:get('hostId'),hostName:get('hostName'),hostPhone:get('hostPhone'),address:get('address'),date:get('date'),start:get('start'),end:get('end'),note:get('note'),done:old?.done||false,history:old?.history||[],sessionId:old?.sessionId||uid()};
    if(old)db.groups[db.groups.indexOf(old)]=g;else db.groups.push(g);if(!g.done)topic(g.topicId).done=false;closeModal(true);committed(id?'Đã cập nhật nhóm học.':'Đã tạo nhóm học và lịch hẹn.');openGroupDetail(g.id);
  }
});
modal.addEventListener('cancel',e=>{e.preventDefault();closeModal();});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dirty)openSearch();}});
window.addEventListener('beforeunload',e=>{if(dirty||cloud?.busy||cloud?.pending){e.preventDefault();e.returnValue='';}});
window.addEventListener('hashchange',()=>{if(dirty&&!modal.open){const destination=location.hash;history.replaceState(null,'','#'+page);confirmAction('Bỏ thay đổi chưa lưu?','Thông tin bạn đang nhập chưa được lưu. Tiếp tục để chuyển trang.',()=>{dirty=false;closeModal(true);location.hash=destination;},()=>{dirty=true;},'Bỏ thay đổi');return;}if(dirty&&modal.open){closeModal();return;}readRoute();el.focus({preventScroll:true});window.scrollTo({top:0});});
window.addEventListener('storage',e=>{if(cloud)return;if(e.key===STORAGE_KEY&&e.newValue){try{const next=JSON.parse(e.newValue);if(validateData(next)){if(dirty){notify('Dữ liệu đã đổi ở tab khác. Xuất bản sao trước khi lưu nếu cần giữ cả hai bản.');return;}db=normalizeData(next);render();if(modal.open&&modalKind==='detail')closeModal(true);notify('Đã cập nhật dữ liệu từ tab khác.');}}catch{}}});
readRoute();
if(loadFailed)notify('Dữ liệu đã lưu không đọc được. Đang mở bộ mẫu; bản cũ vẫn giữ trên trình duyệt cho đến khi bạn lưu thay đổi.');
if(!cloud&&!hadStoredData&&!loadFailed)persist();
if(cloud){
  const refresh=async()=>{if(document.hidden||cloud.busy||cloud.pending||dirty||modal.open)return;try{const id=cloud.classId,[next,parents]=await Promise.all([cloud.request(cloud.statePath()),cloud.request('/parent-links?classId='+encodeURIComponent(id))]);if(id!==cloud.classId||cloud.busy||dirty||modal.open)return;const changed=next.revision!==cloud.revision,parentsChanged=JSON.stringify(parents.links)!==JSON.stringify(cloud.parentLinks);if(changed){cloud.data=next.data;cloud.revision=next.revision;db=normalizeData(next.data);}cloud.parentLinks=parents.links;if(changed||parentsChanged){render();notify(changed?'Đã cập nhật dữ liệu từ thiết bị khác.':'Đã cập nhật phụ huynh kích hoạt.');}}catch(error){updateCloudIndicator(error.status===401?'Cần đăng nhập lại':'Mất kết nối');}};
  setInterval(refresh,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}

document.addEventListener('change',e=>{if(e.target.id==='class-switcher')switchClass(e.target.value);});

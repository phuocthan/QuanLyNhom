import { STORAGE_KEY, localDate, uid, fold, createDemo, validateData } from './data.js';

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
let db;
try {const raw=localStorage.getItem(STORAGE_KEY);hadStoredData=!!raw; if(raw){const parsed=JSON.parse(raw);if(!validateData(parsed))throw Error('Dữ liệu không hợp lệ');db=parsed;}else db=createDemo();}catch {db=createDemo();loadFailed=true;}
let page='overview',routeId='',filter='active',query='',topicFilter='all';
let monthDate=new Date(new Date().getFullYear(),new Date().getMonth(),1),selectedDate=localDate();
let selectedMembers=new Set(),editingGroup=null,dirty=false,modalKind='',previousFocus=null,toastTimer;
let confirmCallback=null,confirmCancel=null;
const COLORS=['purple','orange','blue','green','pink'];
const SUBJECTS=['Khoa học tự nhiên','Ngữ văn','Toán học','Tiếng Anh','Lịch sử & Địa lý','Tin học','Mỹ thuật','Hoạt động trải nghiệm','Khác'];
const navigations=[['overview','Tổng quan','home'],['topics','Chuyên đề','book'],['groups','Nhóm học','group'],['students','Học sinh','users'],['calendar','Lịch học nhóm','calendar']];
const dDate = date=>new Date(date+'T12:00:00');
const dateLabel = (date,opts={day:'numeric',month:'numeric'})=>new Intl.DateTimeFormat('vi-VN',opts).format(dDate(date));
const weekday = date=>new Intl.DateTimeFormat('vi-VN',{weekday:'long'}).format(dDate(date));
const initials = name=>String(name).trim().split(/\s+/).slice(-2).map(s=>s[0]).join('').toUpperCase();
const avatar=(name,i=0)=>`<span class="avatar c${i%5}" aria-hidden="true">${esc(initials(name))}</span>`;
const student = id=>db.students.find(s=>s.id===id);
const topic = id=>db.topics.find(t=>t.id===id);
const group = id=>db.groups.find(g=>g.id===id);
const topicIcon=t=>t?.color==='orange'?'book':t?.color==='blue'?'math':t?.color==='green'?'globe':t?.color==='pink'?'leaf':'rocket';
const countGroups = id=>db.groups.filter(g=>g.topicId===id).length;
const subjectBadge=t=>`<span class="subject ${esc(t?.color||'purple')}">${icon(topicIcon(t))}${esc(t?.subject||'Chuyên đề')}</span>`;
const numberFormat = n=>new Intl.NumberFormat('vi-VN').format(n);
const dateTime = g=>new Date(`${g.date}T${g.end}`);
const upcoming = ()=>db.groups.filter(g=>!g.done&&!topic(g.topicId)?.done&&dateTime(g)>=new Date()).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
function relativeDay(date){const delta=Math.round((dDate(date)-dDate(localDate()))/86400000);return delta===0?'Hôm nay':delta===1?'Ngày mai':delta===-1?'Hôm qua':dateLabel(date);}
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db));storageFailed=false;$('.local-indicator').innerHTML='<i></i> Đã lưu trên máy';return true;}
  catch {storageFailed=true;$('.local-indicator').textContent='Chưa lưu được';notify('Trình duyệt không lưu được dữ liệu. Hãy xuất bản sao trước khi đóng trang.');return false;}
}
function committed(message){const saved=persist();render();if(saved)notify(message);}
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
  $('#nav').innerHTML=navigations.map(([id,label,ico])=>`<a class="nav-item ${page===id?'active':''}" href="#${id}" ${page===id?'aria-current="page"':''}>${icon(ico)}<span>${label}</span>${id==='students'?`<span class="nav-count">${db.students.length}</span>`:''}</a>`).join('');
  $('#mobile-nav').innerHTML=navigations.map(([id,label,ico])=>`<a href="#${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(ico)}<span>${id==='calendar'?'Lịch học':label}</span></a>`).join('');
  $('#sidebar-class').textContent=db.className;$('#top-class').textContent=db.className;
}
function heading(title,sub,action,label){return `<div class="page-heading"><div><h1>${esc(title)}</h1><p class="page-subtitle">${esc(sub)}</p></div>${action?`<button class="btn primary" data-action="${action}" aria-label="${esc(label)}">${icon('plus')}<span>${esc(label)}</span></button>`:''}</div>`;}
function empty(title,text,action='',label=''){return `<div class="empty">${icon('book')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action?`<button class="btn soft" data-action="${action}">${icon('plus')}${esc(label)}</button>`:''}</div>`;}
function statusTopic(t){return t.done?'<span class="status done">✓ Đã hoàn thành</span>':t.due<localDate()?'<span class="status overdue">Quá hạn</span>':'<span class="status">Đang thực hiện</span>';}
function sessionCard(g){
  const t=topic(g.topicId),host=student(g.hostId),members=g.members.map(student).filter(Boolean);
  const status=g.done||t?.done?'Đã hoàn thành':dateTime(g)<new Date()?'Đã qua':relativeDay(g.date);
  return `<article class="session-card"><div class="session-body"><div class="card-top">${subjectBadge(t)}<span class="when-tag ${g.date===localDate()&&!g.done&&!t?.done?'today':''}">${esc(status)}</span></div><h3>${esc(g.name)}</h3><p class="topic-name">${esc(t?.name)}</p><div class="session-info"><div class="info-line">${icon('clock')}<span><strong>${esc(g.start)} – ${esc(g.end)}</strong><span> · ${esc(dateLabel(g.date))}</span></span></div><div class="info-line">${icon('pin')}<span class="truncate" title="${esc(g.address)}">${esc(g.address||'Chưa có địa điểm')}</span></div></div><div class="host-line">${avatar(g.hostName||'Chủ nhà',3)}<div class="truncate"><strong>${esc(g.hostName||'Chưa chọn chủ nhà')}</strong>${host?`Phụ huynh của ${esc(host.name.split(' ').slice(-2).join(' '))}`:'Chủ nhà đón nhóm'}</div></div></div><div class="session-footer"><div class="avatar-stack">${members.slice(0,3).map((s,i)=>avatar(s.name,i)).join('')}${members.length>3?`<span class="avatar more-avatar">+${members.length-3}</span>`:''}<span class="member-label">${members.length} thành viên</span></div><button class="text-link" data-action="group-detail" data-id="${esc(g.id)}">Xem nhóm ${icon('arrow')}</button></div></article>`;
}
function art(){return `<svg class="welcome-art" viewBox="0 0 300 185" fill="none" aria-hidden="true"><ellipse cx="174" cy="175" rx="105" ry="8" fill="#d9e9dc"/><path d="M80 146h126v22H80z" fill="#779d83"/><path d="M88 146h118v16H88z" fill="#fbfbef"/><path d="M80 146h8v22h-8z" fill="#6c9478"/><path d="M100 127h119v20H100z" fill="#e9b76f"/><path d="M108 130h111v12H108z" fill="#fff9e8"/><path d="M66 112h130v18H66z" fill="#9cb8c7"/><path d="M74 114h122v12H74z" fill="#f6f8ed"/><path d="m114 66 53 10-17 51-53-10z" fill="#4f8a6c"/><path d="m120 63 51 11-17 51-51-11z" fill="#fffbee"/><path d="m126 74 31 7m-34 3 30 7m-33 3 23 5" stroke="#c0ceba" stroke-width="2.5" stroke-linecap="round"/><path d="m115 66-14 48" stroke="#b9c4a4"/><path d="m150 59 49-11 17 66-49 11z" fill="#f5f1d8"/><path d="m160 70 26-6m-24 15 26-6m-23 15 19-4" stroke="#c8cbaa" stroke-width="2.5" stroke-linecap="round"/><path d="m190 45 18 68 8 1-17-66z" fill="#d5d8b4"/><path d="M226 137h31l-5 33h-21z" fill="#d8a277"/><path d="M230 141h23" stroke="#bc8a62" stroke-width="2"/><path d="M241 139V99m0 25c-22-2-21-20-21-20 21 1 21 20 21 20Zm1-14c-1-20 17-25 17-25 3 20-17 25-17 25Z" stroke="#82a17b" stroke-width="2" fill="#a0bd90"/><path d="M238 102c-17-9-9-28-9-28 16 10 9 28 9 28Z" fill="#79a37a"/><path d="m61 83 5-12 5 12 12 5-12 5-5 12-5-12-12-5z" fill="#d5e2a8"/><circle cx="208" cy="27" r="5" fill="#d5e2bc"/><path d="m93 37 4 4m-4 0 4-4M245 53l4 4m-4 0 4-4" stroke="#aec4a5" stroke-width="2" stroke-linecap="round"/></svg>`;}
function renderOverview(){
  const list=upcoming(),next=list[0],active=db.topics.filter(t=>!t.done);
  el.innerHTML=heading('Một tuần học cùng nhau','Theo dõi các nhóm học và đồng hành cùng con mỗi ngày.','new-topic','Tạo chuyên đề')+
  `<section class="welcome"><div class="welcome-text"><div class="welcome-kicker">${icon('sun')} Chào ngày mới, phụ huynh ${esc(db.className.replace(/^Lớp\s*/i,''))}!</div><h2>${next?'Những buổi học nhỏ,<br>những khám phá lớn.':'Cùng bạn bè, học thêm điều hay.'}</h2><p>${next?`Buổi học tiếp theo: <strong>${esc(next.name)}</strong><br>${esc(next.start)} · ${esc(relativeDay(next.date))} · Nhà bạn ${esc(student(next.hostId)?.name.split(' ').slice(-2).join(' ')||next.hostName||'chưa xác định')}`:'Tạo chuyên đề đầu tiên và kết nối các bạn trong lớp.'}</p>${next?`<button class="hero-link" data-action="group-detail" data-id="${esc(next.id)}">Xem thông tin buổi học ${icon('arrow')}</button>`:`<button class="hero-link" data-action="new-topic">Tạo chuyên đề ${icon('arrow')}</button>`}</div>${art()}</section>`+
  `<div class="stats">${[[db.students.length,'Học sinh trong lớp','users',''],[active.length,'Chuyên đề đang làm','book','purple'],[db.groups.filter(g=>!g.done&&!topic(g.topicId)?.done).length,'Nhóm đang hoạt động','group','orange'],[list.length,'Buổi học sắp tới','calendar','green']].map(([n,label,ico,color])=>`<div class="stat"><span class="stat-icon ${color}">${icon(ico)}</span><div><strong>${numberFormat(n)}</strong><small>${label}</small></div></div>`).join('')}</div>`+
  `<div class="dashboard-grid"><div><section><div class="section-head"><h2>Buổi học sắp tới <span class="subcount">${list.length}</span></h2><a href="#calendar" class="text-link">Xem lịch học ${icon('arrow')}</a></div>${list.length?`<div class="session-grid">${list.slice(0,2).map(sessionCard).join('')}</div>`:empty('Chưa có buổi học sắp tới','Chọn một chuyên đề và hẹn buổi học cho các con.','new-group','Tạo nhóm học')}</section><section class="dashboard-topics"><div class="section-head"><h2>Chuyên đề đang thực hiện</h2><a href="#topics" class="text-link">Tất cả chuyên đề ${icon('arrow')}</a></div>${active.length?`<div class="topic-rows">${active.slice(0,3).map(t=>`<a class="topic-row" href="#topics/${esc(t.id)}"><span class="topic-mark ${esc(t.color)}">${icon(topicIcon(t))}</span><div class="truncate"><h3 class="truncate">${esc(t.name)}</h3><p>${esc(t.subject)} · ${countGroups(t.id)} nhóm học</p></div><span class="due">Hạn ${esc(dateLabel(t.due))}</span>${icon('chevron')}</a>`).join('')}</div>`:empty('Mọi chuyên đề đã hoàn thành','Tạo một chuyên đề mới để tiếp tục học cùng nhau.','new-topic','Tạo chuyên đề')}</section></div><aside class="dashboard-right"><div class="mini-calendar">${calendarHTML(false)}</div><div class="parent-tip">${icon('leaf')}<h3>Mỗi kết nối, thêm gần gũi</h3><p>Danh sách lớp giúp bạn tìm nhanh phụ huynh và liên hệ khi cần đón, đưa các con.</p><a href="#students" class="text-link">Mở danh sách lớp ${icon('arrow')}</a></div><p class="demo-note">${icon('info')}<span>Dữ liệu mẫu để trải nghiệm.<br>Số điện thoại và địa chỉ chỉ là giả lập.</span></p></aside></div>`;
}
function topicCard(t){
  return `<article class="topic-card"><div class="card-top"><span class="topic-mark ${esc(t.color)}">${icon(topicIcon(t))}</span>${statusTopic(t)}</div><h3>${esc(t.name)}</h3><p>${esc(t.description||'Chưa có mô tả cho chuyên đề này.')}</p><div class="topic-card-meta"><span>${icon('group')}${countGroups(t.id)} nhóm học</span><span>${icon('calendar')}Hạn ${esc(dateLabel(t.due))}</span></div><div class="topic-card-bottom">${subjectBadge(t)}<a href="#topics/${esc(t.id)}" class="text-link">Xem chuyên đề ${icon('arrow')}</a></div></article>`;
}
function renderTopics(){
  el.innerHTML=heading('Chuyên đề của lớp','Mỗi chủ đề mới, một hành trình cùng bạn bè.','new-topic','Tạo chuyên đề')+`<div class="toolbar"><div class="tabs" aria-label="Lọc chuyên đề">${[['active','Đang thực hiện'],['done','Đã hoàn thành'],['all','Tất cả']].map(([id,label])=>`<button data-action="filter" data-id="${id}" class="${filter===id?'active':''}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><label class="search-field">${icon('search')}<input type="search" id="list-search" name="topicSearch" aria-label="Tìm chuyên đề" placeholder="Tìm tên chuyên đề…" value="${esc(query)}" autocomplete="off"></label></div><div id="topic-list"></div>`;renderTopicList();
}
function renderTopicList(){const list=db.topics.filter(t=>(filter==='all'||(filter==='done')===t.done)&&fold(t.name+' '+t.subject).includes(fold(query)));$('#topic-list').innerHTML=list.length?`<div class="full-grid">${list.map(topicCard).join('')}</div>`:empty('Chưa tìm thấy chuyên đề','Thử tên khác hoặc tạo chuyên đề mới.','new-topic','Tạo chuyên đề');}
function renderTopicDetail(id){
  const t=topic(id);if(!t){location.hash='topics';return;}
  const list=db.groups.filter(g=>g.topicId===id);
  el.innerHTML=`<a class="back-link" href="#topics">${icon('left')}Tất cả chuyên đề</a>`+heading(t.name,`${t.subject} · Hạn hoàn thành ${dateLabel(t.due,{day:'numeric',month:'numeric',year:'numeric'})}`,'','')+`<section class="topic-detail-summary"><div class="card-top">${subjectBadge(t)}${statusTopic(t)}</div><p class="wrap-text">${esc(t.description||'Chưa có mô tả.')}</p><div class="detail-actions"><button class="btn small" data-action="edit-topic" data-id="${esc(t.id)}">${icon('edit')}Sửa chuyên đề</button><button class="btn small" data-action="toggle-topic" data-id="${esc(t.id)}">${icon(t.done?'refresh':'check')}${t.done?'Mở lại chuyên đề':'Đánh dấu hoàn thành'}</button><button class="icon-btn" data-action="delete-topic" data-id="${esc(t.id)}" aria-label="Xóa chuyên đề">${icon('trash')}</button></div></section><div class="section-head"><h2>Các nhóm học <span class="subcount">${list.length}</span></h2><button class="btn primary small" data-action="new-group" data-id="${esc(t.id)}">${icon('plus')}Tạo nhóm</button></div>${list.length?`<div class="full-grid">${list.map(sessionCard).join('')}</div>`:empty('Chuyên đề chưa có nhóm','Chọn các bạn trong lớp để tạo nhóm đầu tiên.','new-group','Tạo nhóm học')}`;
}
function renderGroups(){
  el.innerHTML=heading('Những nhóm học nhỏ','Thành viên có thể thay đổi linh hoạt trong từng chuyên đề.','new-group','Tạo nhóm học')+`<div class="toolbar"><div class="tabs" aria-label="Lọc nhóm học">${[['active','Đang hoạt động'],['done','Đã hoàn thành'],['all','Tất cả']].map(([id,label])=>`<button data-action="filter" data-id="${id}" class="${filter===id?'active':''}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><div class="actions-wrap"><label class="search-field">${icon('search')}<input id="list-search" name="groupSearch" type="search" autocomplete="off" placeholder="Tìm nhóm hoặc học sinh…" aria-label="Tìm nhóm hoặc học sinh" value="${esc(query)}"></label><select id="topic-filter" name="topicFilter" aria-label="Lọc theo chuyên đề"><option value="all">Tất cả chuyên đề</option>${db.topics.map(t=>`<option value="${esc(t.id)}" ${topicFilter===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div></div><div id="group-list"></div>`;renderGroupList();
}
function renderGroupList(){
  const list=db.groups.filter(g=>{const done=g.done||topic(g.topicId)?.done;return (filter==='all'||(filter==='done')===done)&&(topicFilter==='all'||g.topicId===topicFilter)&&fold(g.name+' '+topic(g.topicId)?.name+' '+g.members.map(id=>student(id)?.name).join(' ')).includes(fold(query));}).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  $('#group-list').innerHTML=list.length?`<p class="group-filter-info">${list.length} nhóm học · Mở nhóm để xem thành viên và liên hệ chủ nhà.</p><div class="full-grid">${list.map(sessionCard).join('')}</div>`:empty('Chưa tìm thấy nhóm học','Thử thay đổi bộ lọc hoặc tạo một nhóm mới.','new-group','Tạo nhóm học');
}
function renderStudents(){
  el.innerHTML=heading('Bạn bè trong lớp','Học sinh và phụ huynh, luôn dễ dàng kết nối.','new-student','Thêm học sinh')+`<div class="toolbar"><p class="group-filter-info" style="margin:0">${db.students.length} học sinh · ${db.students.filter(s=>s.parent).length} phụ huynh đại diện</p><label class="search-field">${icon('search')}<input id="list-search" type="search" name="studentSearch" autocomplete="off" aria-label="Tìm học sinh hoặc phụ huynh" placeholder="Tìm học sinh, phụ huynh, số điện thoại…" value="${esc(query)}"></label></div><div id="student-list"></div>`;renderStudentList();
}
function renderStudentList(){
  const list=db.students.filter(s=>fold(s.name+' '+s.parent+' '+s.phone+' '+s.parentPhone).includes(fold(query)));
  $('#student-list').innerHTML=list.length?`<div class="students-panel"><table class="students-table"><thead><tr><th>Học sinh</th><th class="student-phone-col">Số điện thoại học sinh</th><th>Phụ huynh đại diện</th><th>Liên hệ phụ huynh</th><th><span class="optional">Thao tác</span></th></tr></thead><tbody>${list.map((s,i)=>`<tr><td><div class="student-name">${avatar(s.name,i)}<div><strong>${esc(s.name)}</strong><small>${db.groups.filter(g=>g.members.includes(s.id)).length} nhóm học${s.demo?' · Mẫu':''}</small></div></div></td><td class="student-phone-col"><span class="phone-text">${esc(s.phone||'Chưa có SĐT')}</span></td><td class="parent-info"><strong>${esc(s.parent)} <span class="optional">(${esc(s.relation)})</span></strong><small class="phone-text">${esc(s.parentPhone||'Chưa có SĐT')}</small></td><td class="contact-cell">${contacts(s.parentPhone,s.parent)}</td><td class="record-actions"><button class="icon-btn" data-action="edit-student" data-id="${esc(s.id)}" aria-label="Sửa ${esc(s.name)}">${icon('edit')}</button><button class="icon-btn" data-action="delete-student" data-id="${esc(s.id)}" aria-label="Xóa ${esc(s.name)}">${icon('trash')}</button></td></tr>`).join('')}</tbody></table><div class="table-footer">Hiển thị ${list.length} / ${db.students.length} học sinh. Số bắt đầu bằng 000 là số giả lập, không thể gọi hoặc mở Zalo.</div></div>`:empty('Chưa tìm thấy học sinh','Tìm bằng tên có hoặc không dấu, tên phụ huynh hay số điện thoại.','new-student','Thêm học sinh');
}
function calendarHTML(big){
  const y=monthDate.getFullYear(),m=monthDate.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),offset=(first.getDay()+6)%7;
  const title=new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(monthDate);
  const cells=[];
  for(let i=0;i<offset;i++)cells.push(`<span class="outside">${new Date(y,m,-offset+i+1).getDate()}</span>`);
  for(let day=1;day<=last.getDate();day++){
    const value=localDate(new Date(y,m,day)),events=db.groups.filter(g=>g.date===value);
    cells.push(`<button data-action="calendar-day" data-id="${value}" class="${value===localDate()?'today':''} ${value===selectedDate?'selected':''} ${events.length?'has-event':''}" aria-label="${esc(dateLabel(value,{day:'numeric',month:'long',year:'numeric'}))}${events.length?`, ${events.length} buổi học`:''}" ${value===selectedDate?'aria-pressed="true"':''}><span>${day}</span>${big?events.slice(0,2).map(g=>`<span class="event-dot ${esc(topic(g.topicId)?.color)}">${esc(g.start)} ${esc(g.name)}</span>`).join(''):''}</button>`);
  }
  const remaining=(7-cells.length%7)%7;for(let i=1;i<=remaining;i++)cells.push(`<span class="outside">${i}</span>`);
  return `<div class="calendar-header"><h3>${esc(title[0].toUpperCase()+title.slice(1))}</h3><div class="calendar-buttons">${big?'<button class="btn small" data-action="calendar-today">Hôm nay</button>':''}<button class="icon-btn" data-action="calendar-prev" aria-label="Tháng trước">${icon('left')}</button><button class="icon-btn" data-action="calendar-next" aria-label="Tháng sau">${icon('chevron')}</button></div></div><div class="calendar-weekdays">${['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-days">${cells.join('')}</div>${big?'':'<div class="calendar-legend"><i></i> Có buổi học nhóm</div>'}`;
}
function renderCalendar(){
  const list=db.groups.filter(g=>g.date===selectedDate).sort((a,b)=>a.start.localeCompare(b.start));
  el.innerHTML=heading('Lịch học nhóm','Biết con học cùng ai, ở đâu và vào lúc nào.','new-group','Thêm buổi học')+`<div class="calendar-layout"><section class="big-calendar">${calendarHTML(true)}</section><section class="day-agenda"><h2>${esc(weekday(selectedDate))}, ${esc(dateLabel(selectedDate,{day:'numeric',month:'numeric',year:'numeric'}))}</h2>${list.length?list.map(sessionCard).join(''):empty('Một ngày thảnh thơi','Chưa có buổi học nào vào ngày này.','new-group','Hẹn buổi học')}</section></div>`;
}
function render(){
  renderNav();
  if(page==='topics'&&routeId)renderTopicDetail(routeId);
  else if(page==='topics')renderTopics();else if(page==='groups')renderGroups();else if(page==='students')renderStudents();else if(page==='calendar')renderCalendar();else renderOverview();
  $$('.topbar [data-icon],.sidebar [data-icon]').forEach(n=>n.innerHTML=icon(n.dataset.icon));
  $('.app-footer button').textContent=`${db.students.some(s=>s.demo)?'Có dữ liệu mẫu · ':''}${storageFailed?'Chưa lưu được dữ liệu':'Lưu trên thiết bị này'}`;
}
function readRoute(){
  const [base,params='']=(location.hash.slice(1)||'overview').split('?');const [next,id='']=base.split('/');
  const nextPage=navigations.some(n=>n[0]===next)?next:'overview';
  if(nextPage!==page){filter='active';query='';topicFilter='all';}
  page=nextPage;routeId=id;
  const routeParams=new URLSearchParams(params);
  filter=['active','done','all'].includes(routeParams.get('status'))?routeParams.get('status'):'active';
  query=routeParams.get('q')||'';topicFilter=routeParams.get('topic')||'all';
  if(page==='calendar'){const date=new URLSearchParams(params).get('date');if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(dDate(date).valueOf())){selectedDate=date;const d=dDate(date);monthDate=new Date(d.getFullYear(),d.getMonth(),1);}}
  closeModal(true);render();
  if(page==='groups'&&routeId&&group(routeId))openGroupDetail(routeId);
}

function showModal(html,kind='form',drawer=false){
  if(!modal.open)previousFocus=document.activeElement;
  dirty=false;modalKind=kind;modal.className=drawer?'drawer':kind==='search'?'search-modal':'';
  content.innerHTML=html;if(!modal.open)modal.showModal();document.body.classList.add('modal-open');
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
  showModal(modalHeader(id?'Sửa thông tin học sinh':'Thêm học sinh','Thông tin học sinh và phụ huynh đại diện.')+`<form id="student-form" data-id="${esc(id||'')}" novalidate><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${field('Họ và tên học sinh','name',s.name,'text',true,true,'VD: Nguyễn Minh Anh…')}${field('Số điện thoại học sinh','phone',s.phone,'tel',false,true,'VD: 0912 345 678…')}<div class="form-divider">Phụ huynh đại diện</div>${field('Họ và tên phụ huynh','parent',s.parent,'text',true,true,'VD: Nguyễn Thu Hương…')}<div class="field"><label for="f-relation">Mối quan hệ</label><select id="f-relation" name="relation">${['Mẹ','Bố','Người giám hộ'].map(r=>`<option ${r===s.relation?'selected':''}>${r}</option>`).join('')}</select></div>${field('Số điện thoại phụ huynh','parentPhone',s.parentPhone,'tel',false,false,'VD: 0912 345 678…')}<div class="field full"><label for="f-note">Ghi chú <span class="optional">(không bắt buộc)</span></label><textarea id="f-note" name="note" maxlength="2000" placeholder="Thông tin cần lưu ý…">${esc(s.note||'')}</textarea></div></div></div>${formFooter(id?'Lưu thay đổi':'Thêm học sinh')}</form>`);
}
function openTopicForm(id){
  const t=topic(id)||{color:'purple',due:localDate()};
  showModal(modalHeader(id?'Sửa chuyên đề':'Tạo chuyên đề','Bắt đầu từ một ý tưởng, cùng nhau học điều mới.')+`<form id="topic-form" data-id="${esc(id||'')}" novalidate><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${field('Tên chuyên đề','name',t.name,'text',true,true,'VD: Khám phá hệ Mặt Trời…')}<div class="field"><label for="f-subject">Môn học</label><select id="f-subject" name="subject">${[...new Set([...SUBJECTS,t.subject].filter(Boolean))].map(s=>`<option ${s===t.subject?'selected':''}>${esc(s)}</option>`).join('')}</select></div>${field('Hạn hoàn thành','due',t.due,'date',true)}<div class="field full"><label for="f-color">Màu nhận diện</label><select id="f-color" name="color">${COLORS.map((c,i)=>`<option value="${c}" ${c===t.color?'selected':''}>${['Tím khám phá','Cam ấm áp','Xanh bầu trời','Xanh lá cây','Hồng dịu dàng'][i]}</option>`).join('')}</select></div><div class="field full"><label for="f-description">Nội dung chuyên đề <span class="optional">(không bắt buộc)</span></label><textarea id="f-description" name="description" maxlength="3000" placeholder="Các con sẽ làm gì? Cần chuẩn bị những gì?…">${esc(t.description||'')}</textarea></div></div></div>${formFooter(id?'Lưu chuyên đề':'Tạo chuyên đề')}</form>`);
}
function memberOptions(q=''){
  const list=db.students.filter(s=>fold(s.name+' '+s.parent).includes(fold(q)));
  return list.length?list.map((s,i)=>`<label class="member-option"><input type="checkbox" name="member" value="${esc(s.id)}" ${selectedMembers.has(s.id)?'checked':''}>${avatar(s.name,i)}<span><strong>${esc(s.name)}</strong><small>PH: ${esc(s.parent)}</small></span><span class="check-group">${db.groups.filter(g=>g.members.includes(s.id)).length} nhóm</span></label>`).join(''):'<p class="picker-empty">Không tìm thấy tên. Thêm học sinh ở Danh sách lớp trước.</p>';
}
function renderSelected(){
  $('#selected-members').innerHTML=[...selectedMembers].map(id=>{const s=student(id);return `<button type="button" class="member-chip" data-action="remove-member" data-id="${esc(id)}" aria-label="Bỏ chọn ${esc(s?.name)}">${esc(s?.name)}${icon('close')}</button>`;}).join('');
  $('#selection-count').textContent=`Đã chọn ${selectedMembers.size} bạn`;
  const select=$('#f-hostId'),previous=select.value;
  select.innerHTML='<option value="">Nhập chủ nhà khác / chọn sau</option>'+[...selectedMembers].map(id=>{const s=student(id);return `<option value="${esc(id)}">Nhà ${esc(s?.name)} — PH: ${esc(s?.parent)}</option>`;}).join('');
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
  const conflicting=db.groups.filter(g=>g.id!==id&&!g.done&&!topic(g.topicId)?.done&&g.date===f.get('date')&&g.start<f.get('end')&&g.end>f.get('start')&&g.members.some(s=>selectedMembers.has(s)));
  const box=$('#schedule-warning');box.classList.toggle('hidden',!conflicting.length);box.textContent=conflicting.length?`Lưu ý: có bạn trùng giờ với nhóm ${conflicting.map(g=>g.name).join(', ')}. Bạn vẫn có thể lưu nếu đã sắp xếp lại.`:'';
}
function openGroupDetail(id){
  const g=group(id);if(!g)return;const t=topic(g.topicId),members=g.members.map(student).filter(Boolean),host=student(g.hostId);
  showModal(modalHeader(g.name,t?.name||'Nhóm học')+`<div class="detail-body"><div class="card-top">${subjectBadge(t)}<span class="status ${g.done||t?.done?'done':''}">${g.done||t?.done?'✓ Đã hoàn thành':dateTime(g)<new Date()?'Buổi học đã qua':'Đã lên lịch'}</span></div><div class="detail-schedule"><div class="date-tile"><span>Tháng ${dDate(g.date).getMonth()+1}</span><strong>${dDate(g.date).getDate()}</strong></div><div><h3>${esc(weekday(g.date))}, ${esc(dateLabel(g.date,{day:'numeric',month:'numeric',year:'numeric'}))}</h3><p>${esc(g.start)} – ${esc(g.end)}</p></div></div><section class="detail-section"><h3>${icon('pin')}Địa điểm & chủ nhà</h3><div class="location-box"><p class="wrap-text">${esc(g.address||'Chưa có địa chỉ. Sửa nhóm để bổ sung địa điểm.')}</p><div class="host-detail">${avatar(g.hostName||'Chủ nhà',3)}<div><strong class="wrap-text">${esc(g.hostName||'Chưa có người liên hệ')}</strong><small>${host?`Nhà ${esc(host.name)}`:esc(g.hostPhone||'Chưa có số điện thoại')}</small>${host&&g.hostPhone?`<small>${esc(g.hostPhone)}</small>`:''}</div>${contacts(g.hostPhone,g.hostName)}</div>${g.address?`<a class="btn soft" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}" target="_blank" rel="noopener noreferrer">${icon('pin')}Mở địa chỉ trên Google Maps ${icon('arrow')}</a>`:''}</div></section><section class="detail-section"><h3>${icon('users')}Thành viên nhóm <span class="subcount">(${members.length})</span></h3>${members.map((s,i)=>`<div class="detail-member">${avatar(s.name,i)}<div><strong>${esc(s.name)}</strong><small>PH: ${esc(s.parent)}</small><small>${esc(s.parentPhone||'Chưa có số điện thoại')}</small></div>${contacts(s.parentPhone,s.parent)}</div>${s.phone?`<div class="student-extra-phone">SĐT học sinh: ${esc(s.phone)} ${contacts(s.phone,s.name,true)}</div>`:''}`).join('')}</section>${g.note?`<section class="detail-section"><h3>${icon('book')}Nhắc nhau một chút</h3><p class="detail-note">${esc(g.note)}</p></section>`:''}${isDemoPhone(g.hostPhone)?'<p class="demo-note">Thông tin giả lập. Hãy thay số thật để gọi hoặc mở Zalo; địa chỉ mẫu chỉ để thử Maps.</p>':''}</div><div class="modal-footer detail-footer"><button class="btn primary" data-action="edit-group" data-id="${esc(g.id)}">${icon('edit')}Sửa nhóm học</button><button class="btn" data-action="toggle-group" data-id="${esc(g.id)}">${icon(g.done?'refresh':'check')}${g.done?'Mở lại':'Hoàn thành'}</button><button class="btn" data-action="copy-group" data-id="${esc(g.id)}" aria-label="Sao chép thông tin nhóm">${icon('copy')}</button><button class="btn danger" data-action="delete-group" data-id="${esc(g.id)}" aria-label="Xóa nhóm học">${icon('trash')}</button></div>`, 'detail',true);
}

function openSettings(){
  showModal(modalHeader('Dữ liệu & cài đặt','Giữ thông tin lớp học gọn gàng và dễ mang theo.')+`<div class="modal-body"><div class="settings-notice">Đây là bản trải nghiệm lưu trên trình duyệt hiện tại. Dữ liệu chưa đồng bộ giữa điện thoại, máy tính hoặc các phụ huynh. Xuất bản sao để chuyển sang thiết bị khác.</div><section class="settings-block"><h3>Không gian lớp học</h3><form id="class-form" class="settings-class-row"><div class="field"><label for="f-className">Tên lớp</label><input id="f-className" name="className" value="${esc(db.className)}" maxlength="80" required autocomplete="off"></div><button type="submit" class="btn primary">Lưu tên lớp</button></form></section><section class="settings-block"><h3>Sao lưu & khôi phục</h3><p>Xuất toàn bộ ${db.students.length} học sinh, ${db.topics.length} chuyên đề và ${db.groups.length} nhóm học thành tệp JSON. Nhập bản sao sẽ thay thế dữ liệu hiện tại.</p><div class="settings-actions"><button class="btn" data-action="export">${icon('download')}Xuất bản sao</button><button class="btn" data-action="import">${icon('upload')}Nhập bản sao</button><input type="file" id="import-file" accept=".json,application/json" class="hidden" aria-label="Chọn tệp sao lưu"></div></section><section class="settings-block"><h3>Dữ liệu giả lập</h3><p>20 học sinh, 20 phụ huynh, 4 chuyên đề và 6 nhóm mẫu. Số bắt đầu bằng 000 là số giả, các nút liên hệ sẽ không thực hiện cuộc gọi.</p><button class="btn danger" data-action="reset-demo">${icon('refresh')}Khôi phục dữ liệu mẫu</button></section></div><div class="modal-footer"><button class="btn" data-action="close-modal">Đóng</button></div>`,'settings');
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
  const students=db.students.filter(s=>fold(s.name+' '+s.parent+' '+s.parentPhone+' '+s.phone).includes(key)).slice(0,6),topics=db.topics.filter(t=>fold(t.name+' '+t.subject).includes(key)).slice(0,4),groups=db.groups.filter(g=>fold(g.name+' '+g.hostName).includes(key)).slice(0,4);
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
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`cung-hoc-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Đã xuất bản sao dữ liệu lớp học.');
}
async function copyGroup(id){
  const g=group(id);if(!g)return;const text=`${g.name} — ${topic(g.topicId)?.name}\n${dateLabel(g.date,{day:'numeric',month:'numeric',year:'numeric'})}, ${g.start}–${g.end}\nĐịa điểm: ${g.address||'Chưa có'}\nChủ nhà: ${g.hostName||'Chưa có'} — ${g.hostPhone||'Chưa có SĐT'}\nThành viên: ${g.members.map(id=>student(id)?.name).join(', ')}${g.note?'\nLưu ý: '+g.note:''}`;
  try{await navigator.clipboard.writeText(text);notify('Đã sao chép thông tin nhóm.');}catch{showModal(modalHeader('Sao chép thông tin nhóm')+`<div class="modal-body"><div class="field"><label for="copy-text">Chọn nội dung và sao chép</label><textarea id="copy-text" readonly rows="10">${esc(text)}</textarea></div></div><div class="modal-footer"><button class="btn" data-action="close-modal">Đóng</button></div>`,'copy');$('#copy-text').select();}
}

document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  const {action,id}=button.dataset;
  if(button.tagName==='A'&&button.getAttribute('href')==='#')e.preventDefault();
  switch(action){
    case 'new-topic':openTopicForm();break;
    case 'edit-topic':openTopicForm(id);break;
    case 'new-student':openStudentForm();break;
    case 'edit-student':openStudentForm(id);break;
    case 'new-group':openGroupForm('',id);break;
    case 'edit-group':openGroupForm(id);break;
    case 'group-detail':openGroupDetail(id);break;
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
    case 'toggle-group':{const g=group(id);g.done=!g.done;committed(g.done?'Đã đánh dấu nhóm hoàn thành.':'Đã mở lại nhóm học.');openGroupDetail(id);break;}
    case 'toggle-topic':{const t=topic(id);t.done=!t.done;committed(t.done?'Đã hoàn thành chuyên đề.':'Đã mở lại chuyên đề.');break;}
    case 'delete-group':{const g=group(id);confirmAction('Xóa nhóm học?',`Nhóm “${g.name}” và lịch hẹn của nhóm sẽ bị xóa. Các học sinh vẫn được giữ trong danh sách lớp.`,()=>{db.groups=db.groups.filter(g=>g.id!==id);closeModal(true);if(page==='groups'&&routeId){location.hash='groups';routeId='';}committed('Đã xóa nhóm học.');},()=>openGroupDetail(id),'Xóa nhóm');break;}
    case 'delete-topic':{const t=topic(id),n=countGroups(id);confirmAction('Xóa chuyên đề?',`Xóa “${t.name}” cùng ${n} nhóm và lịch hẹn trong chuyên đề này? Học sinh vẫn được giữ trong danh sách lớp.`,()=>{db.topics=db.topics.filter(t=>t.id!==id);db.groups=db.groups.filter(g=>g.topicId!==id);closeModal(true);routeId='';location.hash='topics';committed('Đã xóa chuyên đề và các nhóm liên quan.');},null,'Xóa chuyên đề');break;}
    case 'delete-student':{const s=student(id),n=db.groups.filter(g=>g.members.includes(id)).length;if(n){notify(`Học sinh đang thuộc ${n} nhóm. Hãy sửa thành viên các nhóm trước khi xóa.`);break;}confirmAction('Xóa học sinh?',`Xóa thông tin ${s.name} và phụ huynh ${s.parent} khỏi danh sách lớp?`,()=>{db.students=db.students.filter(s=>s.id!==id);closeModal(true);committed('Đã xóa học sinh.');},null,'Xóa học sinh');break;}
    case 'confirm':{const cb=confirmCallback;confirmCallback=null;cb?.();break;}
    case 'cancel-confirm':{const cb=confirmCancel;closeModal(true);confirmCancel=null;cb?.();break;}
    case 'copy-group':await copyGroup(id);break;
    case 'export':exportData();break;
    case 'import':$('#import-file').click();break;
    case 'reset-demo':confirmAction('Khôi phục dữ liệu mẫu?','Toàn bộ dữ liệu trên trình duyệt này sẽ được thay bằng bộ mẫu 20 học sinh. Hãy xuất bản sao trước nếu cần giữ dữ liệu hiện tại.',()=>{db=createDemo();closeModal(true);committed('Đã khôi phục bộ dữ liệu mẫu.');},()=>openSettings(),'Khôi phục');break;
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
  if(['f-date','f-start','f-end'].includes(target.id))checkConflict();
});
document.addEventListener('change',async e=>{
  const target=e.target;
  if(target.closest('form'))dirty=true;
  if(target.name==='member'){
    target.checked?selectedMembers.add(target.value):selectedMembers.delete(target.value);renderSelected();checkConflict();
  }
  if(target.id==='f-hostId'){
    const s=student(target.value);if(s){$('#f-hostName').value=s.parent;$('#f-hostPhone').value=s.parentPhone;}
  }
  if(target.id==='topic-filter'){topicFilter=target.value;setURLFilter();renderGroupList();}
  if(target.id==='import-file'){
    const file=target.files?.[0];if(!file)return;if(file.size>5*1024*1024){notify('Tệp quá lớn. Chọn bản sao JSON nhỏ hơn 5 MB.');target.value='';return;}
    try{const parsed=JSON.parse(await file.text());if(!validateData(parsed))throw Error();confirmAction('Nhập bản sao dữ liệu?',`Thay thế dữ liệu hiện tại bằng ${parsed.students.length} học sinh, ${parsed.topics.length} chuyên đề và ${parsed.groups.length} nhóm từ tệp này?`,()=>{db=parsed;closeModal(true);committed('Đã nhập bản sao dữ liệu.');},()=>openSettings(),'Nhập và thay thế');}catch{notify('Tệp không hợp lệ. Chọn bản sao JSON được xuất từ Cùng học.');target.value='';}
  }
});
document.addEventListener('submit',e=>{
  const form=e.target;if(!['student-form','topic-form','group-form','class-form'].includes(form.id))return;e.preventDefault();
  const f=new FormData(form),id=form.dataset.id;
  const get=k=>String(f.get(k)||'').trim();
  if(form.id==='class-form'){const name=get('className');if(!name){form.elements.className.focus();return;}db.className=name;dirty=false;committed('Đã lưu tên lớp.');return;}
  if(!requiredForm(form))return;
  if(form.id==='student-form'){
    const old=student(id),s={id:id||uid(),name:get('name'),phone:get('phone'),parent:get('parent'),parentPhone:get('parentPhone'),relation:get('relation'),note:get('note'),demo:!!old?.demo};
    if(old){db.students[db.students.indexOf(old)]=s;db.groups.forEach(g=>{if(g.hostId===s.id){if(g.hostName===old.parent)g.hostName=s.parent;if(g.hostPhone===old.parentPhone)g.hostPhone=s.parentPhone;}});}else{db.students.push(s);}
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
    const old=group(id),g={id:id||uid(),topicId:get('topicId'),name:get('name'),members:[...selectedMembers],hostId:get('hostId'),hostName:get('hostName'),hostPhone:get('hostPhone'),address:get('address'),date:get('date'),start:get('start'),end:get('end'),note:get('note'),done:old?.done||false};
    if(old)db.groups[db.groups.indexOf(old)]=g;else db.groups.push(g);closeModal(true);committed(id?'Đã cập nhật nhóm học.':'Đã tạo nhóm học và lịch hẹn.');openGroupDetail(g.id);
  }
});
modal.addEventListener('cancel',e=>{e.preventDefault();closeModal();});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dirty)openSearch();}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('hashchange',()=>{if(dirty&&modal.open){closeModal();return;}readRoute();el.focus({preventScroll:true});window.scrollTo({top:0});});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&e.newValue){try{const next=JSON.parse(e.newValue);if(validateData(next)){if(dirty){notify('Dữ liệu đã đổi ở tab khác. Xuất bản sao trước khi lưu nếu cần giữ cả hai bản.');return;}db=next;render();if(modal.open&&modalKind==='detail')closeModal(true);notify('Đã cập nhật dữ liệu từ tab khác.');}}catch{}}});
readRoute();
if(loadFailed)notify('Dữ liệu đã lưu không đọc được. Đang mở bộ mẫu; bản cũ vẫn giữ trên trình duyệt cho đến khi bạn lưu thay đổi.');
if(!hadStoredData&&!loadFailed)persist();

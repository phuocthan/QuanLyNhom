export const STORAGE_KEY = 'cung-hoc-v1';
export const DEFAULT_CLASS='Lớp 7/14';
export const DEFAULT_SCHOOL='THCS Tây Sơn - Đà Nẵng';
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
export function createDemo() {
  const names = ['Nguyễn Minh Anh','Trần Gia Bảo','Lê Ngọc Hà','Phạm Đức Huy','Hoàng Khánh Linh','Vũ Tuấn Kiệt','Đặng Phương Nhi','Bùi Quang Minh','Đỗ Bảo Ngọc','Ngô Nhật Nam','Dương Thảo Vy','Lý Hải Đăng','Mai Anh Thư','Trịnh Hoàng Phúc','Đinh Hà My','Lâm Minh Khang','Phan Tú Uyên','Võ Trung Hiếu','Hồ Mai Chi','Cao Thành Đạt'];
  const parents = ['Nguyễn Thu Hương','Trần Hoàng Long','Lê Thị Thanh','Phạm Minh Tuấn','Hoàng Ngọc Lan','Vũ Thu Trang','Đặng Văn Hùng','Bùi Thanh Mai','Đỗ Anh Dũng','Ngô Hồng Nhung','Dương Minh Tâm','Lý Thanh Hà','Mai Quốc Huy','Trịnh Thúy An','Đinh Minh Đức','Lâm Bảo Châu','Phan Anh Thái','Võ Ngọc Ánh','Hồ Thanh Phương','Cao Văn Sơn'];
  const streets=['Nguyễn Văn Cừ','Trần Hưng Đạo','Lê Văn Sỹ','Võ Thị Sáu','Điện Biên Phủ'];
  const students = names.map((name,i)=>({id:`s${i+1}`,name,address:`${12+i*4} ${streets[i%streets.length]}, TP. Hồ Chí Minh`,phone:i%4===0?`000000${String(i+1).padStart(4,'0')}`:'',parent:parents[i],parentPhone:`000000${String(i+21).padStart(4,'0')}`,relation:i%3===0?'Bố':'Mẹ',note:'',demo:true}));
  const datePlus = n => {const d = new Date();d.setDate(d.getDate()+n);return localDate(d);};
  const topics = [
    {id:'t1',name:'Khám phá hệ Mặt Trời',subject:'Khoa học tự nhiên',color:'purple',description:'Cùng tìm hiểu các hành tinh và làm mô hình hệ Mặt Trời. Chuẩn bị giấy màu, kéo và bút vẽ.',due:datePlus(7),done:false},
    {id:'t2',name:'Những câu chuyện cổ tích',subject:'Ngữ văn',color:'orange',description:'Đọc, thảo luận và kể lại một câu chuyện cổ tích mà nhóm yêu thích.',due:datePlus(10),done:false},
    {id:'t3',name:'Toán học quanh em',subject:'Toán học',color:'blue',description:'Tìm các hình học trong cuộc sống và cùng giải bài tập về diện tích.',due:datePlus(5),done:false},
    {id:'t4',name:'Our green school',subject:'Tiếng Anh',color:'green',description:'Thuyết trình bằng tiếng Anh về những cách giữ trường học xanh, sạch, đẹp.',due:datePlus(-2),done:true}
  ];
  const groups = [
    {id:'g1',topicId:'t1',name:'Những nhà du hành',members:['s1','s2','s3','s4','s5'],hostId:'s1',hostName:'Nguyễn Thu Hương',hostPhone:students[0].parentPhone,address:'12 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh',date:datePlus(0),start:'18:30',end:'20:00',note:'Các con mang theo giấy màu và bút vẽ nhé. Phụ huynh đón con lúc 20:00.',done:false},
    {id:'g2',topicId:'t2',name:'Trang sách nhỏ',members:['s3','s6','s7','s8','s9'],hostId:'s6',hostName:'Vũ Thu Trang',hostPhone:students[5].parentPhone,address:'28 Trần Hưng Đạo, Phường Cầu Ông Lãnh, TP. Hồ Chí Minh',date:datePlus(1),start:'19:00',end:'20:30',note:'Mỗi bạn chọn trước một câu chuyện để cùng chia sẻ.',done:false},
    {id:'g3',topicId:'t3',name:'Biệt đội con số',members:['s1','s10','s11','s12','s13'],hostId:'s10',hostName:'Ngô Hồng Nhung',hostPhone:students[9].parentPhone,address:'56 Lê Văn Sỹ, Phường Nhiêu Lộc, TP. Hồ Chí Minh',date:datePlus(2),start:'18:00',end:'19:30',note:'Chuẩn bị thước kẻ, giấy ô vuông và sách bài tập.',done:false},
    {id:'g4',topicId:'t1',name:'Ngôi sao nhỏ',members:['s6','s14','s15','s16','s17'],hostId:'s14',hostName:'Trịnh Thúy An',hostPhone:students[13].parentPhone,address:'84 Phan Đăng Lưu, Phường Đức Nhuận, TP. Hồ Chí Minh',date:datePlus(4),start:'09:00',end:'11:00',note:'Hoàn thiện mô hình và tập thuyết trình.',done:false},
    {id:'g5',topicId:'t4',name:'Green buddies',members:['s2','s9','s16','s18','s19'],hostId:'s18',hostName:'Võ Ngọc Ánh',hostPhone:students[17].parentPhone,address:'20 Võ Thị Sáu, Phường Tân Định, TP. Hồ Chí Minh',date:datePlus(-3),start:'18:30',end:'20:00',note:'Cùng luyện tập bài thuyết trình.',done:true},
    {id:'g6',topicId:'t4',name:'Little gardeners',members:['s4','s8','s12','s15','s20'],hostId:'s20',hostName:'Cao Văn Sơn',hostPhone:students[19].parentPhone,address:'36 Điện Biên Phủ, Phường Gia Định, TP. Hồ Chí Minh',date:datePlus(-4),start:'19:00',end:'20:30',note:'Chuẩn bị tranh vẽ về ngôi trường xanh.',done:true}
  ];
  return normalizeData({version:1,className:DEFAULT_CLASS,schoolName:DEFAULT_SCHOOL,students,topics,groups});
}
export function validDate(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T12:00:00');return !Number.isNaN(d.valueOf())&&localDate(d)===value;
}
// Keep existing v1 backups and browser records; new fields are additive.
export function normalizeData(data) {
  data.schoolName??=DEFAULT_SCHOOL;
  if(data.className==='Lớp 6A1'||data.className==='Lớp học của tôi')data.className=DEFAULT_CLASS;
  data.students.forEach(s=>{s.address??='';});
  data.groups.forEach(g=>{g.history??=[];g.sessionId??=uid();});
  return data;
}
export function parentPhoneKey(value){let phone=String(value||'').replace(/[\s().-]/g,'');if(phone.startsWith('+84'))phone='0'+phone.slice(3);else if(phone.startsWith('84')&&phone.length===11)phone='0'+phone.slice(2);return phone;}
export function studentParents(s){return [{name:s.parent||'',phone:s.parentPhone||'',relation:s.relation||'Người giám hộ'},{name:s.parent2||'',phone:s.parentPhone2||'',relation:s.relation2||'Người giám hộ'}].filter(p=>p.phone.trim());}
export function snapshotSession(g) {
  return {id:g.sessionId||uid(),date:g.date,start:g.start,end:g.end,note:g.note,done:g.done,
    ...(g.leaderId===undefined?{}:{leaderId:g.leaderId}),...(g.deputyLeaderId===undefined?{}:{deputyLeaderId:g.deputyLeaderId}),hostId:g.hostId,hostName:g.hostName,hostPhone:g.hostPhone,address:g.address,members:[...g.members]};
}
export function allSessions(data) {
  return data.groups.flatMap(g=>[
    ...(g.history||[]).map((h,i)=>({...g,...h,id:g.id,sessionId:h.id,archived:true,sessionNumber:i+1})),
    {...g,archived:false,sessionNumber:(g.history||[]).length+1}
  ]);
}
export function validateData(x) {
  if(!x || x.version!==1 || typeof x.className!=='string' || !x.className.trim() || x.className.length>80) return false;
  if(x.schoolName!==undefined&&(typeof x.schoolName!=='string'||!x.schoolName.trim()||x.schoolName.length>150))return false;
  if(!['students','topics','groups'].every(k=>Array.isArray(x[k]) && x[k].length<=5000)) return false;
  const text = (v,max=3000)=>typeof v==='string' && v.length<=max;
  const date = validDate;
  const time = v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  const unique = arr=>new Set(arr.map(v=>v.id)).size===arr.length;
  if(!['students','topics','groups'].every(k=>x[k].every(v=>v && text(v.id,100) && v.id) && unique(x[k])))return false;
  if(!x.students.every(s=>['name','phone','parent','parentPhone','relation','note'].every(k=>text(s[k])) && s.name.trim() && (s.address===undefined||text(s.address)) && ['parent2','parentPhone2','relation2'].every(k=>s[k]===undefined||text(s[k],250)) && (!s.parentPhone2||(/^0[35789]\d{8}$/.test(parentPhoneKey(s.parentPhone2))&&parentPhoneKey(s.parentPhone2)!==parentPhoneKey(s.parentPhone)))))return false;
  const deputies=x.students.map(s=>s.academicDeputy).filter(Boolean);
  if(x.students.some(s=>s.academicDeputy!==undefined&&![0,1,2].includes(s.academicDeputy))||new Set(deputies).size!==deputies.length)return false;
  if(!x.topics.every(t=>['name','subject','description'].every(k=>text(t[k])) && t.name.trim() && ['purple','orange','blue','green','pink'].includes(t.color) && date(t.due) && typeof t.done==='boolean'))return false;
  const sessionValid=s=>s&&['hostId','hostName','hostPhone','address','note'].every(k=>text(s[k]))&&Array.isArray(s.members)&&s.members.length>0&&s.members.every(id=>text(id,100))&&date(s.date)&&time(s.start)&&time(s.end)&&s.start<s.end&&typeof s.done==='boolean';
  return x.groups.every(g=>sessionValid(g)&&(g.leaderId===undefined||text(g.leaderId,100)&&(!g.leaderId||g.members.includes(g.leaderId)))&&(g.deputyLeaderId===undefined||text(g.deputyLeaderId,100)&&(!g.deputyLeaderId||!!g.leaderId&&g.deputyLeaderId!==g.leaderId&&g.members.includes(g.deputyLeaderId)))&&sessionValid(g)&&text(g.name)&&g.name.trim()&&text(g.topicId)&&x.topics.some(t=>t.id===g.topicId)&&new Set(g.members).size===g.members.length&&g.members.every(id=>x.students.some(s=>s.id===id))&&(!g.hostId||g.members.includes(g.hostId))&&(g.sessionId===undefined||(text(g.sessionId,100)&&g.sessionId))&&(g.history===undefined||(Array.isArray(g.history)&&g.history.length<=1000&&g.history.every(h=>sessionValid(h)&&text(h.id,100)&&h.id)&&unique(g.history)&&!g.history.some(h=>h.id===g.sessionId))));
}

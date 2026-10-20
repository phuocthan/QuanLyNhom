import { fold, uid } from './data.js';
export const CSV_HEADERS=['Tên HS','Tên PH','Địa chỉ','SĐT HS','SĐT PH'];
const aliases=[['tenhs','tenhocsinh','hotenhocsinh'],['tenph','tenphuhuynh','hotenphuhuynh'],['diachi','diachinha'],['sdths','sodienthoaihs','sodienthoaihocsinh'],['sdtph','sodienthoaiph','sodienthoaiphuhuynh']];
const headerKey=s=>fold(s).replace(/[^a-z0-9]/g,'');
export const studentKey=s=>fold(s.name.trim().replace(/\s+/g,' ')+'|'+s.parent.trim().replace(/\s+/g,' '));
export const validPhone=s=>!s||/^(?:\+?\d[\d\s().-]{7,18}\d)$/.test(s);

export function parseStudentsCSV(input) {
  const text=String(input).replace(/^\uFEFF/,'');
  const first=text.split(/\r?\n/)[0];
  const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],cell='',quoted=false,afterQuote=false;
  const pushRow=()=>{row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';afterQuote=false;};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=c;continue;}
    if(c==='"'){if(cell.trim()||afterQuote)throw Error('Dấu ngoặc kép không hợp lệ trong CSV.');quoted=true;cell='';}
    else if(c===delimiter){row.push(cell);cell='';afterQuote=false;}
    else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;pushRow();}
    else if(afterQuote&&!/\s/.test(c))throw Error('Có ký tự sau dấu ngoặc kép đóng.');
    else if(!afterQuote)cell+=c;
  }
  if(quoted)throw Error('Có ô chưa đóng dấu ngoặc kép.');
  if(cell||row.length)pushRow();
  if(rows.length<2)throw Error('CSV cần có tiêu đề và ít nhất một học sinh.');
  if(rows.length>5001)throw Error('Mỗi lần nhập tối đa 5.000 học sinh.');
  const headers=rows.shift().map(headerKey),indices=aliases.map(a=>headers.findIndex(h=>a.includes(h)));
  if(indices.some(i=>i<0))throw Error('CSV cần đủ 5 cột: Tên HS, Tên PH, Địa chỉ, SĐT HS, SĐT PH.');
  if(new Set(headers).size!==headers.length)throw Error('CSV có cột tiêu đề trùng nhau.');
  const seen=new Set();
  return rows.map((r,i)=>{
    if(r.length!==headers.length)throw Error(`Dòng dữ liệu ${i+2}: số cột không khớp với tiêu đề. Địa chỉ chứa dấu phẩy phải đặt trong ngoặc kép.`);
    const [name,parent,address,phone,parentPhone]=indices.map(n=>(r[n]||'').trim());
    if(!name||!parent)throw Error(`Dòng dữ liệu ${i+2}: cần tên học sinh và tên phụ huynh.`);
    if([name,parent].some(v=>v.length>250)||address.length>3000)throw Error(`Dòng dữ liệu ${i+2}: tên hoặc địa chỉ quá dài.`);
    if(!validPhone(phone)||!validPhone(parentPhone))throw Error(`Dòng dữ liệu ${i+2}: số điện thoại không hợp lệ. Giữ số điện thoại ở dạng văn bản, gồm cả số 0 đầu.`);
    const s={id:uid(),name,parent,address,phone,parentPhone,relation:'Người giám hộ',note:'',demo:/^000/.test(phone)||/^000/.test(parentPhone)};
    const key=studentKey(s);if(seen.has(key))throw Error(`Dòng dữ liệu ${i+2}: trùng học sinh và phụ huynh trong cùng tệp.`);seen.add(key);return s;
  });
}

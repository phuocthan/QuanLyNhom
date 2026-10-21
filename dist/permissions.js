import {studentParents,parentPhoneKey} from './data.js';

export const linkedToStudent=(student,user)=>!!(student&&user?.phone&&studentParents(student).some(p=>parentPhoneKey(p.phone)===parentPhoneKey(user.phone)));
export const isAcademicDeputy=(data,user)=>data.students.some(s=>[1,2].includes(s.academicDeputy)&&linkedToStudent(s,user));
export const canCreateLearning=(data,user)=>user?.role==='owner'||isAcademicDeputy(data,user);
export const canManageGroup=(data,user,group)=>!!group&&(user?.role==='owner'||data.students.some(s=>[group.leaderId,group.deputyLeaderId].includes(s.id)&&linkedToStudent(s,user)));
export const canTransferGroup=(data,user,group)=>!!group&&(canCreateLearning(data,user)||canManageGroup(data,user,group));
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
export const sameRecord=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));

// Always authorize against the stored class, never against submitted roles.
export function learningWriteError(current,next,user){
  if(user.role==='owner')return '';
  if(sameRecord(current,next)&&!canCreateLearning(current,user)&&!current.groups.some(g=>canManageGroup(current,user,g)))return 'Tài khoản này chỉ có quyền xem hoạt động học.';
  const {students:oldStudents,topics:oldTopics,groups:oldGroups,...oldMeta}=current;
  const {students,topics,groups,...meta}=next;
  if(!sameRecord(oldMeta,meta)||!sameRecord(oldStudents,students))return 'Chỉ admin được quản lý lớp, danh sách học sinh và tag lớp phó.';
  const deputy=isAcademicDeputy(current,user);
  const topicsById=new Map(oldTopics.map(t=>[t.id,t]));
  if(oldTopics.some(t=>!topics.some(n=>n.id===t.id)))return 'Chỉ admin được xóa chuyên đề.';
  if(topics.some(t=>!sameRecord(topicsById.get(t.id),t)&&!deputy))return 'Chỉ lớp phó học tập được tạo hoặc sửa chuyên đề.';
  const groupsById=new Map(oldGroups.map(g=>[g.id,g]));
  for(const old of oldGroups)if(!groups.some(g=>g.id===old.id)&&!canManageGroup(current,user,old))return 'Chỉ trưởng nhóm hoặc phó nhóm được thay đổi nhóm này.';
  for(const group of groups){
    const old=groupsById.get(group.id);
    if(!old){if(!deputy)return 'Chỉ lớp phó học tập được tạo nhóm.';if(!group.leaderId)return 'Cần chọn trưởng nhóm.';continue;}
    if(sameRecord(old,group))continue;
    if(canManageGroup(current,user,old))continue;
    const {leaderId:oldLeader,deputyLeaderId:oldDeputy,...oldRest}=old;
    const {leaderId,deputyLeaderId,...rest}=group;
    if(canTransferGroup(current,user,old)&&sameRecord(oldRest,rest))continue;
    return 'Chỉ trưởng nhóm hoặc phó nhóm được thay đổi nhóm này.';
  }
  return '';
}

import { randomUUID } from 'node:crypto';
import { normalizePhone } from './auth.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { normalizeData, validateData, snapshotSession, DEFAULT_CLASS, DEFAULT_SCHOOL } from '../dist/data.js';

export const emptyClassroom=()=>({version:1,className:DEFAULT_CLASS,schoolName:DEFAULT_SCHOOL,students:[],topics:[],groups:[]});

export function openDatabase(filename) {
  if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
  const db=new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS classroom(id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS students(id TEXT PRIMARY KEY, position INTEGER NOT NULL, record TEXT NOT NULL CHECK(json_valid(record)));
    CREATE TABLE IF NOT EXISTS topics(id TEXT PRIMARY KEY, position INTEGER NOT NULL, record TEXT NOT NULL CHECK(json_valid(record)));
    CREATE TABLE IF NOT EXISTS study_groups(id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id), position INTEGER NOT NULL, name TEXT NOT NULL, current_session_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS group_members(group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE, student_id TEXT NOT NULL REFERENCES students(id), position INTEGER NOT NULL, PRIMARY KEY(group_id,student_id));
    CREATE TABLE IF NOT EXISTS study_sessions(id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE, position INTEGER NOT NULL, is_current INTEGER NOT NULL CHECK(is_current IN (0,1)), record TEXT NOT NULL CHECK(json_valid(record)), UNIQUE(group_id,position));
    CREATE UNIQUE INDEX IF NOT EXISTS current_session_per_group ON study_sessions(group_id) WHERE is_current=1;
    CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY, user_id TEXT, revision INTEGER NOT NULL, created_at TEXT NOT NULL);
    INSERT OR IGNORE INTO schema_migrations VALUES(1,datetime('now'));
    INSERT OR IGNORE INTO classroom(id,name,revision,updated_at) VALUES(1,'Lớp học của tôi',0,datetime('now'));
  `);
  if(!db.prepare('SELECT version FROM schema_migrations WHERE version=2').get()){
    db.exec('BEGIN IMMEDIATE');
    try{
      db.exec("ALTER TABLE classroom ADD COLUMN school_name TEXT NOT NULL DEFAULT 'THCS Tây Sơn - Đà Nẵng';");
      db.prepare('UPDATE classroom SET name=? WHERE name IN (?,?)').run(DEFAULT_CLASS,'Lớp học của tôi','Lớp 6A1');
      db.prepare("INSERT INTO schema_migrations VALUES(2,datetime('now'))").run();db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
  }
  if(!db.prepare('SELECT version FROM schema_migrations WHERE version=3').get()){
    db.exec('BEGIN IMMEDIATE');
    try{
      db.exec(`ALTER TABLE users ADD COLUMN phone TEXT;
        ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
        CREATE UNIQUE INDEX users_phone ON users(phone) WHERE phone IS NOT NULL;
        CREATE TABLE class_spaces(id TEXT PRIMARY KEY, state TEXT CHECK(state IS NULL OR json_valid(state)), revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
        INSERT INTO class_spaces VALUES('default',NULL,0,datetime('now'));
        CREATE TABLE class_access(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, class_id TEXT NOT NULL REFERENCES class_spaces(id), PRIMARY KEY(user_id,class_id));
        INSERT INTO class_access SELECT id,'default' FROM users WHERE role!='owner';
        INSERT INTO schema_migrations VALUES(3,datetime('now'));`);
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
  }
  if(!db.prepare('SELECT version FROM schema_migrations WHERE version=4').get()){
    db.exec('BEGIN IMMEDIATE');
    try{
      db.exec(`ALTER TABLE users ADD COLUMN student_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE users ADD COLUMN parent_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE users ADD COLUMN relationship TEXT NOT NULL DEFAULT '';
        UPDATE users SET parent_name=name WHERE role!='owner';
        INSERT INTO schema_migrations VALUES(4,datetime('now'));`);
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
  }
  if(!db.prepare('SELECT version FROM schema_migrations WHERE version=5').get()){
    db.exec('BEGIN IMMEDIATE');
    try{
      // Earlier bulk accounts can contain several names; their students already exist.
      const accounts=db.prepare("SELECT u.*,a.class_id FROM users u JOIN class_access a ON a.user_id=u.id WHERE u.role!='owner' AND u.student_name!='' AND length(u.student_name)<=100 AND instr(u.student_name,',')=0").all();
      for(const account of accounts)syncAccountStudent(db,{studentName:account.student_name,parentName:account.parent_name,relationship:account.relationship,phone:account.phone},account.class_id,account.id);
      db.exec("INSERT INTO schema_migrations VALUES(5,datetime('now')); COMMIT");
    }catch(error){db.exec('ROLLBACK');db.close();throw error;}
  }
  return db;
}

export function loadState(db,classId='default') {
  if(classId!=='default'){
    const row=db.prepare('SELECT * FROM class_spaces WHERE id=?').get(classId);
    return row?{data:JSON.parse(row.state),revision:row.revision,updatedAt:row.updated_at}:null;
  }
  const meta=db.prepare('SELECT name,school_name,revision,updated_at FROM classroom WHERE id=1').get();
  const students=db.prepare('SELECT record FROM students ORDER BY position').all().map(r=>JSON.parse(r.record));
  const topics=db.prepare('SELECT record FROM topics ORDER BY position').all().map(r=>JSON.parse(r.record));
  const sessionRows=db.prepare('SELECT group_id,is_current,record FROM study_sessions ORDER BY position').all();
  const memberRows=db.prepare('SELECT group_id,student_id FROM group_members ORDER BY position').all();
  const groups=db.prepare('SELECT * FROM study_groups ORDER BY position').all().map(g=>{
    const sessions=sessionRows.filter(s=>s.group_id===g.id);
    const current=JSON.parse(sessions.find(s=>s.is_current===1).record);
    const {id:sessionId,...session}=current;
    return {id:g.id,topicId:g.topic_id,name:g.name,...session,sessionId,members:memberRows.filter(m=>m.group_id===g.id).map(m=>m.student_id),history:sessions.filter(s=>!s.is_current).map(s=>JSON.parse(s.record))};
  });
  return {data:{version:1,className:meta.name,schoolName:meta.school_name,students,topics,groups},revision:meta.revision,updatedAt:meta.updated_at};
}

export function saveState(db,input,revision,userId,classId='default') {
  if(!Number.isSafeInteger(revision)||revision<0||!validateData(input))return {error:'invalid',status:400};
  const data=normalizeData(structuredClone(input));
  const ids=data.groups.flatMap(g=>[g.sessionId,...g.history.map(h=>h.id)]);
  if(new Set(ids).size!==ids.length)return {error:'invalid',status:400};
  if(classId!=='default'){
    db.exec('SAVEPOINT save_class_state');
    try{
      const row=db.prepare('SELECT revision FROM class_spaces WHERE id=?').get(classId);
      if(!row){db.exec('ROLLBACK TO save_class_state; RELEASE save_class_state');return {error:'invalid',status:404};}
      if(row.revision!==revision){db.exec('ROLLBACK TO save_class_state; RELEASE save_class_state');return {error:'conflict',status:409,revision:row.revision};}
      const updatedAt=new Date().toISOString(),next=revision+1;
      db.prepare('UPDATE class_spaces SET state=?,revision=?,updated_at=? WHERE id=?').run(JSON.stringify(data),next,updatedAt,classId);
      db.prepare('INSERT INTO audit_log(user_id,revision,created_at) VALUES(?,?,?)').run(userId,next,updatedAt);
      db.exec('RELEASE save_class_state');return {revision:next,updatedAt};
    }catch(error){db.exec('ROLLBACK TO save_class_state; RELEASE save_class_state');throw error;}
  }
  db.exec('SAVEPOINT save_class_state');
  try{
    const current=db.prepare('SELECT revision FROM classroom WHERE id=1').get().revision;
    if(current!==revision){db.exec('ROLLBACK TO save_class_state; RELEASE save_class_state');return {error:'conflict',status:409,revision:current};}
    db.exec('DELETE FROM group_members; DELETE FROM study_sessions; DELETE FROM study_groups; DELETE FROM topics; DELETE FROM students;');
    const insertStudent=db.prepare('INSERT INTO students(id,position,record) VALUES(?,?,?)');
    data.students.forEach((s,i)=>insertStudent.run(s.id,i,JSON.stringify(s)));
    const insertTopic=db.prepare('INSERT INTO topics(id,position,record) VALUES(?,?,?)');
    data.topics.forEach((t,i)=>insertTopic.run(t.id,i,JSON.stringify(t)));
    const insertGroup=db.prepare('INSERT INTO study_groups VALUES(?,?,?,?,?)');
    const insertMember=db.prepare('INSERT INTO group_members VALUES(?,?,?)');
    const insertSession=db.prepare('INSERT INTO study_sessions VALUES(?,?,?,?,?)');
    data.groups.forEach((g,i)=>{
      insertGroup.run(g.id,g.topicId,i,g.name,g.sessionId);
      g.members.forEach((id,position)=>insertMember.run(g.id,id,position));
      g.history.forEach((h,position)=>insertSession.run(h.id,g.id,position,0,JSON.stringify(h)));
      insertSession.run(g.sessionId,g.id,g.history.length,1,JSON.stringify(snapshotSession(g)));
    });
    const updatedAt=new Date().toISOString(),next=current+1;
    db.prepare('UPDATE classroom SET name=?,school_name=?,revision=?,updated_at=? WHERE id=1').run(data.className,data.schoolName,next,updatedAt);
    db.prepare('INSERT INTO audit_log(user_id,revision,created_at) VALUES(?,?,?)').run(userId,next,updatedAt);
    db.exec('RELEASE save_class_state');return {revision:next,updatedAt};
  }catch(error){db.exec('ROLLBACK TO save_class_state; RELEASE save_class_state');throw error;}
}

// Called inside the account transaction so both records succeed or roll back together.
export function syncAccountStudent(db,profile,classId,userId){
  const state=loadState(db,classId);
  if(!state)throw Error('Class not found');
  const key=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const candidates=state.data.students.filter(s=>key(s.name)===key(profile.studentName));
  let student=candidates.find(s=>normalizePhone(s.parentPhone)===profile.phone);
  if(!student){
    const incomplete=candidates.filter(s=>!s.parentPhone?.trim()&&(!s.parent?.trim()||!profile.parentName||key(s.parent)===key(profile.parentName)));
    if(incomplete.length===1)student=incomplete[0];
  }
  const added=!student;
  if(!student){student={id:randomUUID(),name:profile.studentName,phone:'',parent:'',parentPhone:profile.phone,relation:'',address:'',note:'',demo:false};state.data.students.push(student);}
  const before=JSON.stringify(student);
  student.parentPhone=profile.phone;
  if(profile.parentName)student.parent=profile.parentName;
  if(profile.relationship)student.relation=profile.relationship;
  if(profile.address)student.address=profile.address;
  student.demo=false;
  if(added||JSON.stringify(student)!==before){
    const result=saveState(db,state.data,state.revision,userId,classId);
    if(result.error)throw Error('Cannot save account student: '+result.error);
  }
  return {studentId:student.id,added};
}

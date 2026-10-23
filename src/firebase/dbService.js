import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';
import {
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_SETTINGS,
  generateSeedAttendance
} from './mockData';

const STORAGE_KEYS = {
  CLASSES: 'cas_classes',
  SUBJECTS: 'cas_subjects',
  TEACHERS: 'cas_teachers',
  STUDENTS: 'cas_students',
  SESSIONS: 'cas_sessions',
  RECORDS: 'cas_records',
  SETTINGS: 'cas_settings'
};

const { sessions: INITIAL_SESSIONS, records: INITIAL_RECORDS } = generateSeedAttendance();
const localDefaults = {
  [STORAGE_KEYS.CLASSES]: INITIAL_CLASSES,
  [STORAGE_KEYS.SUBJECTS]: INITIAL_SUBJECTS,
  [STORAGE_KEYS.TEACHERS]: INITIAL_TEACHERS,
  [STORAGE_KEYS.STUDENTS]: INITIAL_STUDENTS,
  [STORAGE_KEYS.SESSIONS]: INITIAL_SESSIONS,
  [STORAGE_KEYS.RECORDS]: INITIAL_RECORDS,
  [STORAGE_KEYS.SETTINGS]: INITIAL_SETTINGS
};

function getLocal(key) {
  const raw = localStorage.getItem(key);
  return raw === null
    ? JSON.parse(JSON.stringify(localDefaults[key] ?? []))
    : JSON.parse(raw);
}

function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function getIdentity() {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) {
    throw new Error('A signed-in Firebase account is required for this operation.');
  }

  const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (!snapshot.exists()) {
    throw new Error('Your account profile is not provisioned. Contact an administrator.');
  }

  const profile = snapshot.data();
  if (!['admin', 'teacher', 'student'].includes(profile.role)) {
    throw new Error('Your account does not have a valid assigned role.');
  }
  return { uid: auth.currentUser.uid, ...profile };
}

function requireRole(profile, roles) {
  if (!roles.includes(profile.role)) {
    throw new Error('Your account is not authorized to perform this operation.');
  }
}

function toItems(snapshot) {
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

async function getDocumentsByIds(collectionName, ids) {
  const snapshots = await Promise.all(
    [...new Set(ids)].filter(Boolean).map(id => getDoc(doc(db, collectionName, id)))
  );
  return snapshots
    .filter(snapshot => snapshot.exists())
    .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
}

async function getTeacherRecord(profile) {
  if (!profile.teacherId) return null;
  const teachers = await getDocumentsByIds('teachers', [profile.teacherId]);
  return teachers[0] || null;
}

async function queryByAllowedIds(collectionName, field, ids, constraints = []) {
  const results = [];
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  for (let start = 0; start < uniqueIds.length; start += 30) {
    const allowedIds = uniqueIds.slice(start, start + 30);
    const snapshot = await getDocs(query(
      collection(db, collectionName),
      where(field, 'in', allowedIds),
      ...constraints
    ));
    results.push(...toItems(snapshot));
  }
  return results;
}

function addFilters(constraints, filters, fields) {
  fields.forEach(field => {
    if (filters[field]) constraints.push(where(field, '==', filters[field]));
  });
  return constraints;
}

async function fetchCollection(collectionName) {
  return toItems(await getDocs(collection(db, collectionName)));
}

function localCollection(key, filters = {}) {
  return getLocal(key).filter(item => Object.entries(filters)
    .every(([field, value]) => !value || item[field] === value));
}

function timestamp() {
  return new Date().toISOString();
}

export async function getClasses(filterClassId = null) {
  if (!isFirebaseConfigured) return localCollection(STORAGE_KEYS.CLASSES);
  const profile = await getIdentity();
  if (profile.role === 'admin') {
    return filterClassId
      ? getDocumentsByIds('classes', [filterClassId])
      : fetchCollection('classes');
  }

  const teacher = profile.role === 'teacher' ? await getTeacherRecord(profile) : null;
  const allowed = profile.role === 'teacher'
    ? teacher?.assignedClasses || []
    : [profile.classId || (await getStudentProfile(profile))?.classId];
  if (filterClassId && !allowed.includes(filterClassId)) return [];
  return getDocumentsByIds('classes', filterClassId ? [filterClassId] : allowed);
}

async function getStudentProfile(profile) {
  if (!profile.studentId) return null;
  const snapshot = await getDoc(doc(db, 'students', profile.studentId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function addClass(classData) {
  const item = { ...classData, id: classData.id || `cls-${Date.now()}`, createdAt: timestamp() };
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await setDoc(doc(db, 'classes', item.id), item);
  } else {
    setLocal(STORAGE_KEYS.CLASSES, [item, ...getLocal(STORAGE_KEYS.CLASSES)]);
  }
  return item;
}

export async function updateClass(id, updates) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await updateDoc(doc(db, 'classes', id), updates);
    return { id, ...updates };
  }
  const items = getLocal(STORAGE_KEYS.CLASSES);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setLocal(STORAGE_KEYS.CLASSES, items);
  return items[index];
}

export async function deleteClass(id) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await deleteDoc(doc(db, 'classes', id));
  } else {
    setLocal(STORAGE_KEYS.CLASSES, getLocal(STORAGE_KEYS.CLASSES).filter(item => item.id !== id));
  }
  return true;
}

export async function getSubjects() {
  if (!isFirebaseConfigured) return localCollection(STORAGE_KEYS.SUBJECTS);
  const profile = await getIdentity();
  if (profile.role === 'admin') return fetchCollection('subjects');
  if (profile.role === 'teacher') {
    const teacher = await getTeacherRecord(profile);
    return getDocumentsByIds('subjects', teacher?.assignedSubjects || []);
  }

  const student = await getStudentProfile(profile);
  if (!student?.classId) return [];
  return toItems(await getDocs(query(
    collection(db, 'subjects'),
    where('classId', '==', student.classId)
  )));
}

export async function addSubject(subjectData) {
  const item = { ...subjectData, id: subjectData.id || `sub-${Date.now()}`, createdAt: timestamp() };
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await setDoc(doc(db, 'subjects', item.id), item);
  } else {
    setLocal(STORAGE_KEYS.SUBJECTS, [item, ...getLocal(STORAGE_KEYS.SUBJECTS)]);
  }
  return item;
}

export async function updateSubject(id, updates) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await updateDoc(doc(db, 'subjects', id), updates);
    return { id, ...updates };
  }
  const items = getLocal(STORAGE_KEYS.SUBJECTS);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setLocal(STORAGE_KEYS.SUBJECTS, items);
  return items[index];
}

export async function deleteSubject(id) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await deleteDoc(doc(db, 'subjects', id));
  } else {
    setLocal(STORAGE_KEYS.SUBJECTS, getLocal(STORAGE_KEYS.SUBJECTS).filter(item => item.id !== id));
  }
  return true;
}

export async function getTeachers() {
  if (!isFirebaseConfigured) return localCollection(STORAGE_KEYS.TEACHERS);
  const profile = await getIdentity();
  if (profile.role === 'admin') return fetchCollection('teachers');
  if (profile.role === 'teacher' && profile.teacherId) {
    return getDocumentsByIds('teachers', [profile.teacherId]);
  }
  return [];
}

export async function addTeacher(teacherData) {
  const item = { ...teacherData, id: teacherData.id || `tch-${Date.now()}`, createdAt: timestamp() };
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await setDoc(doc(db, 'teachers', item.id), item);
  } else {
    setLocal(STORAGE_KEYS.TEACHERS, [item, ...getLocal(STORAGE_KEYS.TEACHERS)]);
  }
  return item;
}

export async function updateTeacher(id, updates) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await updateDoc(doc(db, 'teachers', id), updates);
    return { id, ...updates };
  }
  const items = getLocal(STORAGE_KEYS.TEACHERS);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setLocal(STORAGE_KEYS.TEACHERS, items);
  return items[index];
}

export async function deleteTeacher(id) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await deleteDoc(doc(db, 'teachers', id));
  } else {
    setLocal(STORAGE_KEYS.TEACHERS, getLocal(STORAGE_KEYS.TEACHERS).filter(item => item.id !== id));
  }
  return true;
}

export async function getStudents(filterClassId = null) {
  if (!isFirebaseConfigured) {
    return localCollection(STORAGE_KEYS.STUDENTS, filterClassId ? { classId: filterClassId } : {});
  }
  const profile = await getIdentity();
  if (profile.role === 'admin') {
    if (!filterClassId) return fetchCollection('students');
    return toItems(await getDocs(query(
      collection(db, 'students'),
      where('classId', '==', filterClassId)
    )));
  }
  if (profile.role === 'student') {
    const student = await getStudentProfile(profile);
    return student ? [student] : [];
  }

  const teacher = await getTeacherRecord(profile);
  const allowedClasses = teacher?.assignedClasses || [];
  if (filterClassId && !allowedClasses.includes(filterClassId)) return [];
  const students = await queryByAllowedIds(
    'students',
    'classId',
    filterClassId ? [filterClassId] : allowedClasses
  );
  return filterClassId ? students.filter(item => item.classId === filterClassId) : students;
}

export async function addStudent(studentData) {
  const item = { ...studentData, id: studentData.id || `stu-${Date.now()}`, createdAt: timestamp() };
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await setDoc(doc(db, 'students', item.id), item);
  } else {
    setLocal(STORAGE_KEYS.STUDENTS, [item, ...getLocal(STORAGE_KEYS.STUDENTS)]);
  }
  return item;
}

export async function updateStudent(id, updates) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await updateDoc(doc(db, 'students', id), updates);
    return { id, ...updates };
  }
  const items = getLocal(STORAGE_KEYS.STUDENTS);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setLocal(STORAGE_KEYS.STUDENTS, items);
  return items[index];
}

export async function deleteStudent(id) {
  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin']);
    await deleteDoc(doc(db, 'students', id));
  } else {
    setLocal(STORAGE_KEYS.STUDENTS, getLocal(STORAGE_KEYS.STUDENTS).filter(item => item.id !== id));
  }
  return true;
}

export async function checkDuplicateSession(classId, subjectId, date) {
  const sessions = await getAttendanceSessions({ classId, subjectId, date });
  return sessions[0] || null;
}

export async function getAttendanceSessions(filters = {}) {
  if (!isFirebaseConfigured) {
    return localCollection(STORAGE_KEYS.SESSIONS, filters)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  const profile = await getIdentity();
  const constraints = [];
  if (profile.role === 'teacher') {
    const teacher = await getTeacherRecord(profile);
    const allowedClasses = teacher?.assignedClasses || [];
    if (filters.classId && !allowedClasses.includes(filters.classId)) return [];
    if (filters.teacherId && filters.teacherId !== profile.teacherId) return [];
    if (!allowedClasses.length) return [];
    addFilters(constraints, filters, ['subjectId', 'date']);
    if (filters.teacherId) constraints.push(where('teacherId', '==', filters.teacherId));
    let sessions = await queryByAllowedIds('attendanceSessions', 'classId', allowedClasses, constraints);
    if (filters.classId) sessions = sessions.filter(session => session.classId === filters.classId);
    return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  addFilters(constraints, filters, ['classId', 'subjectId', 'date']);
  if (profile.role === 'student') {
    const student = await getStudentProfile(profile);
    if (!student?.classId || (filters.classId && filters.classId !== student.classId)) return [];
    const records = await getAttendanceRecords({
      sessionId: filters.sessionId,
      classId: student.classId,
      subjectId: filters.subjectId,
      date: filters.date
    });
    return records.map(record => ({
      id: record.sessionId,
      classId: record.classId,
      className: record.className,
      subjectId: record.subjectId,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      teacherId: record.teacherId,
      teacherName: record.teacherName,
      date: record.date,
      totalCount: 1,
      presentCount: record.status === 'Present' ? 1 : 0,
      absentCount: record.status === 'Absent' ? 1 : 0,
      lateCount: record.status === 'Late' ? 1 : 0
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  if (filters.teacherId) constraints.push(where('teacherId', '==', filters.teacherId));
  const snapshot = await getDocs(query(collection(db, 'attendanceSessions'), ...constraints));
  return toItems(snapshot).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getAttendanceSessionById(id) {
  if (!isFirebaseConfigured) {
    return getLocal(STORAGE_KEYS.SESSIONS).find(item => item.id === id) || null;
  }
  const profile = await getIdentity();
  if (profile.role === 'student') {
    const record = (await getAttendanceRecords({ sessionId: id }))[0];
    if (!record) return null;
    return {
      id: record.sessionId,
      classId: record.classId,
      className: record.className,
      subjectId: record.subjectId,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      teacherId: record.teacherId,
      teacherName: record.teacherName,
      date: record.date,
      totalCount: 1,
      presentCount: record.status === 'Present' ? 1 : 0,
      absentCount: record.status === 'Absent' ? 1 : 0,
      lateCount: record.status === 'Late' ? 1 : 0
    };
  }
  const snapshot = await getDoc(doc(db, 'attendanceSessions', id));
  if (!snapshot.exists()) return null;
  const session = { id: snapshot.id, ...snapshot.data() };
  if (profile.role === 'teacher') {
    const teacher = await getTeacherRecord(profile);
    if (session.teacherId !== profile.teacherId
      || !(teacher?.assignedClasses || []).includes(session.classId)) return null;
  }
  return session;
}

export async function getAttendanceRecords(filters = {}) {
  if (!isFirebaseConfigured) {
    return localCollection(STORAGE_KEYS.RECORDS, filters);
  }
  const profile = await getIdentity();
  const constraints = [];
  if (profile.role === 'student') {
    const student = await getStudentProfile(profile);
    if (!student) return [];
    if (filters.studentId && filters.studentId !== student.id) return [];
    if (filters.classId && filters.classId !== student.classId) return [];
    addFilters(constraints, filters, ['sessionId', 'classId', 'subjectId', 'date']);
    constraints.push(where('studentId', '==', student.id));
    return toItems(await getDocs(query(collection(db, 'attendanceRecords'), ...constraints)));
  }
  if (profile.role === 'teacher') {
    const teacher = await getTeacherRecord(profile);
    const allowedClasses = teacher?.assignedClasses || [];
    if (filters.classId && !allowedClasses.includes(filters.classId)) return [];
    if (filters.teacherId && filters.teacherId !== profile.teacherId) return [];
    if (!allowedClasses.length) return [];
    addFilters(constraints, filters, ['sessionId', 'subjectId', 'date']);
    constraints.push(where('teacherId', '==', profile.teacherId));
    const records = await queryByAllowedIds('attendanceRecords', 'classId', allowedClasses, constraints);
    return filters.classId ? records.filter(record => record.classId === filters.classId) : records;
  }
  addFilters(constraints, filters, ['sessionId', 'studentId', 'classId', 'subjectId', 'date']);
  if (filters.teacherId) constraints.push(where('teacherId', '==', filters.teacherId));
  return toItems(await getDocs(query(collection(db, 'attendanceRecords'), ...constraints)));
}

export async function saveAttendanceSession(sessionData, records) {
  const sessionId = sessionData.id || `ses-${Date.now()}`;
  const now = timestamp();
  let present = 0;
  let absent = 0;
  let late = 0;
  const formattedRecords = records.map(record => {
    if (record.status === 'Present') present++;
    else if (record.status === 'Absent') absent++;
    else if (record.status === 'Late') late++;
    return {
      ...record,
      id: record.id || `rec-${sessionId}-${record.studentId}`,
      sessionId,
      classId: sessionData.classId,
      className: sessionData.className,
      subjectId: sessionData.subjectId,
      subjectCode: sessionData.subjectCode,
      subjectName: sessionData.subjectName,
      date: sessionData.date,
      teacherId: sessionData.teacherId,
      teacherName: sessionData.teacherName,
      updatedAt: now
    };
  });
  const session = {
    ...sessionData,
    id: sessionId,
    totalCount: records.length,
    presentCount: present,
    absentCount: absent,
    lateCount: late,
    updatedAt: now,
    createdAt: sessionData.createdAt || now
  };

  if (isFirebaseConfigured) {
    const profile = await getIdentity();
    requireRole(profile, ['admin', 'teacher']);
    if (profile.role === 'teacher' && session.teacherId !== profile.teacherId) {
      throw new Error('Attendance can only be saved for the signed-in teacher.');
    }
    const batch = writeBatch(db);
    batch.set(doc(db, 'attendanceSessions', sessionId), session);
    formattedRecords.forEach(record => {
      batch.set(doc(db, 'attendanceRecords', record.id), record);
    });
    await batch.commit();
  } else {
    const allSessions = getLocal(STORAGE_KEYS.SESSIONS);
    const index = allSessions.findIndex(item => item.id === sessionId);
    if (index === -1) allSessions.unshift(session);
    else allSessions[index] = session;
    setLocal(STORAGE_KEYS.SESSIONS, allSessions);
    const allRecords = getLocal(STORAGE_KEYS.RECORDS).filter(item => item.sessionId !== sessionId);
    setLocal(STORAGE_KEYS.RECORDS, [...allRecords, ...formattedRecords]);
  }

  return { session, records: formattedRecords };
}

export async function deleteAttendanceSession(sessionId) {
  if (!isFirebaseConfigured) {
    setLocal(STORAGE_KEYS.SESSIONS, getLocal(STORAGE_KEYS.SESSIONS).filter(item => item.id !== sessionId));
    setLocal(STORAGE_KEYS.RECORDS, getLocal(STORAGE_KEYS.RECORDS).filter(item => item.sessionId !== sessionId));
    return true;
  }
  const profile = await getIdentity();
  requireRole(profile, ['admin']);
  const snapshot = await getDocs(query(
    collection(db, 'attendanceRecords'),
    where('sessionId', '==', sessionId)
  ));
  const records = snapshot.docs;
  for (let start = 0; start < records.length; start += 450) {
    const batch = writeBatch(db);
    records.slice(start, start + 450).forEach(record => batch.delete(record.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, 'attendanceSessions', sessionId));
  return true;
}

export async function getSettings() {
  if (!isFirebaseConfigured) {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw === null ? INITIAL_SETTINGS : JSON.parse(raw);
  }
  await getIdentity();
  const snapshot = await getDoc(doc(db, 'settings', 'academic'));
  return snapshot.exists() ? snapshot.data() : INITIAL_SETTINGS;
}

export async function updateSettings(newSettings) {
  if (!isFirebaseConfigured) {
    setLocal(STORAGE_KEYS.SETTINGS, newSettings);
    return newSettings;
  }
  const profile = await getIdentity();
  requireRole(profile, ['admin']);
  await setDoc(doc(db, 'settings', 'academic'), newSettings, { merge: true });
  return newSettings;
}

export async function getAdminStats() {
  const [students, teachers, classes, subjects, sessions, records, settings] = await Promise.all([
    getStudents(),
    getTeachers(),
    getClasses(),
    getSubjects(),
    getAttendanceSessions(),
    getAttendanceRecords(),
    getSettings()
  ]);
  const lateWeight = settings?.lateAttendanceWeight ?? 0.5;
  let attended = 0;
  records.forEach(record => {
    if (record.status === 'Present') attended += 1;
    else if (record.status === 'Late') attended += lateWeight;
  });
  const dateMap = {};
  sessions.forEach(session => {
    if (!dateMap[session.date]) dateMap[session.date] = { date: session.date, total: 0, present: 0, absent: 0, late: 0 };
    dateMap[session.date].total += session.totalCount || 0;
    dateMap[session.date].present += session.presentCount || 0;
    dateMap[session.date].absent += session.absentCount || 0;
    dateMap[session.date].late += session.lateCount || 0;
  });
  const trendData = Object.values(dateMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7)
    .map(day => ({
      date: day.date.split('-').slice(1).join('/'),
      present: day.present,
      absent: day.absent,
      late: day.late,
      percentage: day.total ? Math.round(((day.present + day.late * lateWeight) / day.total) * 100) : 0
    }));
  const subjectMap = {};
  records.forEach(record => {
    const code = record.subjectCode || 'General';
    if (!subjectMap[code]) subjectMap[code] = { name: record.subjectName || code, total: 0, attended: 0 };
    subjectMap[code].total++;
    if (record.status === 'Present') subjectMap[code].attended++;
    else if (record.status === 'Late') subjectMap[code].attended += lateWeight;
  });
  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    totalSubjects: subjects.length,
    totalSessions: sessions.length,
    totalRecords: records.length,
    overallPercentage: records.length ? Number(((attended / records.length) * 100).toFixed(1)) : 0,
    recentSessions: sessions.slice(0, 5),
    trendData,
    subjectStats: Object.entries(subjectMap).map(([code, subject]) => ({
      name: code,
      fullName: subject.name,
      total: subject.total,
      percentage: subject.total ? Math.round((subject.attended / subject.total) * 100) : 0
    })),
    attendanceThreshold: settings.attendanceThreshold || 75
  };
}

export async function getStudentStats(studentId, studentEmail) {
  const [students, records, settings] = await Promise.all([
    getStudents(),
    getAttendanceRecords(studentId ? { studentId } : {}),
    getSettings()
  ]);
  const student = students.find(item =>
    (studentId && item.id === studentId) || (studentEmail && item.email === studentEmail)
  ) || (isFirebaseConfigured && (
    records[0] && {
      id: records[0].studentId,
      name: records[0].studentName,
      rollNumber: records[0].studentRoll
    }
  )) || null;
  const resolvedStudentId = studentId || student?.id;
  const studentRecords = student
    ? records.filter(record =>
      (resolvedStudentId && record.studentId === resolvedStudentId)
      || (!resolvedStudentId && studentEmail && record.studentEmail === studentEmail)
    )
    : [];
  const lateWeight = settings?.lateAttendanceWeight ?? 0.5;
  const threshold = settings?.attendanceThreshold || 75;
  const presentCount = studentRecords.filter(record => record.status === 'Present').length;
  const absentCount = studentRecords.filter(record => record.status === 'Absent').length;
  const lateCount = studentRecords.filter(record => record.status === 'Late').length;
  const effectiveAttended = presentCount + lateCount * lateWeight;
  const overallPercentage = studentRecords.length
    ? Math.round((effectiveAttended / studentRecords.length) * 100)
    : 0;
  const subjectMap = {};
  studentRecords.forEach(record => {
    const id = record.subjectId;
    if (!subjectMap[id]) {
      subjectMap[id] = {
        subjectId: id,
        subjectCode: record.subjectCode,
        subjectName: record.subjectName,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        effectiveAttended: 0
      };
    }
    const subject = subjectMap[id];
    subject.total++;
    if (record.status === 'Present') {
      subject.present++;
      subject.effectiveAttended++;
    } else if (record.status === 'Absent') subject.absent++;
    else if (record.status === 'Late') {
      subject.late++;
      subject.effectiveAttended += lateWeight;
    }
  });
  const subjectWise = Object.values(subjectMap).map(subject => {
    const percentage = subject.total
      ? Math.round((subject.effectiveAttended / subject.total) * 100)
      : 0;
    return { ...subject, percentage, isLowAttendance: percentage < threshold };
  });
  const monthMap = {};
  studentRecords.forEach(record => {
    const month = record.date?.substring(0, 7) || 'Unknown';
    if (!monthMap[month]) monthMap[month] = { month, total: 0, attended: 0 };
    monthMap[month].total++;
    if (record.status === 'Present') monthMap[month].attended++;
    else if (record.status === 'Late') monthMap[month].attended += lateWeight;
  });
  return {
    student,
    totalConducted: studentRecords.length,
    presentCount,
    absentCount,
    lateCount,
    effectiveAttended,
    overallPercentage,
    isBelowThreshold: studentRecords.length > 0
      && (overallPercentage < threshold || subjectWise.some(subject => subject.isLowAttendance)),
    threshold,
    subjectWise,
    monthlyData: Object.values(monthMap).map(month => ({
      month: month.month,
      percentage: month.total ? Math.round((month.attended / month.total) * 100) : 0,
      total: month.total
    })),
    recentHistory: studentRecords.slice(-10).reverse()
  };
}

export async function getTeacherStats(teacherId) {
  const [teachers, classes, subjects, sessions] = await Promise.all([
    getTeachers(),
    getClasses(),
    getSubjects(),
    getAttendanceSessions(teacherId ? { teacherId } : {})
  ]);
  const teacher = teachers.find(item => item.id === teacherId) || null;
  const assignedClasses = classes.filter(item => teacher?.assignedClasses?.includes(item.id));
  const assignedSubjects = subjects.filter(item =>
    item.teacherId === teacher?.id || teacher?.assignedSubjects?.includes(item.id)
  );
  const teacherSessions = sessions.filter(item => item.teacherId === teacher?.id);
  const totalCount = teacherSessions.reduce((sum, session) => sum + (session.totalCount || 0), 0);
  const attendedCount = teacherSessions.reduce((sum, session) =>
    sum + (session.presentCount || 0) + (session.lateCount || 0) * 0.5, 0);
  return {
    teacher,
    assignedClasses,
    assignedSubjects,
    teacherSessions,
    totalSessionsConducted: teacherSessions.length,
    averageAttendance: totalCount ? Math.round((attendedCount / totalCount) * 100) : 0,
    recentSessions: teacherSessions.slice(0, 5)
  };
}

export async function seedInitialDataToCloud() {
  const { sessions, records } = generateSeedAttendance();
  const datasets = [
    ['classes', INITIAL_CLASSES, STORAGE_KEYS.CLASSES],
    ['subjects', INITIAL_SUBJECTS, STORAGE_KEYS.SUBJECTS],
    ['teachers', INITIAL_TEACHERS, STORAGE_KEYS.TEACHERS],
    ['students', INITIAL_STUDENTS, STORAGE_KEYS.STUDENTS],
    ['attendanceSessions', sessions, STORAGE_KEYS.SESSIONS],
    ['attendanceRecords', records, STORAGE_KEYS.RECORDS]
  ];

  if (!isFirebaseConfigured) {
    let addedCount = 0;
    datasets.forEach(([, items, key]) => {
      const existing = localStorage.getItem(key);
      if (existing === null) {
        setLocal(key, items);
        addedCount += items.length;
      }
    });
    if (localStorage.getItem(STORAGE_KEYS.SETTINGS) === null) {
      setLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      addedCount++;
    }
    return { success: true, mode: 'local', addedCount };
  }

  const profile = await getIdentity();
  requireRole(profile, ['admin']);
  const pending = [];
  for (const [collectionName, items] of datasets) {
    const existing = await Promise.all(items.map(item => getDoc(doc(db, collectionName, item.id))));
    items.forEach((item, index) => {
      if (!existing[index].exists()) pending.push([collectionName, item]);
    });
  }
  const settingsRef = doc(db, 'settings', 'academic');
  const settingsSnapshot = await getDoc(settingsRef);
  const batch = writeBatch(db);
  pending.forEach(([collectionName, item]) => {
    batch.set(doc(db, collectionName, item.id), item);
  });
  const missingSettings = !settingsSnapshot.exists();
  if (missingSettings) batch.set(settingsRef, INITIAL_SETTINGS);
  if (pending.length || !settingsSnapshot.exists()) await batch.commit();
  return { success: true, mode: 'cloud', addedCount: pending.length + Number(missingSettings) };
}

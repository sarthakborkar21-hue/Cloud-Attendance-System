
import { readFileSync } from 'node:fs';
import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';

import {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

let testEnv;

const teacherProfile = {
  uid: 'teacher-1',
  email: 'teacher@example.com',
  displayName: 'Test Teacher',
  role: 'teacher',
  teacherId: 'teacher-doc-1',
};

const studentProfile = {
  uid: 'student-1',
  email: 'student@example.com',
  displayName: 'Test Student',
  role: 'student',
  studentId: 'student-doc-1',
};

const attendanceSession = {
  id: 'session-1',
  classId: 'class-1',
  className: 'Class 1',
  subjectId: 'subject-1',
  subjectCode: 'CS101',
  subjectName: 'Computing',
  teacherId: 'teacher-doc-1',
  teacherName: 'Test Teacher',
  date: '2026-10-24',
  totalCount: 1,
  presentCount: 1,
  absentCount: 0,
  lateCount: 0,
};

function attendanceRecord(studentId, recordId = `record-${studentId}`) {
  return {
    id: recordId,
    sessionId: attendanceSession.id,
    studentId,
    studentName: `Student ${studentId}`,
    studentRoll: studentId,
    studentEmail: `${studentId}@example.com`,
    status: 'Present',
    classId: attendanceSession.classId,
    className: attendanceSession.className,
    subjectId: attendanceSession.subjectId,
    subjectCode: attendanceSession.subjectCode,
    subjectName: attendanceSession.subjectName,
    date: attendanceSession.date,
    teacherId: attendanceSession.teacherId,
    teacherName: attendanceSession.teacherName,
  };
}

before(async () => {
  const rules = readFileSync(
    new URL('../firestore.rules', import.meta.url),
    'utf8'
  );

  testEnv = await initializeTestEnvironment({
    projectId: 'demo-attendance-rules',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 54322,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'users', 'student-1'), {
      uid: 'student-1',
      email: 'student@example.com',
      displayName: 'Test Student',
      role: 'student',
      phone: '',
      department: 'IT',
      createdAt: new Date(),
      studentId: 'student-doc-1',
    });

    await setDoc(doc(db, 'users', 'admin-1'), {
      uid: 'admin-1',
      email: 'admin@example.com',
      displayName: 'Test Admin',
      role: 'admin',
    });
    await setDoc(doc(db, 'users', 'teacher-1'), teacherProfile);
    await setDoc(doc(db, 'teachers', 'teacher-doc-1'), {
      id: 'teacher-doc-1',
      assignedClasses: ['class-1'],
      assignedSubjects: ['subject-1'],
    });
    await setDoc(doc(db, 'students', 'student-doc-1'), {
      id: 'student-doc-1',
      name: 'Test Student',
      classId: 'class-1',
    });
    await setDoc(doc(db, 'students', 'student-doc-2'), {
      id: 'student-doc-2',
      name: 'Other Student',
      classId: 'class-1',
    });
    for (let index = 3; index <= 4; index++) {
      await setDoc(doc(db, 'students', `student-doc-${index}`), {
        id: `student-doc-${index}`,
        name: `Test Student ${index}`,
        classId: 'class-1',
      });
    }
    await setDoc(doc(db, 'classes', 'class-1'), { id: 'class-1', name: 'Class 1' });
    await setDoc(doc(db, 'classes', 'class-2'), { id: 'class-2', name: 'Class 2' });
    await setDoc(doc(db, 'subjects', 'subject-1'), {
      id: 'subject-1',
      classId: 'class-1',
      teacherId: 'teacher-doc-1',
    });
    await setDoc(doc(db, 'subjects', 'subject-2'), {
      id: 'subject-2',
      classId: 'class-2',
      teacherId: 'teacher-doc-2',
    });
    await setDoc(doc(db, 'attendanceSessions', attendanceSession.id), attendanceSession);
    await setDoc(doc(db, 'attendanceRecords', 'record-student-doc-1'), attendanceRecord('student-doc-1'));
    await setDoc(doc(db, 'attendanceRecords', 'record-student-doc-2'), attendanceRecord('student-doc-2'));
  });
});

test('Student can read their own profile', async () => {
  const db = testEnv.authenticatedContext('student-1', {
    email: 'student@example.com',
  }).firestore();

  await assertSucceeds(
    getDoc(doc(db, 'users', 'student-1'))
  );
});

test('Teacher and admin can each read only their own profile', async () => {
  for (const [uid, email] of [
    ['teacher-1', 'teacher@example.com'],
    ['admin-1', 'admin@example.com'],
  ]) {
    const db = testEnv.authenticatedContext(uid, { email }).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', uid)));
    await assertFails(getDocs(collection(db, 'users')));
  }
});

test('Student cannot read another user profile', async () => {
  const db = testEnv.authenticatedContext('student-1', {
    email: 'student@example.com',
  }).firestore();

  await assertFails(
    getDoc(doc(db, 'users', 'admin-1'))
  );
});

test('Student cannot create an admin profile', async () => {
  const db = testEnv.authenticatedContext('new-user', {
    email: 'new@example.com',
  }).firestore();

  await assertFails(
    setDoc(doc(db, 'users', 'new-user'), {
      uid: 'new-user',
      email: 'new@example.com',
      displayName: 'New Admin',
      role: 'admin',
      phone: '',
      department: 'IT',
      createdAt: new Date(),
    })
  );
});

test('Student can create their own student profile', async () => {
  const db = testEnv.authenticatedContext('new-student', {
    email: 'newstudent@example.com',
  }).firestore();

  await assertSucceeds(
    setDoc(doc(db, 'users', 'new-student'), {
      uid: 'new-student',
      email: 'newstudent@example.com',
      displayName: 'New Student',
      role: 'student',
      phone: '',
      department: 'IT',
      createdAt: new Date(),
    })
  );
});

test('Student cannot create a teacher profile or change their role', async () => {
  const db = testEnv.authenticatedContext('new-user', {
    email: 'new@example.com',
  }).firestore();

  await assertFails(setDoc(doc(db, 'users', 'new-user'), {
    uid: 'new-user',
    email: 'new@example.com',
    displayName: 'New Teacher',
    role: 'teacher',
    phone: '',
    department: 'IT',
    createdAt: new Date(),
  }));

  const existingStudentDb = testEnv.authenticatedContext('student-1', {
    email: 'student@example.com',
  }).firestore();
  await assertFails(setDoc(doc(existingStudentDb, 'users', 'student-1'), {
    ...studentProfile,
    role: 'admin',
  }));
});

test('Student attendance query returns only records linked to their student ID', async () => {
  const db = testEnv.authenticatedContext('student-1', {
    email: 'student@example.com',
  }).firestore();

  const snapshot = await assertSucceeds(getDocs(query(
    collection(db, 'attendanceRecords'),
    where('studentId', '==', 'student-doc-1')
  )));
  assert.equal(snapshot.size, 1);
  assert.equal(snapshot.docs[0].data().studentId, 'student-doc-1');
});

test('Student cannot query another student attendance or read raw sessions', async () => {
  const db = testEnv.authenticatedContext('student-1', {
    email: 'student@example.com',
  }).firestore();

  await assertFails(getDocs(query(
    collection(db, 'attendanceRecords'),
    where('studentId', '==', 'student-doc-2')
  )));
  await assertFails(getDoc(doc(db, 'attendanceSessions', attendanceSession.id)));
});

test('Teacher can read assigned class records and cannot read an unassigned class', async () => {
  const db = testEnv.authenticatedContext('teacher-1', {
    email: 'teacher@example.com',
  }).firestore();

  const assigned = await assertSucceeds(getDocs(query(
    collection(db, 'attendanceRecords'),
    where('classId', '==', 'class-1'),
    where('teacherId', '==', 'teacher-doc-1')
  )));
  assert.equal(assigned.size, 2);

  await assertFails(getDocs(query(
    collection(db, 'attendanceRecords'),
    where('classId', '==', 'class-2'),
    where('teacherId', '==', 'teacher-doc-1')
  )));
  await assertFails(getDoc(doc(db, 'classes', 'class-2')));
});

test('Admin can read and query administrative attendance data', async () => {
  const db = testEnv.authenticatedContext('admin-1', {
    email: 'admin@example.com',
  }).firestore();

  await assertSucceeds(getDoc(doc(db, 'students', 'student-doc-1')));
  await assertSucceeds(getDoc(doc(db, 'teachers', 'teacher-doc-1')));
  const records = await assertSucceeds(getDocs(collection(db, 'attendanceRecords')));
  assert.equal(records.size, 2);
});

test('Teacher can atomically create a session and attendance records for a class', async () => {
  const db = testEnv.authenticatedContext('teacher-1', {
    email: 'teacher@example.com',
  }).firestore();
  const batch = writeBatch(db);
  const newSession = { ...attendanceSession, id: 'session-batch-1' };
  const firstRecord = {
    ...attendanceRecord('student-doc-1', 'batch-record-1'),
    sessionId: newSession.id,
  };

  batch.set(doc(db, 'attendanceSessions', newSession.id), newSession);
  batch.set(doc(db, 'attendanceRecords', firstRecord.id), firstRecord);

  await assertSucceeds(batch.commit());
});

for (const studentCount of [3, 4]) {
  test(`Teacher saves and retrieves all ${studentCount} attendance records with correct statuses`, async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      email: 'teacher@example.com',
    }).firestore();
    const sessionId = `session-class-size-${studentCount}`;
    const statuses = Array.from({ length: studentCount }, (_, index) =>
      index % 2 === 0 ? 'Present' : 'Absent'
    );
    const batchSession = {
      ...attendanceSession,
      id: sessionId,
      totalCount: studentCount,
      presentCount: statuses.filter(status => status === 'Present').length,
      absentCount: statuses.filter(status => status === 'Absent').length,
      lateCount: 0,
    };
    const batch = writeBatch(teacherDb);
    batch.set(doc(teacherDb, 'attendanceSessions', sessionId), batchSession);
    statuses.forEach((status, index) => {
      const studentId = `student-doc-${index + 1}`;
      const record = {
        ...attendanceRecord(studentId, `${sessionId}-record-${index + 1}`),
        sessionId,
        status,
      };
      batch.set(doc(teacherDb, 'attendanceRecords', record.id), record);
    });

    await assertSucceeds(batch.commit());

    const savedSession = await assertSucceeds(
      getDoc(doc(teacherDb, 'attendanceSessions', sessionId))
    );
    assert.equal(savedSession.exists(), true);
    assert.equal(savedSession.data().totalCount, studentCount);
    assert.equal(savedSession.data().presentCount, statuses.filter(status => status === 'Present').length);
    assert.equal(savedSession.data().absentCount, statuses.filter(status => status === 'Absent').length);

    const savedRecords = await assertSucceeds(getDocs(query(
      collection(teacherDb, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      where('classId', '==', 'class-1'),
      where('teacherId', '==', 'teacher-doc-1')
    )));
    assert.equal(savedRecords.size, studentCount);
    assert.deepEqual(
      savedRecords.docs.map(record => record.data().status).sort(),
      statuses.slice().sort()
    );
  });
}

test('Denied attendance batch leaves no session or partial records', async () => {
  const teacherDb = testEnv.authenticatedContext('teacher-1', {
    email: 'teacher@example.com',
  }).firestore();
  const sessionId = 'session-denied-atomic';
  const batch = writeBatch(teacherDb);
  batch.set(doc(teacherDb, 'attendanceSessions', sessionId), {
    ...attendanceSession,
    id: sessionId,
    totalCount: 3,
  });
  ['student-doc-1', 'student-doc-2', 'student-doc-3'].forEach((studentId, index) => {
    const record = {
      ...attendanceRecord(studentId, `${sessionId}-record-${index + 1}`),
      sessionId,
      status: index === 2 ? 'Excused' : 'Present',
    };
    batch.set(doc(teacherDb, 'attendanceRecords', record.id), record);
  });

  await assertFails(batch.commit());

  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const savedSession = await getDoc(doc(db, 'attendanceSessions', sessionId));
    const savedRecords = await getDocs(query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId)
    ));
    assert.equal(savedSession.exists(), false);
    assert.equal(savedRecords.size, 0);
  });
});

test('Teacher attendance batch succeeds at five students and rejects ten due to rule access budget', async () => {
  const db = testEnv.authenticatedContext('teacher-1', {
    email: 'teacher@example.com',
  }).firestore();
  const students = Array.from({ length: 25 }, (_, index) => `batch-student-${index}`);

  await testEnv.withSecurityRulesDisabled(async context => {
    const fixtureDb = context.firestore();
    await Promise.all(students.map(studentId => setDoc(
      doc(fixtureDb, 'students', studentId),
      { id: studentId, classId: 'class-1' }
    )));
  });

  const makeBatch = (sessionId, batchStudents) => {
    const batch = writeBatch(db);
    const batchSession = { ...attendanceSession, id: sessionId };
    batch.set(doc(db, 'attendanceSessions', sessionId), {
      ...batchSession,
      totalCount: batchStudents.length,
    });
    batchStudents.forEach(studentId => {
      const record = {
        ...attendanceRecord(studentId, `${sessionId}-${studentId}`),
        sessionId,
      };
      batch.set(doc(db, 'attendanceRecords', record.id), record);
    });
    return batch;
  };

  await assertSucceeds(makeBatch('small-class-session', students.slice(0, 5)).commit());
  await assertFails(makeBatch('large-class-session', students.slice(0, 10)).commit());
});

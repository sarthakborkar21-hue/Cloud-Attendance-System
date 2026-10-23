// Initial Seed Data for College Attendance Management System

export const INITIAL_CLASSES = [
  {
    id: "cls-cs3a",
    name: "CS-3A",
    department: "Computer Science & Engineering",
    semester: "Semester 6",
    academicYear: "2024-2025",
    room: "Lab 302 - Turing Hall",
    totalStudents: 10,
    createdAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "cls-cs3b",
    name: "CS-3B",
    department: "Computer Science & Engineering",
    semester: "Semester 6",
    academicYear: "2024-2025",
    room: "Room 305 - Babbage Block",
    totalStudents: 8,
    createdAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "cls-it2a",
    name: "IT-2A",
    department: "Information Technology",
    semester: "Semester 4",
    academicYear: "2024-2025",
    room: "Room 201 - Hopper Wing",
    totalStudents: 8,
    createdAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "cls-ece4a",
    name: "ECE-4A",
    department: "Electronics & Communication",
    semester: "Semester 8",
    academicYear: "2024-2025",
    room: "Room 408 - Shannon Wing",
    totalStudents: 6,
    createdAt: "2024-01-10T09:00:00Z"
  }
];

export const INITIAL_SUBJECTS = [
  {
    id: "sub-cs301",
    code: "CS301",
    name: "Cloud Computing & Virtualization",
    classId: "cls-cs3a",
    className: "CS-3A",
    teacherId: "tch-001",
    teacherName: "Dr. Robert Vance",
    credits: 4,
    department: "Computer Science & Engineering",
    createdAt: "2024-01-12T09:00:00Z"
  },
  {
    id: "sub-cs302",
    code: "CS302",
    name: "Distributed Database Systems",
    classId: "cls-cs3a",
    className: "CS-3A",
    teacherId: "tch-002",
    teacherName: "Prof. Sarah Jenkins",
    credits: 3,
    department: "Computer Science & Engineering",
    createdAt: "2024-01-12T09:00:00Z"
  },
  {
    id: "sub-cs303",
    code: "CS303",
    name: "Computer Networks & Security",
    classId: "cls-cs3a",
    className: "CS-3A",
    teacherId: "tch-003",
    teacherName: "Dr. Alan Miller",
    credits: 4,
    department: "Computer Science & Engineering",
    createdAt: "2024-01-12T09:00:00Z"
  },
  {
    id: "sub-cs304",
    code: "CS304",
    name: "Software Engineering & DevOps",
    classId: "cls-cs3a",
    className: "CS-3A",
    teacherId: "tch-004",
    teacherName: "Prof. Emily Chen",
    credits: 3,
    department: "Computer Science & Engineering",
    createdAt: "2024-01-12T09:00:00Z"
  },
  {
    id: "sub-it201",
    code: "IT201",
    name: "Data Structures & Algorithms",
    classId: "cls-it2a",
    className: "IT-2A",
    teacherId: "tch-001",
    teacherName: "Dr. Robert Vance",
    credits: 4,
    department: "Information Technology",
    createdAt: "2024-01-12T09:00:00Z"
  }
];

export const INITIAL_TEACHERS = [
  {
    id: "tch-001",
    teacherId: "T201801",
    name: "Dr. Robert Vance",
    email: "teacher@college.edu",
    phone: "+1 (555) 234-5678",
    department: "Computer Science & Engineering",
    designation: "Associate Professor",
    assignedClasses: ["cls-cs3a", "cls-it2a"],
    assignedSubjects: ["sub-cs301", "sub-it201"],
    status: "Active",
    createdAt: "2024-01-05T09:00:00Z"
  },
  {
    id: "tch-002",
    teacherId: "T201904",
    name: "Prof. Sarah Jenkins",
    email: "sarah.jenkins@college.edu",
    phone: "+1 (555) 345-6789",
    department: "Computer Science & Engineering",
    designation: "Assistant Professor",
    assignedClasses: ["cls-cs3a"],
    assignedSubjects: ["sub-cs302"],
    status: "Active",
    createdAt: "2024-01-05T09:00:00Z"
  },
  {
    id: "tch-003",
    teacherId: "T201509",
    name: "Dr. Alan Miller",
    email: "alan.miller@college.edu",
    phone: "+1 (555) 456-7890",
    department: "Computer Science & Engineering",
    designation: "Professor & Head",
    assignedClasses: ["cls-cs3a"],
    assignedSubjects: ["sub-cs303"],
    status: "Active",
    createdAt: "2024-01-05T09:00:00Z"
  },
  {
    id: "tch-004",
    teacherId: "T202112",
    name: "Prof. Emily Chen",
    email: "emily.chen@college.edu",
    phone: "+1 (555) 567-8901",
    department: "Computer Science & Engineering",
    designation: "Assistant Professor",
    assignedClasses: ["cls-cs3a"],
    assignedSubjects: ["sub-cs304"],
    status: "Active",
    createdAt: "2024-01-05T09:00:00Z"
  }
];

export const INITIAL_STUDENTS = [
  {
    id: "stu-001",
    rollNumber: "CS21001",
    name: "Alex Morgan",
    email: "student@college.edu",
    phone: "+1 (555) 901-2345",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Male",
    dob: "2003-05-14",
    guardianName: "Thomas Morgan",
    guardianPhone: "+1 (555) 901-2340",
    address: "42 College Park Ave, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-002",
    rollNumber: "CS21002",
    name: "Priya Sharma",
    email: "priya.sharma@student.college.edu",
    phone: "+1 (555) 901-2346",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Female",
    dob: "2003-08-22",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+1 (555) 901-2341",
    address: "15 University Heights, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-003",
    rollNumber: "CS21003",
    name: "David Kim",
    email: "david.kim@student.college.edu",
    phone: "+1 (555) 901-2347",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Male",
    dob: "2003-02-11",
    guardianName: "Jin Kim",
    guardianPhone: "+1 (555) 901-2342",
    address: "78 Elmwood Court, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-004",
    rollNumber: "CS21004",
    name: "Samantha Patel",
    email: "samantha.patel@student.college.edu",
    phone: "+1 (555) 901-2348",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Female",
    dob: "2003-11-03",
    guardianName: "Hitesh Patel",
    guardianPhone: "+1 (555) 901-2343",
    address: "9 Westlake Boulevard, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-005",
    rollNumber: "CS21005",
    name: "Marcus Johnson",
    email: "marcus.j@student.college.edu",
    phone: "+1 (555) 901-2349",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Male",
    dob: "2003-07-19",
    guardianName: "Carl Johnson",
    guardianPhone: "+1 (555) 901-2344",
    address: "104 Maple Street, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-006",
    rollNumber: "CS21006",
    name: "Emily Rodriguez",
    email: "emily.r@student.college.edu",
    phone: "+1 (555) 901-2350",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Female",
    dob: "2003-09-30",
    guardianName: "Carlos Rodriguez",
    guardianPhone: "+1 (555) 901-2345",
    address: "210 Oak Ridge Dr, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-007",
    rollNumber: "CS21007",
    name: "Liam Walker",
    email: "liam.w@student.college.edu",
    phone: "+1 (555) 901-2351",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Male",
    dob: "2003-04-16",
    guardianName: "Daniel Walker",
    guardianPhone: "+1 (555) 901-2346",
    address: "33 Pinecrest Way, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-008",
    rollNumber: "CS21008",
    name: "Ananya Verma",
    email: "ananya.v@student.college.edu",
    phone: "+1 (555) 901-2352",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Female",
    dob: "2003-01-25",
    guardianName: "Sunil Verma",
    guardianPhone: "+1 (555) 901-2347",
    address: "88 Willow Creek Ln, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-009",
    rollNumber: "CS21009",
    name: "Rohan Gupta",
    email: "rohan.gupta@student.college.edu",
    phone: "+1 (555) 901-2353",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Male",
    dob: "2003-12-05",
    guardianName: "Ajay Gupta",
    guardianPhone: "+1 (555) 901-2348",
    address: "51 Highland Terrace, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  },
  {
    id: "stu-010",
    rollNumber: "CS21010",
    name: "Jessica Taylor",
    email: "jessica.t@student.college.edu",
    phone: "+1 (555) 901-2354",
    classId: "cls-cs3a",
    className: "CS-3A",
    gender: "Female",
    dob: "2003-06-18",
    guardianName: "Brian Taylor",
    guardianPhone: "+1 (555) 901-2349",
    address: "12 Sunset View, Springfield",
    status: "Active",
    createdAt: "2024-01-08T09:00:00Z"
  }
];

export const INITIAL_USERS = [
  {
    uid: "usr-admin-01",
    email: "admin@college.edu",
    displayName: "Dean of Academics",
    role: "admin",
    phone: "+1 (555) 000-1111",
    department: "Academic Administration",
    createdAt: "2024-01-01T08:00:00Z"
  },
  {
    uid: "usr-teacher-01",
    email: "teacher@college.edu",
    displayName: "Dr. Robert Vance",
    role: "teacher",
    teacherId: "tch-001",
    phone: "+1 (555) 234-5678",
    department: "Computer Science & Engineering",
    createdAt: "2024-01-05T09:00:00Z"
  },
  {
    uid: "usr-student-01",
    email: "student@college.edu",
    displayName: "Alex Morgan",
    role: "student",
    studentId: "stu-001",
    rollNumber: "CS21001",
    classId: "cls-cs3a",
    className: "CS-3A",
    phone: "+1 (555) 901-2345",
    createdAt: "2024-01-08T09:00:00Z"
  }
];

// Helper to generate seed sessions and records across multiple dates
export function generateSeedAttendance() {
  const dates = [
    "2024-10-01", "2024-10-03", "2024-10-04", "2024-10-07",
    "2024-10-09", "2024-10-10", "2024-10-14", "2024-10-16",
    "2024-10-18", "2024-10-21", "2024-10-22"
  ];

  const subjectsToSimulate = [
    { id: "sub-cs301", code: "CS301", name: "Cloud Computing & Virtualization", teacherId: "tch-001", teacherName: "Dr. Robert Vance" },
    { id: "sub-cs302", code: "CS302", name: "Distributed Database Systems", teacherId: "tch-002", teacherName: "Prof. Sarah Jenkins" },
    { id: "sub-cs303", code: "CS303", name: "Computer Networks & Security", teacherId: "tch-003", teacherName: "Dr. Alan Miller" },
    { id: "sub-cs304", code: "CS304", name: "Software Engineering & DevOps", teacherId: "tch-004", teacherName: "Prof. Emily Chen" },
  ];

  const sessions = [];
  const records = [];

  dates.forEach((date, dateIdx) => {
    // Schedule 2 subjects per date
    const daySubjects = [
      subjectsToSimulate[dateIdx % 4],
      subjectsToSimulate[(dateIdx + 1) % 4]
    ];

    daySubjects.forEach((sub, subIdx) => {
      const sessionId = `ses-${sub.code.toLowerCase()}-${date}`;
      const session = {
        id: sessionId,
        classId: "cls-cs3a",
        className: "CS-3A",
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        teacherId: sub.teacherId,
        teacherName: sub.teacherName,
        date: date,
        slot: subIdx === 0 ? "09:00 - 10:00 AM" : "11:15 - 12:15 PM",
        room: "Lab 302",
        totalCount: INITIAL_STUDENTS.length,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        remarks: `Regular lecture for ${sub.code} covering Module ${((dateIdx % 3) + 1)}`,
        createdAt: `${date}T12:30:00Z`
      };

      let p = 0, a = 0, l = 0;

      INITIAL_STUDENTS.forEach((student, stuIdx) => {
        // Specifically craft student Alex Morgan (stu-001) so:
        // In CS301 (Cloud Computing): high attendance (~90%)
        // In CS303 (Computer Networks): low attendance (~65%) to trigger the < 75% warning!
        let status = "Present";
        if (student.id === "stu-001") {
          if (sub.code === "CS303") {
            // Give 4 absences out of 6 sessions to trigger < 75% warning
            if (dateIdx % 2 === 0) status = "Absent";
            else if (dateIdx === 3) status = "Late";
            else status = "Present";
          } else {
            // High attendance in other subjects
            if (dateIdx === 5) status = "Absent";
            else if (dateIdx === 7) status = "Late";
            else status = "Present";
          }
        } else {
          // General pseudo-realistic distribution for other students
          const r = (stuIdx * 7 + dateIdx * 3 + subIdx * 5) % 10;
          if (r === 0) status = "Absent";
          else if (r === 1) status = "Late";
          else status = "Present";
        }

        if (status === "Present") p++;
        else if (status === "Absent") a++;
        else if (status === "Late") l++;

        records.push({
          id: `rec-${sessionId}-${student.id}`,
          sessionId: sessionId,
          studentId: student.id,
          studentName: student.name,
          studentRoll: student.rollNumber,
          studentEmail: student.email,
          classId: "cls-cs3a",
          className: "CS-3A",
          subjectId: sub.id,
          subjectCode: sub.code,
          subjectName: sub.name,
          date: date,
          status: status, // 'Present', 'Absent', 'Late'
          teacherId: sub.teacherId,
          teacherName: sub.teacherName,
          remarks: status === "Late" ? "Arrived 15 mins late" : "",
          createdAt: `${date}T12:30:00Z`
        });
      });

      session.presentCount = p;
      session.absentCount = a;
      session.lateCount = l;

      sessions.push(session);
    });
  });

  return { sessions, records };
}

export const INITIAL_SETTINGS = {
  academicYear: "2024-2025",
  collegeName: "National Institute of Science & Technology",
  attendanceThreshold: 75,
  lateAttendanceWeight: 0.5, // 0.5 counts as half credit, 1.0 counts as full credit, 0.0 counts as absent
  autoLockDays: 7,
  emailNotifications: true
};

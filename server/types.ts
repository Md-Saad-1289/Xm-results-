export interface IProject {
  _id: string;
  name: string;
  totalWorkingDays: number;
  instituteName?: string;
  examName?: string;
  className?: string;
  sectionName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISubject {
  _id: string;
  projectId: string;
  name: string;
  totalMarks: number;
  passMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISubjectCode {
  subjectId: string;
  code: string;
}

export interface IStudent {
  _id: string;
  projectId: string;
  name: string;
  rollNo?: string;
  studentCode?: string;
  totalAttendance: number;
  subjectCodes: ISubjectCode[];
  createdAt: string;
  updatedAt: string;
}

export interface IMarkEntry {
  _id: string;
  projectId: string;
  studentId: string;
  subjectId: string;
  kataCode: string;
  obtainedMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISubjectResult {
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passMarks: number;
  highestMarks?: number | null;
  obtainedMarks: number | null;
  percentage: number | null;
  grade: string | null;
  gradePoint: number | null;
  status: 'Pass' | 'Fail' | 'Pending';
  kataCode?: string;
}

export interface IStudentResult {
  studentId: string;
  studentName: string;
  rollNo?: string;
  studentCode?: string;
  totalAttendance: number;
  totalObtainedMarks: number;
  totalFullMarks: number;
  gpa: number | null;
  meritPosition: number | null;
  finalStatus: 'Pass' | 'Fail' | 'Pending';
  subjectResults: ISubjectResult[];
}

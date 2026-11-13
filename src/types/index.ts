export interface Project {
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

export interface Subject {
  _id: string;
  projectId: string;
  name: string;
  totalMarks: number;
  passMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectCode {
  subjectId: string;
  code: string;
}

export interface Student {
  _id: string;
  projectId: string;
  name: string;
  rollNo?: string;
  studentCode?: string;
  totalAttendance: number;
  subjectCodes: SubjectCode[];
  createdAt: string;
  updatedAt: string;
}

export interface MarkEntry {
  _id: string;
  projectId: string;
  studentId: string;
  subjectId: string;
  kataCode: string;
  obtainedMarks: number;
  studentName?: string;
  subjectName?: string;
  totalMarks?: number;
  passMarks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectOverview {
  projectName: string;
  totalWorkingDays: number;
  instituteName?: string;
  examName?: string;
  className?: string;
  sectionName?: string;
  totalSubjects: number;
  totalStudents: number;
  totalMarkEntries: number;
}

export interface SubjectResult {
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

export interface StudentResult {
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
  subjectResults: SubjectResult[];
}

export interface MarksheetData extends StudentResult {
  projectName: string;
  totalWorkingDays: number;
  instituteName?: string;
  examName?: string;
  className?: string;
  sectionName?: string;
}

export interface KataIdentification {
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passMarks: number;
  isAlreadyEntered: boolean;
  existingMark?: MarkEntry;
}

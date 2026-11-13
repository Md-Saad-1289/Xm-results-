import { ISubject, IStudent, IMarkEntry, IStudentResult, ISubjectResult } from './types';

export interface GradeScale {
  grade: string;
  gradePoint: number;
}

export function calculateSubjectGrade(obtainedMarks: number, totalMarks: number): GradeScale {
  if (totalMarks <= 0) {
    return { grade: 'F', gradePoint: 0.00 };
  }

  const percentage = (obtainedMarks / totalMarks) * 100;

  if (percentage >= 80) {
    return { grade: 'A+', gradePoint: 5.00 };
  } else if (percentage >= 70) {
    return { grade: 'A', gradePoint: 4.00 };
  } else if (percentage >= 60) {
    return { grade: 'A-', gradePoint: 3.50 };
  } else if (percentage >= 50) {
    return { grade: 'B', gradePoint: 3.00 };
  } else if (percentage >= 40) {
    return { grade: 'C', gradePoint: 2.00 };
  } else if (percentage >= 33) {
    return { grade: 'D', gradePoint: 1.00 };
  } else {
    return { grade: 'F', gradePoint: 0.00 };
  }
}

export function calculateStudentResult(
  student: IStudent,
  subjects: ISubject[],
  allMarks: IMarkEntry[],
  highestMarksMap?: Map<string, number>
): IStudentResult {
  let totalObtainedMarks = 0;
  let totalFullMarks = 0;
  let totalGradePoints = 0;
  let hasPending = false;
  let hasFail = false;

  const studentMarks = allMarks.filter(m => m.studentId === student._id);

  const subjectResults: ISubjectResult[] = subjects.map(subject => {
    totalFullMarks += subject.totalMarks;
    const markEntry = studentMarks.find(m => m.subjectId === subject._id);
    const codeObj = student.subjectCodes.find(sc => sc.subjectId === subject._id);
    const highest = highestMarksMap?.has(subject._id) ? highestMarksMap.get(subject._id)! : null;

    if (!markEntry) {
      hasPending = true;
      return {
        subjectId: subject._id,
        subjectName: subject.name,
        totalMarks: subject.totalMarks,
        passMarks: subject.passMarks,
        highestMarks: highest,
        obtainedMarks: null,
        percentage: null,
        grade: null,
        gradePoint: null,
        status: 'Pending',
        kataCode: codeObj?.code
      };
    }

    const obtained = markEntry.obtainedMarks;
    totalObtainedMarks += obtained;

    const { grade, gradePoint } = calculateSubjectGrade(obtained, subject.totalMarks);
    const percentage = Math.round(((obtained / subject.totalMarks) * 100) * 100) / 100;

    const isPass = grade !== 'F' && obtained >= subject.passMarks;
    if (!isPass) {
      hasFail = true;
    }

    totalGradePoints += gradePoint;

    return {
      subjectId: subject._id,
      subjectName: subject.name,
      totalMarks: subject.totalMarks,
      passMarks: subject.passMarks,
      highestMarks: highest,
      obtainedMarks: obtained,
      percentage,
      grade,
      gradePoint,
      status: isPass ? 'Pass' : 'Fail',
      kataCode: markEntry.kataCode || codeObj?.code
    };
  });

  // Final Status determination:
  // - If ANY subject's Mark Entry is missing/pending, Final Result = Pending
  // - If ANY subject has Grade F, Final Result = Fail
  // - If all subjects entered and no F, Final Result = Pass
  // - In Pending status, GPA is null (not published)
  let finalStatus: 'Pass' | 'Fail' | 'Pending' = 'Pass';
  let gpa: number | null = null;

  if (subjects.length === 0) {
    finalStatus = 'Pending';
    gpa = null;
  } else if (hasPending) {
    finalStatus = 'Pending';
    gpa = null;
  } else if (hasFail) {
    finalStatus = 'Fail';
    // When fail, GPA is 0.00
    gpa = 0.00;
  } else {
    finalStatus = 'Pass';
    const rawGpa = totalGradePoints / subjects.length;
    // Cap at 5.00 and round to 2 decimal places
    gpa = Math.min(5.00, Math.round(rawGpa * 100) / 100);
  }

  return {
    studentId: student._id,
    studentName: student.name,
    rollNo: student.rollNo || '',
    studentCode: student.studentCode || '',
    totalAttendance: Number(student.totalAttendance ?? 0),
    totalObtainedMarks,
    totalFullMarks,
    gpa,
    meritPosition: null,
    finalStatus,
    subjectResults
  };
}

/**
 * Calculates results and assigns Merit Position (Ranking) according to business rules:
 * 1. GPA descending (Pass students ranked first, then Fail students)
 * 2. If GPA is tied, total obtained marks descending
 * 3. Pending students get NO ranking (meritPosition = null)
 * 4. Equal GPA & equal total marks share the exact same Merit Position
 */
export function calculateAndRankProjectResults(
  students: IStudent[],
  subjects: ISubject[],
  allMarks: IMarkEntry[]
): IStudentResult[] {
  const highestMarksMap = new Map<string, number>();
  for (const m of allMarks) {
    const current = highestMarksMap.get(m.subjectId);
    if (current === undefined || m.obtainedMarks > current) {
      highestMarksMap.set(m.subjectId, m.obtainedMarks);
    }
  }

  const initialResults: IStudentResult[] = students.map(student =>
    calculateStudentResult(student, subjects, allMarks, highestMarksMap)
  );

  const nonPending = initialResults.filter(r => r.finalStatus !== 'Pending');
  const pending = initialResults.filter(r => r.finalStatus === 'Pending');

  // Sort non-pending:
  // - Pass students come before Fail
  // - GPA descending
  // - Total obtained marks descending
  nonPending.sort((a, b) => {
    if (a.finalStatus === 'Pass' && b.finalStatus !== 'Pass') return -1;
    if (a.finalStatus !== 'Pass' && b.finalStatus === 'Pass') return 1;

    const gpaA = a.gpa ?? 0;
    const gpaB = b.gpa ?? 0;
    if (gpaB !== gpaA) {
      return gpaB - gpaA;
    }

    return b.totalObtainedMarks - a.totalObtainedMarks;
  });

  // Assign Merit Positions
  for (let i = 0; i < nonPending.length; i++) {
    if (i === 0) {
      nonPending[i].meritPosition = 1;
    } else {
      const prev = nonPending[i - 1];
      const curr = nonPending[i];
      if (
        curr.finalStatus === prev.finalStatus &&
        curr.gpa === prev.gpa &&
        curr.totalObtainedMarks === prev.totalObtainedMarks
      ) {
        curr.meritPosition = prev.meritPosition;
      } else {
        curr.meritPosition = i + 1;
      }
    }
  }

  const resultMap = new Map<string, IStudentResult>();
  nonPending.forEach(r => resultMap.set(r.studentId, r));
  pending.forEach(r => resultMap.set(r.studentId, r));

  return students.map(s => resultMap.get(s._id)!);
}

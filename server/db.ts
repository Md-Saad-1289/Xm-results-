import fs from 'fs';
import path from 'path';
import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { IProject, ISubject, IStudent, IMarkEntry } from './types';

// --- Mongoose Schema & Model Definitions ---
interface ProjectDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  totalWorkingDays: number;
  instituteName: string;
  examName: string;
  className: string;
  sectionName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMetaUpdate {
  instituteName?: string;
  examName?: string;
  className?: string;
  sectionName?: string;
}

interface SubjectDoc extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  name: string;
  totalMarks: number;
  passMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StudentDoc extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  name: string;
  totalAttendance: number;
  subjectCodes: {
    subjectId: Types.ObjectId;
    code: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface MarkEntryDoc extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  kataCode: string;
  obtainedMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ProjectMongooseSchema = new Schema<ProjectDoc>({
  name: { type: String, required: true, trim: true },
  totalWorkingDays: { type: Number, required: true, min: 0 },
  instituteName: { type: String, default: '', trim: true },
  examName: { type: String, default: '', trim: true },
  className: { type: String, default: '', trim: true },
  sectionName: { type: String, default: '', trim: true },
}, { timestamps: true });

export const SubjectMongooseSchema = new Schema<SubjectDoc>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true, trim: true },
  totalMarks: { type: Number, required: true, min: 1 },
  passMarks: { type: Number, required: true, min: 0 },
}, { timestamps: true });

export const StudentMongooseSchema = new Schema<StudentDoc>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true, trim: true },
  totalAttendance: { type: Number, required: true, default: 0, min: 0 },
  subjectCodes: [{
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    code: { type: String, required: true, trim: true }
  }],
}, { timestamps: true });

export const MarkEntryMongooseSchema = new Schema<MarkEntryDoc>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  kataCode: { type: String, required: true, trim: true },
  obtainedMarks: { type: Number, required: true, min: 0 },
}, { timestamps: true });

export const ProjectModel: Model<ProjectDoc> =
  mongoose.models.Project || mongoose.model<ProjectDoc>('Project', ProjectMongooseSchema);
export const SubjectModel: Model<SubjectDoc> =
  mongoose.models.Subject || mongoose.model<SubjectDoc>('Subject', SubjectMongooseSchema);
export const StudentModel: Model<StudentDoc> =
  mongoose.models.Student || mongoose.model<StudentDoc>('Student', StudentMongooseSchema);
export const MarkEntryModel: Model<MarkEntryDoc> =
  mongoose.models.MarkEntry || mongoose.model<MarkEntryDoc>('MarkEntry', MarkEntryMongooseSchema);

export interface IDatabaseAdapter {
  getProjects(): Promise<IProject[]>;
  getProjectById(id: string): Promise<IProject | null>;
  createProject(name: string, totalWorkingDays: number, meta?: ProjectMetaUpdate): Promise<IProject>;
  updateProject(id: string, name: string, totalWorkingDays: number, meta?: ProjectMetaUpdate): Promise<IProject | null>;
  deleteProject(id: string): Promise<boolean>;

  getSubjects(projectId: string): Promise<ISubject[]>;
  getSubjectById(id: string): Promise<ISubject | null>;
  createSubject(projectId: string, name: string, totalMarks: number, passMarks: number): Promise<ISubject>;
  updateSubject(id: string, name: string, totalMarks: number, passMarks: number): Promise<ISubject | null>;
  deleteSubject(id: string): Promise<{ success: boolean; marksCount: number }>;

  getStudents(projectId: string): Promise<IStudent[]>;
  getStudentById(id: string): Promise<IStudent | null>;
  createStudent(
    projectId: string,
    name: string,
    subjectCodes: { subjectId: string; code: string }[],
    totalAttendance?: number
  ): Promise<IStudent>;
  updateStudent(
    id: string,
    name: string,
    subjectCodes: { subjectId: string; code: string }[],
    totalAttendance?: number
  ): Promise<IStudent | null>;
  deleteStudent(id: string): Promise<boolean>;

  identifyKataCode(projectId: string, code: string): Promise<{
    student: IStudent;
    subject: ISubject;
    isAlreadyEntered: boolean;
    existingMark?: IMarkEntry;
  } | null>;

  getMarkEntries(projectId: string): Promise<IMarkEntry[]>;
  getMarkEntryById(id: string): Promise<IMarkEntry | null>;
  createMarkEntry(projectId: string, kataCode: string, obtainedMarks: number): Promise<IMarkEntry>;
  updateMarkEntry(id: string, obtainedMarks: number): Promise<IMarkEntry | null>;
  deleteMarkEntry(id: string): Promise<boolean>;

  getProjectOverview(projectId: string): Promise<{
    projectName: string;
    totalWorkingDays: number;
    instituteName: string;
    examName: string;
    className: string;
    sectionName: string;
    totalSubjects: number;
    totalStudents: number;
    totalMarkEntries: number;
  } | null>;
}

// ============================================================
// 1. Primary MongoDB + Mongoose Database Implementation
// ============================================================
function mapProject(doc: ProjectDoc): IProject {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    totalWorkingDays: doc.totalWorkingDays,
    instituteName: doc.instituteName || '',
    examName: doc.examName || '',
    className: doc.className || '',
    sectionName: doc.sectionName || '',
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

function mapSubject(doc: SubjectDoc): ISubject {
  return {
    _id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    name: doc.name,
    totalMarks: doc.totalMarks,
    passMarks: doc.passMarks,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

function mapStudent(doc: StudentDoc): IStudent {
  return {
    _id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    name: doc.name,
    totalAttendance: Number(doc.totalAttendance ?? 0),
    subjectCodes: (doc.subjectCodes || []).map(sc => ({
      subjectId: sc.subjectId.toString(),
      code: sc.code
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

function mapMarkEntry(doc: MarkEntryDoc): IMarkEntry {
  return {
    _id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    studentId: doc.studentId.toString(),
    subjectId: doc.subjectId.toString(),
    kataCode: doc.kataCode,
    obtainedMarks: doc.obtainedMarks,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

class MongoDatabase implements IDatabaseAdapter {
  private isValidId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  // --- PROJECTS ---
  async getProjects(): Promise<IProject[]> {
    const docs = await ProjectModel.find().sort({ createdAt: -1 });
    return docs.map(mapProject);
  }

  async getProjectById(id: string): Promise<IProject | null> {
    if (!this.isValidId(id)) return null;
    const doc = await ProjectModel.findById(id);
    return doc ? mapProject(doc) : null;
  }

  async createProject(name: string, totalWorkingDays: number, meta?: ProjectMetaUpdate): Promise<IProject> {
    const doc = await ProjectModel.create({
      name: name.trim(),
      totalWorkingDays: Number(totalWorkingDays),
      instituteName: (meta?.instituteName || '').trim(),
      examName: (meta?.examName || '').trim(),
      className: (meta?.className || '').trim(),
      sectionName: (meta?.sectionName || '').trim()
    });
    return mapProject(doc);
  }

  async updateProject(id: string, name: string, totalWorkingDays: number, meta?: ProjectMetaUpdate): Promise<IProject | null> {
    if (!this.isValidId(id)) return null;
    const workingDays = Number(totalWorkingDays);

    const students = await StudentModel.find({ projectId: id }, { totalAttendance: 1 });
    const maxAttendance = students.reduce((max, s) => Math.max(max, Number(s.totalAttendance ?? 0)), 0);
    if (workingDays < maxAttendance) {
      throw new Error(`মোট কার্যদিবস বিদ্যমান শিক্ষার্থীর সর্বোচ্চ উপস্থিতি (${maxAttendance} দিন)-এর কম হতে পারবে না।`);
    }

    const updateFields: Record<string, any> = {
      name: name.trim(),
      totalWorkingDays: workingDays
    };
    if (meta) {
      if (meta.instituteName !== undefined) updateFields.instituteName = meta.instituteName.trim();
      if (meta.examName !== undefined) updateFields.examName = meta.examName.trim();
      if (meta.className !== undefined) updateFields.className = meta.className.trim();
      if (meta.sectionName !== undefined) updateFields.sectionName = meta.sectionName.trim();
    }

    const updated = await ProjectModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    return updated ? mapProject(updated) : null;
  }

  async deleteProject(id: string): Promise<boolean> {
    if (!this.isValidId(id)) return false;
    const deleted = await ProjectModel.findByIdAndDelete(id);
    if (!deleted) return false;
    await Promise.all([
      SubjectModel.deleteMany({ projectId: id }),
      StudentModel.deleteMany({ projectId: id }),
      MarkEntryModel.deleteMany({ projectId: id })
    ]);
    return true;
  }

  // --- SUBJECTS ---
  async getSubjects(projectId: string): Promise<ISubject[]> {
    if (!this.isValidId(projectId)) return [];
    const docs = await SubjectModel.find({ projectId }).sort({ createdAt: 1 });
    return docs.map(mapSubject);
  }

  async getSubjectById(id: string): Promise<ISubject | null> {
    if (!this.isValidId(id)) return null;
    const doc = await SubjectModel.findById(id);
    return doc ? mapSubject(doc) : null;
  }

  async createSubject(projectId: string, name: string, totalMarks: number, passMarks: number): Promise<ISubject> {
    if (!this.isValidId(projectId)) throw new Error('অবৈধ প্রজেক্ট আইডি।');
    const trimmedName = name.trim();
    const existing = await SubjectModel.find({ projectId });
    const duplicate = existing.some(s => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      throw new Error('এই প্রজেক্টে এই বিষয়ের নাম ইতিমধ্যে রয়েছে।');
    }

    const doc = await SubjectModel.create({
      projectId,
      name: trimmedName,
      totalMarks: Number(totalMarks),
      passMarks: Number(passMarks)
    });
    return mapSubject(doc);
  }

  async updateSubject(id: string, name: string, totalMarks: number, passMarks: number): Promise<ISubject | null> {
    if (!this.isValidId(id)) return null;
    const subject = await SubjectModel.findById(id);
    if (!subject) return null;

    const trimmedName = name.trim();
    const others = await SubjectModel.find({ projectId: subject.projectId, _id: { $ne: id } });
    const duplicate = others.some(s => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      throw new Error('এই প্রজেক্টে এই বিষয়ের নাম ইতিমধ্যে রয়েছে।');
    }

    subject.name = trimmedName;
    subject.totalMarks = Number(totalMarks);
    subject.passMarks = Number(passMarks);
    await subject.save();
    return mapSubject(subject);
  }

  async deleteSubject(id: string): Promise<{ success: boolean; marksCount: number }> {
    if (!this.isValidId(id)) return { success: false, marksCount: 0 };
    const subject = await SubjectModel.findById(id);
    if (!subject) return { success: false, marksCount: 0 };

    const marksCount = await MarkEntryModel.countDocuments({ subjectId: id });
    await Promise.all([
      MarkEntryModel.deleteMany({ subjectId: id }),
      StudentModel.updateMany(
        { projectId: subject.projectId },
        { $pull: { subjectCodes: { subjectId: new Types.ObjectId(id) } } }
      ),
      SubjectModel.findByIdAndDelete(id)
    ]);
    return { success: true, marksCount };
  }

  // --- STUDENTS ---
  async getStudents(projectId: string): Promise<IStudent[]> {
    if (!this.isValidId(projectId)) return [];
    const docs = await StudentModel.find({ projectId }).sort({ createdAt: 1 });
    return docs.map(mapStudent);
  }

  async getStudentById(id: string): Promise<IStudent | null> {
    if (!this.isValidId(id)) return null;
    const doc = await StudentModel.findById(id);
    return doc ? mapStudent(doc) : null;
  }

  private async validateCodeUniqueness(
    projectId: string,
    subjectCodes: { subjectId: string; code: string }[],
    excludeStudentId?: string
  ): Promise<{ isUnique: boolean; duplicateCode?: string }> {
    const normalizedCodes = new Set<string>();
    for (const sc of subjectCodes) {
      const codeUpper = sc.code.trim().toUpperCase();
      if (!codeUpper) continue;
      if (normalizedCodes.has(codeUpper)) {
        return { isUnique: false, duplicateCode: sc.code.trim() };
      }
      normalizedCodes.add(codeUpper);
    }

    const query: any = { projectId };
    if (excludeStudentId && this.isValidId(excludeStudentId)) {
      query._id = { $ne: excludeStudentId };
    }
    const existingStudents = await StudentModel.find(query);
    for (const student of existingStudents) {
      for (const sc of student.subjectCodes) {
        const existingCodeUpper = sc.code.trim().toUpperCase();
        if (normalizedCodes.has(existingCodeUpper)) {
          return { isUnique: false, duplicateCode: sc.code.trim() };
        }
      }
    }

    return { isUnique: true };
  }

  async createStudent(
    projectId: string,
    name: string,
    subjectCodes: { subjectId: string; code: string }[],
    totalAttendance: number = 0
  ): Promise<IStudent> {
    if (!this.isValidId(projectId)) throw new Error('অবৈধ প্রজেক্ট আইডি।');
    const project = await ProjectModel.findById(projectId);
    if (!project) throw new Error('প্রজেক্ট পাওয়া যায়নি।');

    const attendanceNum = Number(totalAttendance ?? 0);
    if (isNaN(attendanceNum) || attendanceNum < 0) {
      throw new Error('মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।');
    }
    if (attendanceNum > project.totalWorkingDays) {
      throw new Error(`শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${project.totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`);
    }

    const cleanCodes = subjectCodes.map(sc => ({
      subjectId: sc.subjectId,
      code: sc.code.trim()
    }));

    const check = await this.validateCodeUniqueness(projectId, cleanCodes);
    if (!check.isUnique) {
      throw new Error(`কোড "${check.duplicateCode}" ইতিমধ্যে এই প্রজেক্টের অন্য কোনো শিক্ষার্থী বা বিষয়ে ব্যবহার করা হয়েছে।`);
    }

    const doc = await StudentModel.create({
      projectId,
      name: name.trim(),
      totalAttendance: attendanceNum,
      subjectCodes: cleanCodes.map(sc => ({
        subjectId: new Types.ObjectId(sc.subjectId),
        code: sc.code
      }))
    });
    return mapStudent(doc);
  }

  async updateStudent(
    id: string,
    name: string,
    subjectCodes: { subjectId: string; code: string }[],
    totalAttendance: number = 0
  ): Promise<IStudent | null> {
    if (!this.isValidId(id)) return null;
    const student = await StudentModel.findById(id);
    if (!student) return null;

    const project = await ProjectModel.findById(student.projectId);
    if (!project) throw new Error('প্রজেক্ট পাওয়া যায়নি।');

    const attendanceNum = Number(totalAttendance ?? 0);
    if (isNaN(attendanceNum) || attendanceNum < 0) {
      throw new Error('মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।');
    }
    if (attendanceNum > project.totalWorkingDays) {
      throw new Error(`শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${project.totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`);
    }

    const cleanCodes = subjectCodes.map(sc => ({
      subjectId: sc.subjectId,
      code: sc.code.trim()
    }));

    const check = await this.validateCodeUniqueness(student.projectId.toString(), cleanCodes, id);
    if (!check.isUnique) {
      throw new Error(`কোড "${check.duplicateCode}" ইতিমধ্যে এই প্রজেক্টের অন্য কোনো শিক্ষার্থী বা বিষয়ে ব্যবহার করা হয়েছে।`);
    }

    // Update kataCodes in MarkEntryModel if changed
    for (const newSc of cleanCodes) {
      const oldSc = student.subjectCodes.find(o => o.subjectId.toString() === newSc.subjectId);
      if (oldSc && oldSc.code.trim() !== newSc.code.trim()) {
        await MarkEntryModel.updateMany(
          { studentId: student._id, subjectId: new Types.ObjectId(newSc.subjectId) },
          { $set: { kataCode: newSc.code.trim() } }
        );
      }
    }

    student.name = name.trim();
    student.totalAttendance = attendanceNum;
    student.subjectCodes = cleanCodes.map(sc => ({
      subjectId: new Types.ObjectId(sc.subjectId),
      code: sc.code
    }));
    await student.save();
    return mapStudent(student);
  }

  async deleteStudent(id: string): Promise<boolean> {
    if (!this.isValidId(id)) return false;
    const deleted = await StudentModel.findByIdAndDelete(id);
    if (!deleted) return false;
    await MarkEntryModel.deleteMany({ studentId: id });
    return true;
  }

  // --- KATA CODE IDENTIFICATION ---
  async identifyKataCode(projectId: string, code: string): Promise<{
    student: IStudent;
    subject: ISubject;
    isAlreadyEntered: boolean;
    existingMark?: IMarkEntry;
  } | null> {
    if (!this.isValidId(projectId)) return null;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    const students = await StudentModel.find({ projectId });
    for (const student of students) {
      const match = student.subjectCodes.find(sc => sc.code.trim().toUpperCase() === cleanCode);
      if (match) {
        const subject = await SubjectModel.findOne({ _id: match.subjectId, projectId });
        if (subject) {
          const entries = await MarkEntryModel.find({ projectId });
          const existingMark = entries.find(m => m.kataCode.trim().toUpperCase() === cleanCode);
          return {
            student: mapStudent(student),
            subject: mapSubject(subject),
            isAlreadyEntered: !!existingMark,
            existingMark: existingMark ? mapMarkEntry(existingMark) : undefined
          };
        }
      }
    }
    return null;
  }

  // --- MARK ENTRIES ---
  async getMarkEntries(projectId: string): Promise<IMarkEntry[]> {
    if (!this.isValidId(projectId)) return [];
    const docs = await MarkEntryModel.find({ projectId }).sort({ createdAt: -1 });
    return docs.map(mapMarkEntry);
  }

  async getMarkEntryById(id: string): Promise<IMarkEntry | null> {
    if (!this.isValidId(id)) return null;
    const doc = await MarkEntryModel.findById(id);
    return doc ? mapMarkEntry(doc) : null;
  }

  async createMarkEntry(projectId: string, kataCode: string, obtainedMarks: number): Promise<IMarkEntry> {
    const cleanCode = kataCode.trim();
    const ident = await this.identifyKataCode(projectId, cleanCode);
    if (!ident) {
      throw new Error('এই কোডের কোনো শিক্ষার্থী বা বিষয় পাওয়া যায়নি।');
    }

    if (ident.isAlreadyEntered) {
      throw new Error('এই খাতার কোডের নম্বর ইতিমধ্যে এন্ট্রি করা হয়েছে।');
    }

    const marksNum = Number(obtainedMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      throw new Error('প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।');
    }

    if (marksNum > ident.subject.totalMarks) {
      throw new Error(`প্রাপ্ত নম্বর বিষয়ের পূর্ণমান (${ident.subject.totalMarks})-এর বেশি হতে পারবে না।`);
    }

    const doc = await MarkEntryModel.create({
      projectId,
      studentId: ident.student._id,
      subjectId: ident.subject._id,
      kataCode: cleanCode,
      obtainedMarks: marksNum
    });
    return mapMarkEntry(doc);
  }

  async updateMarkEntry(id: string, obtainedMarks: number): Promise<IMarkEntry | null> {
    if (!this.isValidId(id)) return null;
    const entry = await MarkEntryModel.findById(id);
    if (!entry) return null;

    const subject = await SubjectModel.findById(entry.subjectId);
    if (!subject) {
      throw new Error('সংশ্লিষ্ট বিষয় পাওয়া যায়নি।');
    }

    const marksNum = Number(obtainedMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      throw new Error('প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।');
    }

    if (marksNum > subject.totalMarks) {
      throw new Error(`প্রাপ্ত নম্বর বিষয়ের পূর্ণমান (${subject.totalMarks})-এর বেশি হতে পারবে না।`);
    }

    entry.obtainedMarks = marksNum;
    await entry.save();
    return mapMarkEntry(entry);
  }

  async deleteMarkEntry(id: string): Promise<boolean> {
    if (!this.isValidId(id)) return false;
    const deleted = await MarkEntryModel.findByIdAndDelete(id);
    return !!deleted;
  }

  async getProjectOverview(projectId: string) {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const [totalSubjects, totalStudents, totalMarkEntries] = await Promise.all([
      SubjectModel.countDocuments({ projectId }),
      StudentModel.countDocuments({ projectId }),
      MarkEntryModel.countDocuments({ projectId })
    ]);

    return {
      projectName: project.name,
      totalWorkingDays: project.totalWorkingDays,
      instituteName: project.instituteName || '',
      examName: project.examName || '',
      className: project.className || '',
      sectionName: project.sectionName || '',
      totalSubjects,
      totalStudents,
      totalMarkEntries
    };
  }
}

// ============================================================
// 2. Fallback Persistent Local JSON Database (when MongoDB daemon/URI unavailable)
// ============================================================
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

interface DatabaseData {
  projects: IProject[];
  subjects: ISubject[];
  students: IStudent[];
  markEntries: IMarkEntry[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

class JsonDatabase implements IDatabaseAdapter {
  private data: DatabaseData = {
    projects: [],
    subjects: [],
    students: [],
    markEntries: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.projects) this.data.projects = [];
        if (!this.data.subjects) this.data.subjects = [];
        if (!this.data.students) this.data.students = [];
        if (!this.data.markEntries) this.data.markEntries = [];
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database file:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database file:', err);
    }
  }

  async getProjects(): Promise<IProject[]> {
    return [...this.data.projects]
      .map(p => ({
        ...p,
        instituteName: p.instituteName || '',
        examName: p.examName || '',
        className: p.className || '',
        sectionName: p.sectionName || ''
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProjectById(id: string): Promise<IProject | null> {
    const project = this.data.projects.find(p => p._id === id);
    return project
      ? {
          ...project,
          instituteName: project.instituteName || '',
          examName: project.examName || '',
          className: project.className || '',
          sectionName: project.sectionName || ''
        }
      : null;
  }

  async createProject(name: string, totalWorkingDays: number, meta?: ProjectMetaUpdate): Promise<IProject> {
    const now = new Date().toISOString();
    const newProject: IProject = {
      _id: generateId(),
      name: name.trim(),
      totalWorkingDays: Number(totalWorkingDays),
      instituteName: (meta?.instituteName || '').trim(),
      examName: (meta?.examName || '').trim(),
      className: (meta?.className || '').trim(),
      sectionName: (meta?.sectionName || '').trim(),
      createdAt: now,
      updatedAt: now
    };
    this.data.projects.push(newProject);
    this.save();
    return newProject;
  }

  async updateProject(id: string, name: string, totalWorkingDays: number, meta?: ProjectMetaUpdate): Promise<IProject | null> {
    const index = this.data.projects.findIndex(p => p._id === id);
    if (index === -1) return null;

    const workingDays = Number(totalWorkingDays);
    const maxAttendance = this.data.students
      .filter(s => s.projectId === id)
      .reduce((max, s) => Math.max(max, Number(s.totalAttendance ?? 0)), 0);

    if (workingDays < maxAttendance) {
      throw new Error(`মোট কার্যদিবস বিদ্যমান শিক্ষার্থীর সর্বোচ্চ উপস্থিতি (${maxAttendance} দিন)-এর কম হতে পারবে না।`);
    }

    this.data.projects[index].name = name.trim();
    this.data.projects[index].totalWorkingDays = workingDays;
    if (meta) {
      if (meta.instituteName !== undefined) this.data.projects[index].instituteName = meta.instituteName.trim();
      if (meta.examName !== undefined) this.data.projects[index].examName = meta.examName.trim();
      if (meta.className !== undefined) this.data.projects[index].className = meta.className.trim();
      if (meta.sectionName !== undefined) this.data.projects[index].sectionName = meta.sectionName.trim();
    }
    this.data.projects[index].updatedAt = new Date().toISOString();
    this.save();
    return {
      ...this.data.projects[index],
      instituteName: this.data.projects[index].instituteName || '',
      examName: this.data.projects[index].examName || '',
      className: this.data.projects[index].className || '',
      sectionName: this.data.projects[index].sectionName || ''
    };
  }

  async deleteProject(id: string): Promise<boolean> {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => p._id !== id);
    this.data.subjects = this.data.subjects.filter(s => s.projectId !== id);
    this.data.students = this.data.students.filter(s => s.projectId !== id);
    this.data.markEntries = this.data.markEntries.filter(m => m.projectId !== id);
    this.save();
    return this.data.projects.length < initialLen;
  }

  async getSubjects(projectId: string): Promise<ISubject[]> {
    return this.data.subjects
      .filter(s => s.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getSubjectById(id: string): Promise<ISubject | null> {
    const sub = this.data.subjects.find(s => s._id === id);
    return sub ? { ...sub } : null;
  }

  async createSubject(projectId: string, name: string, totalMarks: number, passMarks: number): Promise<ISubject> {
    const trimmedName = name.trim();
    const exists = this.data.subjects.some(
      s => s.projectId === projectId && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      throw new Error('এই প্রজেক্টে এই বিষয়ের নাম ইতিমধ্যে রয়েছে।');
    }

    const now = new Date().toISOString();
    const newSubject: ISubject = {
      _id: generateId(),
      projectId,
      name: trimmedName,
      totalMarks: Number(totalMarks),
      passMarks: Number(passMarks),
      createdAt: now,
      updatedAt: now
    };
    this.data.subjects.push(newSubject);
    this.save();
    return newSubject;
  }

  async updateSubject(id: string, name: string, totalMarks: number, passMarks: number): Promise<ISubject | null> {
    const index = this.data.subjects.findIndex(s => s._id === id);
    if (index === -1) return null;

    const subject = this.data.subjects[index];
    const trimmedName = name.trim();

    const exists = this.data.subjects.some(
      s => s._id !== id && s.projectId === subject.projectId && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      throw new Error('এই প্রজেক্টে এই বিষয়ের নাম ইতিমধ্যে রয়েছে।');
    }

    subject.name = trimmedName;
    subject.totalMarks = Number(totalMarks);
    subject.passMarks = Number(passMarks);
    subject.updatedAt = new Date().toISOString();
    this.save();
    return { ...subject };
  }

  async deleteSubject(id: string): Promise<{ success: boolean; marksCount: number }> {
    const exists = this.data.subjects.some(s => s._id === id);
    if (!exists) {
      return { success: false, marksCount: 0 };
    }
    const marksCount = this.data.markEntries.filter(m => m.subjectId === id).length;
    this.data.markEntries = this.data.markEntries.filter(m => m.subjectId !== id);
    this.data.students.forEach(student => {
      student.subjectCodes = student.subjectCodes.filter(sc => sc.subjectId !== id);
    });
    this.data.subjects = this.data.subjects.filter(s => s._id !== id);
    this.save();
    return { success: true, marksCount };
  }

  async getStudents(projectId: string): Promise<IStudent[]> {
    return this.data.students
      .filter(s => s.projectId === projectId)
      .map(s => ({ ...s, totalAttendance: Number(s.totalAttendance ?? 0) }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getStudentById(id: string): Promise<IStudent | null> {
    const student = this.data.students.find(s => s._id === id);
    return student ? { ...student, totalAttendance: Number(student.totalAttendance ?? 0) } : null;
  }

  async validateCodeUniqueness(
    projectId: string,
    subjectCodes: { subjectId: string; code: string }[],
    excludeStudentId?: string
  ): Promise<{ isUnique: boolean; duplicateCode?: string }> {
    const normalizedCodes = new Set<string>();
    for (const sc of subjectCodes) {
      const codeUpper = sc.code.trim().toUpperCase();
      if (!codeUpper) continue;
      if (normalizedCodes.has(codeUpper)) {
        return { isUnique: false, duplicateCode: sc.code.trim() };
      }
      normalizedCodes.add(codeUpper);
    }

    const existingStudents = this.data.students.filter(
      s => s.projectId === projectId && s._id !== excludeStudentId
    );

    for (const student of existingStudents) {
      for (const sc of student.subjectCodes) {
        const existingCodeUpper = sc.code.trim().toUpperCase();
        if (normalizedCodes.has(existingCodeUpper)) {
          return { isUnique: false, duplicateCode: sc.code.trim() };
        }
      }
    }

    return { isUnique: true };
  }

  async createStudent(
    projectId: string,
    name: string,
    subjectCodes: { subjectId: string; code: string }[],
    totalAttendance: number = 0
  ): Promise<IStudent> {
    const project = this.data.projects.find(p => p._id === projectId);
    if (!project) {
      throw new Error('প্রজেক্ট পাওয়া যায়নি।');
    }

    const attendanceNum = Number(totalAttendance ?? 0);
    if (isNaN(attendanceNum) || attendanceNum < 0) {
      throw new Error('মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।');
    }
    if (attendanceNum > project.totalWorkingDays) {
      throw new Error(`শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${project.totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`);
    }

    const trimmedName = name.trim();
    const cleanCodes = subjectCodes.map(sc => ({
      subjectId: sc.subjectId,
      code: sc.code.trim()
    }));

    const check = await this.validateCodeUniqueness(projectId, cleanCodes);
    if (!check.isUnique) {
      throw new Error(`কোড "${check.duplicateCode}" ইতিমধ্যে এই প্রজেক্টের অন্য কোনো শিক্ষার্থী বা বিষয়ে ব্যবহার করা হয়েছে।`);
    }

    const now = new Date().toISOString();
    const newStudent: IStudent = {
      _id: generateId(),
      projectId,
      name: trimmedName,
      totalAttendance: attendanceNum,
      subjectCodes: cleanCodes,
      createdAt: now,
      updatedAt: now
    };

    this.data.students.push(newStudent);
    this.save();
    return newStudent;
  }

  async updateStudent(
    id: string,
    name: string,
    subjectCodes: { subjectId: string; code: string }[],
    totalAttendance: number = 0
  ): Promise<IStudent | null> {
    const index = this.data.students.findIndex(s => s._id === id);
    if (index === -1) return null;

    const student = this.data.students[index];
    const project = this.data.projects.find(p => p._id === student.projectId);
    if (!project) {
      throw new Error('প্রজেক্ট পাওয়া যায়নি।');
    }

    const attendanceNum = Number(totalAttendance ?? 0);
    if (isNaN(attendanceNum) || attendanceNum < 0) {
      throw new Error('মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।');
    }
    if (attendanceNum > project.totalWorkingDays) {
      throw new Error(`শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${project.totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`);
    }

    const cleanCodes = subjectCodes.map(sc => ({
      subjectId: sc.subjectId,
      code: sc.code.trim()
    }));

    const check = await this.validateCodeUniqueness(student.projectId, cleanCodes, id);
    if (!check.isUnique) {
      throw new Error(`কোড "${check.duplicateCode}" ইতিমধ্যে এই প্রজেক্টের অন্য কোনো শিক্ষার্থী বা বিষয়ে ব্যবহার করা হয়েছে।`);
    }

    student.name = name.trim();
    student.totalAttendance = attendanceNum;
    for (const newSc of cleanCodes) {
      const oldSc = student.subjectCodes.find(o => o.subjectId === newSc.subjectId);
      if (oldSc && oldSc.code.trim() !== newSc.code.trim()) {
        const mark = this.data.markEntries.find(
          m => m.studentId === id && m.subjectId === newSc.subjectId
        );
        if (mark) {
          mark.kataCode = newSc.code.trim();
          mark.updatedAt = new Date().toISOString();
        }
      }
    }

    student.subjectCodes = cleanCodes;
    student.updatedAt = new Date().toISOString();
    this.save();
    return { ...student };
  }

  async deleteStudent(id: string): Promise<boolean> {
    const initialLen = this.data.students.length;
    this.data.students = this.data.students.filter(s => s._id !== id);
    this.data.markEntries = this.data.markEntries.filter(m => m.studentId !== id);
    this.save();
    return this.data.students.length < initialLen;
  }

  async identifyKataCode(projectId: string, code: string): Promise<{
    student: IStudent;
    subject: ISubject;
    isAlreadyEntered: boolean;
    existingMark?: IMarkEntry;
  } | null> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;

    const students = this.data.students.filter(s => s.projectId === projectId);
    for (const student of students) {
      const match = student.subjectCodes.find(sc => sc.code.trim().toUpperCase() === cleanCode);
      if (match) {
        const subject = this.data.subjects.find(s => s._id === match.subjectId && s.projectId === projectId);
        if (subject) {
          const existingMark = this.data.markEntries.find(
            m => m.projectId === projectId && m.kataCode.trim().toUpperCase() === cleanCode
          );
          return {
            student: { ...student, totalAttendance: Number(student.totalAttendance ?? 0) },
            subject: { ...subject },
            isAlreadyEntered: !!existingMark,
            existingMark: existingMark ? { ...existingMark } : undefined
          };
        }
      }
    }
    return null;
  }

  async getMarkEntries(projectId: string): Promise<IMarkEntry[]> {
    return this.data.markEntries
      .filter(m => m.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMarkEntryById(id: string): Promise<IMarkEntry | null> {
    const mark = this.data.markEntries.find(m => m._id === id);
    return mark ? { ...mark } : null;
  }

  async createMarkEntry(projectId: string, kataCode: string, obtainedMarks: number): Promise<IMarkEntry> {
    const cleanCode = kataCode.trim();
    const ident = await this.identifyKataCode(projectId, cleanCode);
    if (!ident) {
      throw new Error('এই কোডের কোনো শিক্ষার্থী বা বিষয় পাওয়া যায়নি।');
    }

    if (ident.isAlreadyEntered) {
      throw new Error('এই খাতার কোডের নম্বর ইতিমধ্যে এন্ট্রি করা হয়েছে।');
    }

    const marksNum = Number(obtainedMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      throw new Error('প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।');
    }

    if (marksNum > ident.subject.totalMarks) {
      throw new Error(`প্রাপ্ত নম্বর বিষয়ের পূর্ণমান (${ident.subject.totalMarks})-এর বেশি হতে পারবে না।`);
    }

    const now = new Date().toISOString();
    const newEntry: IMarkEntry = {
      _id: generateId(),
      projectId,
      studentId: ident.student._id,
      subjectId: ident.subject._id,
      kataCode: cleanCode,
      obtainedMarks: marksNum,
      createdAt: now,
      updatedAt: now
    };

    this.data.markEntries.push(newEntry);
    this.save();
    return newEntry;
  }

  async updateMarkEntry(id: string, obtainedMarks: number): Promise<IMarkEntry | null> {
    const index = this.data.markEntries.findIndex(m => m._id === id);
    if (index === -1) return null;

    const entry = this.data.markEntries[index];
    const subject = this.data.subjects.find(s => s._id === entry.subjectId);
    if (!subject) {
      throw new Error('সংশ্লিষ্ট বিষয় পাওয়া যায়নি।');
    }

    const marksNum = Number(obtainedMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      throw new Error('প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।');
    }

    if (marksNum > subject.totalMarks) {
      throw new Error(`প্রাপ্ত নম্বর বিষয়ের পূর্ণমান (${subject.totalMarks})-এর বেশি হতে পারবে না।`);
    }

    entry.obtainedMarks = marksNum;
    entry.updatedAt = new Date().toISOString();
    this.save();
    return { ...entry };
  }

  async deleteMarkEntry(id: string): Promise<boolean> {
    const initialLen = this.data.markEntries.length;
    this.data.markEntries = this.data.markEntries.filter(m => m._id !== id);
    this.save();
    return this.data.markEntries.length < initialLen;
  }

  async getProjectOverview(projectId: string) {
    const project = await this.getProjectById(projectId);
    if (!project) return null;

    const totalSubjects = this.data.subjects.filter(s => s.projectId === projectId).length;
    const totalStudents = this.data.students.filter(s => s.projectId === projectId).length;
    const totalMarkEntries = this.data.markEntries.filter(m => m.projectId === projectId).length;

    return {
      projectName: project.name,
      totalWorkingDays: project.totalWorkingDays,
      instituteName: project.instituteName || '',
      examName: project.examName || '',
      className: project.className || '',
      sectionName: project.sectionName || '',
      totalSubjects,
      totalStudents,
      totalMarkEntries
    };
  }
}

// ============================================================
// Database Connection Manager (MongoDB via Mongoose + Fallback)
// ============================================================
let activeDatabase: IDatabaseAdapter = new JsonDatabase();
let activeDriver: 'mongodb' | 'json-fallback' = 'json-fallback';

export async function connectDatabase(): Promise<void> {
  const configuredUri = process.env.MONGODB_URI?.trim();
  const targetUri = configuredUri || 'mongodb://127.0.0.1:27017/exam_result_system';

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: configuredUri ? 5000 : 1500
    });
    activeDatabase = new MongoDatabase();
    activeDriver = 'mongodb';
    console.log('Connected to MongoDB via Mongoose.');
  } catch (err: any) {
    if (configuredUri) {
      console.warn(`MongoDB connection failed for MONGODB_URI (${err?.message || err}). Falling back to local JSON persistence.`);
    } else {
      console.log('MONGODB_URI not set and no local MongoDB daemon detected. Using local JSON persistence fallback.');
    }
    activeDatabase = new JsonDatabase();
    activeDriver = 'json-fallback';
  }
}

export function getDatabaseStatus(): 'mongodb' | 'json-fallback' {
  return activeDriver;
}

export const db: IDatabaseAdapter = new Proxy({} as IDatabaseAdapter, {
  get(_target, prop: keyof IDatabaseAdapter) {
    const value = activeDatabase[prop];
    return typeof value === 'function' ? value.bind(activeDatabase) : value;
  }
});

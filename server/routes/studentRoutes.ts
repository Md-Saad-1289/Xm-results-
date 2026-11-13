import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router({ mergeParams: true });

// GET all students for project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { search } = req.query;
    let students = await db.getStudents(projectId);

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      students = students.filter(s => s.name.toLowerCase().includes(q));
    }

    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'শিক্ষার্থী তালিকা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// GET single student
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const student = await db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'শিক্ষার্থী পাওয়া যায়নি।' });
    }
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'শিক্ষার্থীর তথ্য লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// POST create student
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, subjectCodes, totalAttendance } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'শিক্ষার্থীর নাম অবশ্যই দিতে হবে।' });
    }

    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'প্রজেক্ট পাওয়া যায়নি।' });
    }

    const attendanceNum =
      totalAttendance === undefined || totalAttendance === null || totalAttendance === ''
        ? 0
        : Number(totalAttendance);
    if (isNaN(attendanceNum) || attendanceNum < 0) {
      return res.status(400).json({ error: 'মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।' });
    }

    if (attendanceNum > project.totalWorkingDays) {
      return res.status(400).json({
        error: `শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${project.totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`
      });
    }

    const currentSubjects = await db.getSubjects(projectId);
    if (currentSubjects.length === 0) {
      return res.status(400).json({ error: 'শিক্ষার্থী যোগ করার আগে অন্তত একটি বিষয় যোগ করুন।' });
    }

    if (!Array.isArray(subjectCodes)) {
      return res.status(400).json({ error: 'প্রতিটি বিষয়ের খাতার কোড প্রদান করতে হবে।' });
    }

    // Verify all subjects have codes provided
    for (const sub of currentSubjects) {
      const found = subjectCodes.find((sc: any) => sc.subjectId === sub._id && sc.code && sc.code.trim());
      if (!found) {
        return res.status(400).json({ error: `"${sub.name}" বিষয়ের খাতার কোড দেওয়া আবশ্যক।` });
      }
    }

    const newStudent = await db.createStudent(projectId, name, subjectCodes, attendanceNum);
    res.status(201).json(newStudent);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'শিক্ষার্থী তৈরি করতে ব্যর্থ হয়েছে।' });
  }
});

// PUT update student
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { projectId, id } = req.params;
    const { name, subjectCodes, totalAttendance } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'শিক্ষার্থীর নাম অবশ্যই দিতে হবে।' });
    }

    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'প্রজেক্ট পাওয়া যায়নি।' });
    }

    const attendanceNum =
      totalAttendance === undefined || totalAttendance === null || totalAttendance === ''
        ? 0
        : Number(totalAttendance);
    if (isNaN(attendanceNum) || attendanceNum < 0) {
      return res.status(400).json({ error: 'মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।' });
    }

    if (attendanceNum > project.totalWorkingDays) {
      return res.status(400).json({
        error: `শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${project.totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`
      });
    }

    if (!Array.isArray(subjectCodes)) {
      return res.status(400).json({ error: 'প্রতিটি বিষয়ের খাতার কোড প্রদান করতে হবে।' });
    }

    // Check all codes provided are non-empty
    for (const sc of subjectCodes) {
      if (!sc.code || !sc.code.trim()) {
        return res.status(400).json({ error: 'সব বিষয়ের খাতার কোড পূরণ করতে হবে।' });
      }
    }

    const updated = await db.updateStudent(id, name, subjectCodes, attendanceNum);
    if (!updated) {
      return res.status(404).json({ error: 'শিক্ষার্থী পাওয়া যায়নি।' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'শিক্ষার্থীর তথ্য আপডেট করতে ব্যর্থ হয়েছে।' });
  }
});

// DELETE student
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.deleteStudent(id);
    if (!success) {
      return res.status(404).json({ error: 'শিক্ষার্থী পাওয়া যায়নি।' });
    }
    res.json({ message: 'শিক্ষার্থী এবং সংশ্লিষ্ট নম্বর এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'শিক্ষার্থী মুছতে ব্যর্থ হয়েছে।' });
  }
});

export default router;

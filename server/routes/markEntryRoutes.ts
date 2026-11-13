import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router({ mergeParams: true });

// GET all mark entries for project (enriched with student and subject names)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const entries = await db.getMarkEntries(projectId);
    const students = await db.getStudents(projectId);
    const subjects = await db.getSubjects(projectId);

    const studentMap = new Map(students.map(s => [s._id, s.name]));
    const subjectMap = new Map(subjects.map(s => [s._id, { name: s.name, totalMarks: s.totalMarks, passMarks: s.passMarks }]));

    const enriched = entries.map(entry => {
      const sub = subjectMap.get(entry.subjectId);
      return {
        ...entry,
        studentName: studentMap.get(entry.studentId) || 'অজানা শিক্ষার্থী',
        subjectName: sub ? sub.name : 'অজানা বিষয়',
        totalMarks: sub ? sub.totalMarks : 0,
        passMarks: sub ? sub.passMarks : 0
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'নম্বর এন্ট্রি তালিকা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// GET identify kata code automatically (Verification endpoint)
router.get('/identify', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { code } = req.query;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'খাতার কোড প্রদান করুন।' });
    }

    const ident = await db.identifyKataCode(projectId, code.trim());
    if (!ident) {
      return res.status(404).json({ error: 'এই কোডের কোনো শিক্ষার্থী বা বিষয় পাওয়া যায়নি।' });
    }

    res.json({
      studentId: ident.student._id,
      studentName: ident.student.name,
      subjectId: ident.subject._id,
      subjectName: ident.subject.name,
      totalMarks: ident.subject.totalMarks,
      passMarks: ident.subject.passMarks,
      isAlreadyEntered: ident.isAlreadyEntered,
      existingMark: ident.existingMark
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'কোড যাচাই করতে সমস্যা হয়েছে।' });
  }
});

// POST create mark entry (Only kataCode and obtainedMarks allowed!)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { kataCode, obtainedMarks } = req.body;

    if (!kataCode || typeof kataCode !== 'string' || !kataCode.trim()) {
      return res.status(400).json({ error: 'খাতার কোড অবশ্যই দিতে হবে।' });
    }

    if (obtainedMarks === undefined || obtainedMarks === null || obtainedMarks === '') {
      return res.status(400).json({ error: 'প্রাপ্ত নম্বর অবশ্যই দিতে হবে।' });
    }

    const marksNum = Number(obtainedMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({ error: 'প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।' });
    }

    const newEntry = await db.createMarkEntry(projectId, kataCode, marksNum);
    
    // Enrich response with student and subject name
    const student = await db.getStudentById(newEntry.studentId);
    const subject = await db.getSubjectById(newEntry.subjectId);

    res.status(201).json({
      ...newEntry,
      studentName: student?.name || '',
      subjectName: subject?.name || '',
      totalMarks: subject?.totalMarks || 0,
      passMarks: subject?.passMarks || 0
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'নম্বর সংরক্ষণ করতে ব্যর্থ হয়েছে।' });
  }
});

// PUT update mark entry (obtainedMarks)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { obtainedMarks } = req.body;

    if (obtainedMarks === undefined || obtainedMarks === null || obtainedMarks === '') {
      return res.status(400).json({ error: 'প্রাপ্ত নম্বর অবশ্যই দিতে হবে।' });
    }

    const marksNum = Number(obtainedMarks);
    if (isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({ error: 'প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।' });
    }

    const updated = await db.updateMarkEntry(id, marksNum);
    if (!updated) {
      return res.status(404).json({ error: 'নম্বর এন্ট্রি পাওয়া যায়নি।' });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'নম্বর আপডেট করতে ব্যর্থ হয়েছে।' });
  }
});

// DELETE mark entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.deleteMarkEntry(id);
    if (!success) {
      return res.status(404).json({ error: 'নম্বর এন্ট্রি পাওয়া যায়নি।' });
    }
    res.json({ message: 'নম্বর এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'নম্বর মুছতে সমস্যা হয়েছে।' });
  }
});

export default router;

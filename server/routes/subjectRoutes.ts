import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router({ mergeParams: true });

// GET all subjects for a project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const subjects = await db.getSubjects(projectId);
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'বিষয় তালিকা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// POST create subject
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, totalMarks, passMarks } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'বিষয়ের নাম অবশ্যই দিতে হবে।' });
    }

    const tMarks = Number(totalMarks);
    if (isNaN(tMarks) || tMarks <= 0) {
      return res.status(400).json({ error: 'পূর্ণমান অবশ্যই ০-এর বেশি হতে হবে।' });
    }

    const pMarks = Number(passMarks);
    if (isNaN(pMarks) || pMarks < 0) {
      return res.status(400).json({ error: 'পাস নম্বর শূন্য বা তার বেশি হতে পারবে।' });
    }

    if (pMarks > tMarks) {
      return res.status(400).json({ error: 'পাস নম্বর কখনো পূর্ণমান (Total Marks)-এর বেশি হতে পারবে না।' });
    }

    const newSubject = await db.createSubject(projectId, name, tMarks, pMarks);
    res.status(201).json(newSubject);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'বিষয় যোগ করতে ব্যর্থ হয়েছে।' });
  }
});

// PUT update subject
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, totalMarks, passMarks } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'বিষয়ের নাম অবশ্যই দিতে হবে।' });
    }

    const tMarks = Number(totalMarks);
    if (isNaN(tMarks) || tMarks <= 0) {
      return res.status(400).json({ error: 'পূর্ণমান অবশ্যই ০-এর বেশি হতে হবে।' });
    }

    const pMarks = Number(passMarks);
    if (isNaN(pMarks) || pMarks < 0) {
      return res.status(400).json({ error: 'পাস নম্বর শূন্য বা তার বেশি হতে পারবে।' });
    }

    if (pMarks > tMarks) {
      return res.status(400).json({ error: 'পাস নম্বর কখনো পূর্ণমান (Total Marks)-এর বেশি হতে পারবে না।' });
    }

    const updated = await db.updateSubject(id, name, tMarks, pMarks);
    if (!updated) {
      return res.status(404).json({ error: 'বিষয়টি পাওয়া যায়নি।' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'বিষয় আপডেট করতে ব্যর্থ হয়েছে।' });
  }
});

// DELETE subject
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.deleteSubject(id);
    if (!result.success) {
      return res.status(404).json({ error: 'বিষয়টি পাওয়া যায়নি।' });
    }
    res.json({
      message: 'বিষয় সফলভাবে মুছে ফেলা হয়েছে।',
      marksRemoved: result.marksCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'বিষয় মুছতে সমস্যা হয়েছে।' });
  }
});

export default router;

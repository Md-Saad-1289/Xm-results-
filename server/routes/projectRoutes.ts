import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET all projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await db.getProjects();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'প্রজেক্ট তালিকা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// GET single project
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'প্রজেক্টটি পাওয়া যায়নি।' });
    }
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'প্রজেক্ট লোড করতে সমস্যা হয়েছে।' });
  }
});

// GET project overview
router.get('/:id/overview', async (req: Request, res: Response) => {
  try {
    const overview = await db.getProjectOverview(req.params.id);
    if (!overview) {
      return res.status(404).json({ error: 'প্রজেক্টটি পাওয়া যায়নি।' });
    }
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'সারসংক্ষেপ লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// POST create project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, totalWorkingDays, instituteName, examName, className, sectionName } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'প্রজেক্টের নাম অবশ্যই পূরণ করতে হবে।' });
    }

    const workingDays = Number(totalWorkingDays);
    if (isNaN(workingDays) || workingDays < 0) {
      return res.status(400).json({ error: 'মোট কার্যদিবস শূন্য বা তার বেশি হতে হবে।' });
    }

    const newProject = await db.createProject(name, workingDays, {
      instituteName,
      examName,
      className,
      sectionName
    });
    res.status(201).json(newProject);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'প্রজেক্ট তৈরি করতে ব্যর্থ হয়েছে।' });
  }
});

// PUT update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, totalWorkingDays, instituteName, examName, className, sectionName } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'প্রজেক্টের নাম অবশ্যই পূরণ করতে হবে।' });
    }

    const workingDays = Number(totalWorkingDays);
    if (isNaN(workingDays) || workingDays < 0) {
      return res.status(400).json({ error: 'মোট কার্যদিবস শূন্য বা তার বেশি হতে হবে।' });
    }

    const updated = await db.updateProject(req.params.id, name, workingDays, {
      instituteName,
      examName,
      className,
      sectionName
    });
    if (!updated) {
      return res.status(404).json({ error: 'প্রজেক্টটি পাওয়া যায়নি।' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'প্রজেক্ট আপডেট করতে ব্যর্থ হয়েছে।' });
  }
});

// DELETE project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteProject(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'প্রজেক্টটি পাওয়া যায়নি।' });
    }
    res.json({ message: 'প্রজেক্ট সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'প্রজেক্ট মুছতে ব্যর্থ হয়েছে।' });
  }
});

export default router;

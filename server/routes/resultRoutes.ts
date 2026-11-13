import { Router, Request, Response } from 'express';
import { db } from '../db';
import { calculateAndRankProjectResults } from '../grading';

const router = Router({ mergeParams: true });

// GET all results for project
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { search } = req.query;

    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'প্রজেক্ট পাওয়া যায়নি।' });
    }

    const allStudents = await db.getStudents(projectId);
    const subjects = await db.getSubjects(projectId);
    const markEntries = await db.getMarkEntries(projectId);

    // Calculate and rank all students in the project
    let results = calculateAndRankProjectResults(allStudents, subjects, markEntries);

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(r => r.studentName.toLowerCase().includes(q));
    }

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        totalWorkingDays: project.totalWorkingDays,
        instituteName: project.instituteName || '',
        examName: project.examName || '',
        className: project.className || '',
        sectionName: project.sectionName || ''
      },
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'ফলাফল লোড করতে সমস্যা হয়েছে।' });
  }
});

// GET individual marksheet for a student
router.get('/:studentId/marksheet', async (req: Request, res: Response) => {
  try {
    const { projectId, studentId } = req.params;

    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'প্রজেক্ট পাওয়া যায়নি।' });
    }

    const allStudents = await db.getStudents(projectId);
    const student = allStudents.find(s => s._id === studentId);
    if (!student || student.projectId !== projectId) {
      return res.status(404).json({ error: 'শিক্ষার্থী পাওয়া যায়নি।' });
    }

    const subjects = await db.getSubjects(projectId);
    const markEntries = await db.getMarkEntries(projectId);

    // Calculate and rank all students so this student gets their exact project-wide merit position
    const allResults = calculateAndRankProjectResults(allStudents, subjects, markEntries);
    const result = allResults.find(r => r.studentId === studentId);

    if (!result) {
      return res.status(404).json({ error: 'ফলাফল পাওয়া যায়নি।' });
    }

    res.json({
      projectName: project.name,
      totalWorkingDays: project.totalWorkingDays,
      instituteName: project.instituteName || '',
      examName: project.examName || '',
      className: project.className || '',
      sectionName: project.sectionName || '',
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'মার্কশিট লোড করতে সমস্যা হয়েছে।' });
  }
});

export default router;

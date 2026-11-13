import React, { useState, useEffect, useCallback } from 'react';
import { Project, Subject, Student, MarkEntry, ProjectOverview, StudentResult } from '../types';
import { api } from '../services/api';
import { OverviewTab } from './workspace/OverviewTab';
import { SubjectsTab } from './workspace/SubjectsTab';
import { StudentsTab } from './workspace/StudentsTab';
import { MarkEntryTab } from './workspace/MarkEntryTab';
import { ResultsTab } from './workspace/ResultsTab';
import { LayoutDashboard, BookOpen, Users, FileCheck2, Award, ArrowLeft } from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  onBackToDashboard: () => void;
  onUpdateProject: (
    id: string,
    name: string,
    totalWorkingDays: number,
    meta?: { instituteName?: string; examName?: string; className?: string; sectionName?: string }
  ) => Promise<void>;
}

type WorkspaceTab = 'overview' | 'subjects' | 'students' | 'mark-entry' | 'results';

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBackToDashboard,
  onUpdateProject
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [overview, setOverview] = useState<ProjectOverview | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all project data
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [ovData, subsData, stusData, marksData, resData] = await Promise.all([
        api.getProjectOverview(project._id),
        api.getSubjects(project._id),
        api.getStudents(project._id),
        api.getMarkEntries(project._id),
        api.getResults(project._id)
      ]);

      setOverview(ovData);
      setSubjects(subsData);
      setStudents(stusData);
      setMarkEntries(marksData);
      setResults(resData.results);
    } catch (err) {
      console.error('Error loading project data:', err);
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Subject Actions
  const handleAddSubject = async (name: string, totalMarks: number, passMarks: number) => {
    await api.createSubject(project._id, name, totalMarks, passMarks);
    await loadProjectData();
  };

  const handleUpdateSubject = async (id: string, name: string, totalMarks: number, passMarks: number) => {
    await api.updateSubject(project._id, id, name, totalMarks, passMarks);
    await loadProjectData();
  };

  const handleDeleteSubject = async (id: string) => {
    await api.deleteSubject(project._id, id);
    await loadProjectData();
  };

  // Project Overview Update Action
  const handleUpdateProjectDetails = async (
    name: string,
    totalWorkingDays: number,
    meta?: { instituteName?: string; examName?: string; className?: string; sectionName?: string }
  ) => {
    await onUpdateProject(project._id, name, totalWorkingDays, meta);
    await loadProjectData();
  };

  // Student Actions
  const handleAddStudent = async (name: string, subjectCodes: { subjectId: string; code: string }[], totalAttendance: number) => {
    await api.createStudent(project._id, name, subjectCodes, totalAttendance);
    await loadProjectData();
  };

  const handleUpdateStudent = async (id: string, name: string, subjectCodes: { subjectId: string; code: string }[], totalAttendance: number) => {
    await api.updateStudent(project._id, id, name, subjectCodes, totalAttendance);
    await loadProjectData();
  };

  const handleDeleteStudent = async (id: string) => {
    await api.deleteStudent(project._id, id);
    await loadProjectData();
  };

  const navItems = [
    { id: 'overview' as const, label: 'সারসংক্ষেপ', icon: LayoutDashboard },
    { id: 'subjects' as const, label: 'বিষয়সমূহ', icon: BookOpen, count: subjects.length },
    { id: 'students' as const, label: 'শিক্ষার্থীবৃন্দ', icon: Users, count: students.length },
    { id: 'mark-entry' as const, label: 'নম্বর এন্ট্রি', icon: FileCheck2, count: markEntries.length },
    { id: 'results' as const, label: 'ফলাফল', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100">
      {/* Workspace Top Header Bar - Optimized for PC & Mobile */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onBackToDashboard}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
              title="সব প্রজেক্ট তালিকায় ফিরুন"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">সব প্রজেক্ট</span>
            </button>
            <div className="h-4 w-px bg-slate-200 shrink-0"></div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {project.name}
              </h1>
              <span className="text-[11px] sm:text-xs text-slate-500 font-mono-numbers block truncate">
                মোট কার্যদিবস: {project.totalWorkingDays} দিন
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area: Desktop Sidebar + Viewport */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex-1 flex flex-col md:flex-row gap-5 pb-24 md:pb-8">
        {/* Desktop Sidebar (visible on md and larger) */}
        <aside className="hidden md:block w-56 lg:w-60 shrink-0">
          <div className="bg-white border border-slate-200 rounded-xl p-2 sticky top-20 shadow-xs space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-xs font-mono-numbers px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              overview={overview}
              loading={loading}
              onUpdateProject={handleUpdateProjectDetails}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsTab
              subjects={subjects}
              loading={loading}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          )}

          {activeTab === 'students' && (
            <StudentsTab
              students={students}
              subjects={subjects}
              totalWorkingDays={project.totalWorkingDays}
              loading={loading}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {activeTab === 'mark-entry' && (
            <MarkEntryTab
              projectId={project._id}
              entries={markEntries}
              loading={loading}
              onRefresh={loadProjectData}
            />
          )}

          {activeTab === 'results' && (
            <ResultsTab
              project={project}
              subjects={subjects}
              results={results}
              loading={loading}
              onRefresh={loadProjectData}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar - Ergonomic Thumb Zone (Pattern 1) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-1 pb-safe">
        <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                type="button"
                className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
                  isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-blue-600' : 'stroke-[1.8px]'}`} />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1 -right-2 bg-slate-900 text-white text-[9px] font-mono-numbers px-1 py-0.2 rounded-full min-w-[14px] text-center">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-1 line-clamp-1 ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

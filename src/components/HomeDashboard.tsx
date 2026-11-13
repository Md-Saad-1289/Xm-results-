import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, FolderOpen, Calendar, ArrowRight, Trash2, Edit2, X } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface HomeDashboardProps {
  projects: Project[];
  loading: boolean;
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, totalWorkingDays: number) => Promise<void>;
  onUpdateProject: (id: string, name: string, totalWorkingDays: number) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  projects,
  loading,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setTotalWorkingDays('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setName(project.name);
    setTotalWorkingDays(project.totalWorkingDays);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('প্রজেক্টের নাম অবশ্যই দিতে হবে।');
      return;
    }

    if (totalWorkingDays === '' || isNaN(Number(totalWorkingDays)) || Number(totalWorkingDays) < 0) {
      setFormError('মোট কার্যদিবস শূন্য বা তার বেশি হতে হবে।');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingProject) {
        await onUpdateProject(editingProject._id, name.trim(), Number(totalWorkingDays));
      } else {
        await onCreateProject(name.trim(), Number(totalWorkingDays));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || (editingProject ? 'প্রজেক্ট আপডেট করতে ব্যর্থ হয়েছে।' : 'প্রজেক্ট তৈরি করতে ব্যর্থ হয়েছে।'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await onDeleteProject(deleteId);
      } finally {
        setIsConfirmOpen(false);
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
              পরীক্ষা নম্বর ও ফলাফল ব্যবস্থাপনা পদ্ধতি
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl sm:rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span> নতুন প্রজেক্ট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 sm:h-44 bg-white border border-slate-200 rounded-xl p-5 animate-pulse"></div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty State strictly as required */
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 sm:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              এখনো কোনো প্রজেক্ট তৈরি করা হয়নি
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
              পরীক্ষার নম্বর ও ফলাফল ব্যবস্থাপনার জন্য একটি নতুন প্রজেক্ট তৈরি করুন।
            </p>
            <button
              onClick={openCreateModal}
              type="button"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span> নতুন প্রজেক্ট</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">পূর্ববর্তী প্রজেক্টসমূহ</h2>
                <p className="text-xs text-slate-500 mt-0.5">সব সংরক্ষিত পরীক্ষার প্রজেক্ট তালিকা</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => onSelectProject(project)}
                  className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 pt-0.5">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => openEditModal(e, project)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-md transition-all cursor-pointer"
                          title="প্রজেক্ট সম্পাদনা করুন"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, project._id)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-md transition-all cursor-pointer"
                          title="প্রজেক্ট মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>মোট কার্যদিবস:</span>
                      <span className="font-semibold font-mono-numbers text-slate-800">
                        {project.totalWorkingDays} দিন
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      আইডি: <span className="font-mono-numbers">{project._id.substring(0, 6)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-slate-900 bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>প্রজেক্ট খুলুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal (ONLY 2 Input Fields: Project Name, Total Working Days) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 sm:border-0 sm:pb-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProject ? 'প্রজেক্ট সম্পাদনা করুন' : 'নতুন প্রজেক্ট তৈরি করুন'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">প্রজেক্টের নাম ও মোট কার্যদিবস প্রদান করুন।</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* Field 1: Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রজেক্টের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: অর্ধ-বার্ষিক পরীক্ষা ২০২৬"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
                  autoFocus
                />
              </div>

              {/* Field 2: Total Working Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোট কার্যদিবস (Total Working Days) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={totalWorkingDays}
                  onChange={(e) => setTotalWorkingDays(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="যেমন: ১২০"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers min-h-[44px]"
                />
              </div>

              {/* Buttons: তৈরি করুন / বাতিল */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting
                    ? editingProject
                      ? 'আপডেট হচ্ছে...'
                      : 'তৈরি হচ্ছে...'
                    : editingProject
                    ? 'আপডেট করুন'
                    : 'তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="প্রজেক্ট মুছে ফেলতে চান?"
        message="এই প্রজেক্টটি মুছে ফেললে এর আওতাধীন সকল বিষয়, শিক্ষার্থী, খাতার কোড এবং নম্বর এন্ট্রি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        cancelLabel="না, বাতিল"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ProjectOverview } from '../../types';
import { BookOpen, Users, FileCheck2, Calendar, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface OverviewTabProps {
  overview: ProjectOverview | null;
  loading: boolean;
  onUpdateProject: (
    name: string,
    totalWorkingDays: number,
    meta?: { instituteName?: string; examName?: string; className?: string; sectionName?: string }
  ) => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  loading,
  onUpdateProject
}) => {
  const [name, setName] = useState('');
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | ''>('');
  const [instituteName, setInstituteName] = useState('');
  const [examName, setExamName] = useState('');
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (overview) {
      setName(overview.projectName);
      setTotalWorkingDays(overview.totalWorkingDays);
      setInstituteName(overview.instituteName || '');
      setExamName(overview.examName || '');
      setClassName(overview.className || '');
      setSectionName(overview.sectionName || '');
    }
  }, [overview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

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
      await onUpdateProject(name.trim(), Number(totalWorkingDays), {
        instituteName: instituteName.trim(),
        examName: examName.trim(),
        className: className.trim(),
        sectionName: sectionName.trim()
      });
      setSuccessMessage('প্রজেক্টের তথ্য সফলভাবে আপডেট হয়েছে!');
    } catch (err: any) {
      setFormError(err.message || 'প্রজেক্টের তথ্য আপডেট করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-7 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 sm:h-28 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">{overview.projectName}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">প্রজেক্ট সারসংক্ষেপ ও বর্তমান অগ্রগতি</p>
      </div>

      {/* 4 Essential Metrics Cards: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Working Days */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block truncate">মোট কার্যদিবস</span>
            <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-slate-900 mt-0.5 block">
              {overview.totalWorkingDays} <span className="text-[10px] sm:text-xs font-normal text-slate-500">দিন</span>
            </span>
          </div>
        </div>

        {/* Total Subjects */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block truncate">মোট বিষয়</span>
            <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-slate-900 mt-0.5 block">
              {overview.totalSubjects}
            </span>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block truncate">মোট শিক্ষার্থী</span>
            <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-slate-900 mt-0.5 block">
              {overview.totalStudents}
            </span>
          </div>
        </div>

        {/* Total Mark Entries */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 block truncate">মোট নম্বর এন্ট্রি</span>
            <span className="text-xl sm:text-2xl font-bold font-mono-numbers text-slate-900 mt-0.5 block">
              {overview.totalMarkEntries}
            </span>
          </div>
        </div>
      </div>

      {/* Project Information Update Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">প্রজেক্টের তথ্য আপডেট করুন</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            প্রজেক্টের নাম, কার্যদিবস এবং ফলাফল শিট/পিডিএফের জন্য প্রতিষ্ঠান, পরীক্ষা, শ্রেণি ও শাখার তথ্য আপডেট করুন।
          </p>
        </div>

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {formError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রজেক্টের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSuccessMessage(null);
                }}
                placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোট কার্যদিবস (Total Working Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={totalWorkingDays}
                onChange={(e) => {
                  setTotalWorkingDays(e.target.value === '' ? '' : Number(e.target.value));
                  setSuccessMessage(null);
                }}
                placeholder="যেমন: ১০০"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রতিষ্ঠানের নাম (Institute Name)
              </label>
              <input
                type="text"
                value={instituteName}
                onChange={(e) => {
                  setInstituteName(e.target.value);
                  setSuccessMessage(null);
                }}
                placeholder="যেমন: গ্রিনফিল্ড মডেল স্কুল"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরীক্ষার নাম (Exam Name)
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => {
                  setExamName(e.target.value);
                  setSuccessMessage(null);
                }}
                placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                শ্রেণি (Class)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setSuccessMessage(null);
                }}
                placeholder="যেমন: ষষ্ঠ"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                শাখার নাম (Section Name)
              </label>
              <input
                type="text"
                value={sectionName}
                onChange={(e) => {
                  setSectionName(e.target.value);
                  setSuccessMessage(null);
                }}
                placeholder="যেমন: ক (A)"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

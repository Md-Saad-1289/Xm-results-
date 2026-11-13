import React, { useState } from 'react';
import { Student, Subject } from '../../types';
import { Plus, Edit2, Trash2, Search, Users, AlertCircle, X } from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';

interface StudentsTabProps {
  students: Student[];
  subjects: Subject[];
  totalWorkingDays: number;
  loading: boolean;
  onAddStudent: (name: string, subjectCodes: { subjectId: string; code: string }[], totalAttendance: number) => Promise<void>;
  onUpdateStudent: (id: string, name: string, subjectCodes: { subjectId: string; code: string }[], totalAttendance: number) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  subjects,
  totalWorkingDays,
  loading,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [name, setName] = useState('');
  const [totalAttendance, setTotalAttendance] = useState<number | ''>('');
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setTotalAttendance('');
    const initialCodes: Record<string, string> = {};
    subjects.forEach(s => {
      initialCodes[s._id] = '';
    });
    setCodes(initialCodes);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setName(stu.name);
    setTotalAttendance(stu.totalAttendance ?? 0);
    const stuCodes: Record<string, string> = {};
    subjects.forEach(s => {
      const match = stu.subjectCodes.find(sc => sc.subjectId === s._id);
      stuCodes[s._id] = match ? match.code : '';
    });
    setCodes(stuCodes);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCodeChange = (subjectId: string, val: string) => {
    setCodes(prev => ({ ...prev, [subjectId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('শিক্ষার্থীর নাম অবশ্যই দিতে হবে।');
      return;
    }

    const attendanceNum = Number(totalAttendance);
    if (totalAttendance === '' || isNaN(attendanceNum) || attendanceNum < 0) {
      setFormError('মোট উপস্থিতি শূন্য বা তার বেশি হতে হবে।');
      return;
    }

    if (attendanceNum > totalWorkingDays) {
      setFormError(`শিক্ষার্থীর মোট উপস্থিতি প্রজেক্টের মোট কার্যদিবস (${totalWorkingDays} দিন)-এর বেশি হতে পারবে না।`);
      return;
    }

    if (subjects.length === 0) {
      setFormError('শিক্ষার্থী যোগ করার আগে অন্তত একটি বিষয় যোগ করুন।');
      return;
    }

    const subjectCodesList: { subjectId: string; code: string }[] = [];
    const internalSet = new Set<string>();

    for (const sub of subjects) {
      const c = (codes[sub._id] || '').trim();
      if (!c) {
        setFormError(`"${sub.name}" বিষয়ের জন্য খাতার কোড দেওয়া বাধ্যতামূলক।`);
        return;
      }
      const upper = c.toUpperCase();
      if (internalSet.has(upper)) {
        setFormError(`একই শিক্ষার্থীর একাধিক বিষয়ে একই কোড ("${c}") দেওয়া যাবে না।`);
        return;
      }
      internalSet.add(upper);
      subjectCodesList.push({ subjectId: sub._id, code: c });
    }

    try {
      setIsSubmitting(true);
      if (editingStudent) {
        await onUpdateStudent(editingStudent._id, name.trim(), subjectCodesList, attendanceNum);
      } else {
        await onAddStudent(name.trim(), subjectCodesList, attendanceNum);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'শিক্ষার্থী সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await onDeleteStudent(deleteId);
      } finally {
        setIsConfirmOpen(false);
        setDeleteId(null);
      }
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const getSubjectName = (subId: string) => {
    const sub = subjects.find(s => s._id === subId);
    return sub ? sub.name : 'অজানা বিষয়';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">শিক্ষার্থীবৃন্দ</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">শিক্ষার্থীর তালিকা ও বিষয়ভিত্তিক অনন্য খাতার কোড</p>
        </div>
        <button
          onClick={openAddModal}
          type="button"
          disabled={subjects.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl sm:rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন শিক্ষার্থী যোগ করুন</span>
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">কোনো বিষয় যোগ করা নেই</p>
            <p className="text-xs text-amber-700 mt-0.5">
              শিক্ষার্থী যোগ করার আগে &quot;বিষয়সমূহ&quot; ট্যাব থেকে পরীক্ষার বিষয়সমূহ যোগ করুন। প্রতিটি বিষয়ের জন্য আলাদা খাতার কোড স্বয়ংক্রিয়ভাবে তৈরি হবে।
            </p>
          </div>
        </div>
      )}

      {/* Search Input */}
      {students.length > 0 && (
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="শিক্ষার্থীর নাম দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] text-sm bg-white border border-slate-300 rounded-xl sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">এখনো কোনো শিক্ষার্থী যোগ করা হয়নি</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            শিক্ষার্থীর নাম এবং প্রতিটি বিষয়ের জন্য খাতার কোড এন্ট্রি করতে শিক্ষার্থী যোগ করুন।
          </p>
          {subjects.length > 0 && (
            <button
              onClick={openAddModal}
              type="button"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              প্রথম শিক্ষার্থী যোগ করুন
            </button>
          )}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          &quot;{search}&quot; নামে কোনো শিক্ষার্থী পাওয়া যায়নি।
        </div>
      ) : (
        <>
          {/* Mobile Student Cards (shown on <sm screens) */}
          <div className="sm:hidden space-y-3">
            {filteredStudents.map((stu) => (
              <div
                key={stu._id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-base truncate">{stu.name}</h4>
                    <span className="text-xs text-slate-500 font-mono-numbers block mt-0.5">
                      মোট উপস্থিতি: <strong className="text-slate-800">{stu.totalAttendance ?? 0}</strong> / {totalWorkingDays} দিন
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(stu)}
                      className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-lg cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(stu._id)}
                      className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-lg cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5 uppercase tracking-wider">খাতার কোডসমূহ:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {stu.subjectCodes.map((sc, idx) => (
                      <span key={sc.subjectId || idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-xs">
                        <span className="text-slate-500">{getSubjectName(sc.subjectId)}:</span>
                        <span className="font-mono-numbers font-bold text-slate-900">{sc.code}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (shown on sm and larger) */}
          <div className="hidden sm:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-5">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">মোট উপস্থিতি</th>
                    <th className="py-3 px-5">বিষয় ও খাতার কোড</th>
                    <th className="py-3 px-5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu) => (
                    <tr key={stu._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900">
                        {stu.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers text-slate-700 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{stu.totalAttendance ?? 0}</span>{' '}
                        <span className="text-xs text-slate-400">/ {totalWorkingDays} দিন</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          {stu.subjectCodes.map((sc, idx) => (
                            <span key={sc.subjectId || idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                              <span className="text-slate-500">{getSubjectName(sc.subjectId)}:</span>
                              <span className="font-mono-numbers font-semibold text-slate-900">{sc.code}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(stu)}
                            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(stu._id)}
                            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Student Modal (Responsive Sheet on Mobile, Modal on PC) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 sm:border-0 sm:pb-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'শিক্ষার্থীর তথ্য সম্পাদনা করুন' : 'নতুন শিক্ষার্থী যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs leading-relaxed">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিক্ষার্থীর নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: রহিম উদ্দিন"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    মোট উপস্থিতি (Total Attendance) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono-numbers">
                    মোট কার্যদিবস: {totalWorkingDays} দিন
                  </span>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={totalWorkingDays}
                  value={totalAttendance}
                  onChange={(e) => setTotalAttendance(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`০ থেকে ${totalWorkingDays}`}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers min-h-[44px]"
                />
              </div>

              {/* Dynamic Subject Codes */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  বিষয়ভিত্তিক খাতার কোড (Kata Code) <span className="text-rose-500">*</span>
                </span>
                <p className="text-xs text-slate-500 mb-3">
                  প্রতিটি বিষয়ের জন্য একটি অনন্য কোড দিন। একই প্রজেক্টে এই কোড অন্য কেউ ব্যবহার করতে পারবে না।
                </p>

                <div className="space-y-2.5 max-h-56 sm:max-h-60 overflow-y-auto pr-1">
                  {subjects.map((sub) => (
                    <div key={sub._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-800 block truncate">{sub.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono-numbers">পূর্ণমান: {sub.totalMarks} · পাস: {sub.passMarks}</span>
                      </div>
                      <div className="w-full sm:w-40 shrink-0">
                        <input
                          type="text"
                          value={codes[sub._id] || ''}
                          onChange={(e) => handleCodeChange(sub._id, e.target.value)}
                          placeholder="কোড: B101"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers uppercase font-semibold min-h-[40px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingStudent ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="শিক্ষার্থী মুছে ফেলতে চান?"
        message="এই শিক্ষার্থীকে মুছে ফেললে তার সকল খাতার কোড এবং ইতিমধ্যে এন্ট্রি করা নম্বর স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
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

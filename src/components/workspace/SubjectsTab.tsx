import React, { useState } from 'react';
import { Subject } from '../../types';
import { Plus, Edit2, Trash2, BookOpen, X } from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';

interface SubjectsTabProps {
  subjects: Subject[];
  loading: boolean;
  onAddSubject: (name: string, totalMarks: number, passMarks: number) => Promise<void>;
  onUpdateSubject: (id: string, name: string, totalMarks: number, passMarks: number) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
}

export const SubjectsTab: React.FC<SubjectsTabProps> = ({
  subjects,
  loading,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [name, setName] = useState('');
  const [totalMarks, setTotalMarks] = useState<number | ''>('');
  const [passMarks, setPassMarks] = useState<number | ''>('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setTotalMarks('');
    setPassMarks('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setTotalMarks(sub.totalMarks);
    setPassMarks(sub.passMarks);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('বিষয়ের নাম অবশ্যই দিতে হবে।');
      return;
    }

    const tMarks = Number(totalMarks);
    if (totalMarks === '' || isNaN(tMarks) || tMarks <= 0) {
      setFormError('পূর্ণমান অবশ্যই ০-এর বেশি হতে হবে।');
      return;
    }

    const pMarks = Number(passMarks);
    if (passMarks === '' || isNaN(pMarks) || pMarks < 0) {
      setFormError('পাস নম্বর শূন্য বা তার বেশি হতে পারবে।');
      return;
    }

    if (pMarks > tMarks) {
      setFormError('পাস নম্বর কখনো পূর্ণমান (Total Marks)-এর বেশি হতে পারবে না।');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSubject) {
        await onUpdateSubject(editingSubject._id, name.trim(), tMarks, pMarks);
      } else {
        await onAddSubject(name.trim(), tMarks, pMarks);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'বিষয় সংরক্ষণ করতে ব্যর্থ হয়েছে।');
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
        await onDeleteSubject(deleteId);
      } finally {
        setIsConfirmOpen(false);
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">বিষয়সমূহ</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">বর্তমান প্রজেক্টের সব পরীক্ষার বিষয় ও পূর্ণমান</p>
        </div>
        <button
          onClick={openAddModal}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl sm:rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন বিষয় যোগ করুন</span>
        </button>
      </div>

      {/* Subject List / Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">এখনো কোনো বিষয় যোগ করা হয়নি</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            পরীক্ষার ফলাফল ও নম্বর এন্ট্রি শুরু করার জন্য প্রথমে বিষয়সমূহ যোগ করুন।
          </p>
          <button
            onClick={openAddModal}
            type="button"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            প্রথম বিষয় যোগ করুন
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List (shown on <sm screens) */}
          <div className="sm:hidden space-y-2.5">
            {subjects.map((sub) => (
              <div
                key={sub._id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{sub.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-mono-numbers">
                    <span>পূর্ণমান: <strong>{sub.totalMarks}</strong></span>
                    <span>·</span>
                    <span>পাস: <strong>{sub.passMarks}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(sub)}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(sub._id)}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                    <th className="py-3 px-5">বিষয়ের নাম</th>
                    <th className="py-3 px-5 text-right">পূর্ণমান</th>
                    <th className="py-3 px-5 text-right">পাস নম্বর</th>
                    <th className="py-3 px-5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900">
                        {sub.name}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-numbers text-slate-700">
                        {sub.totalMarks}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-numbers text-slate-700">
                        {sub.passMarks}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(sub._id)}
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

      {/* Add / Edit Subject Modal (Responsive Sheet on Mobile, Modal on PC) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 sm:border-0 sm:pb-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'বিষয় সম্পাদনা করুন' : 'নতুন বিষয় যোগ করুন'}
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
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিষয়ের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: বাংলা, ইংরেজি, গণিত"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পূর্ণমান (Total Marks) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="১০০"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পাস নম্বর (Pass Marks) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={passMarks}
                    onChange={(e) => setPassMarks(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="৩৩"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers min-h-[44px]"
                  />
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
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingSubject ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="বিষয় মুছে ফেলতে চান?"
        message="এই বিষয়টি মুছে ফেললে এর সাথে যুক্ত শিক্ষার্থীদের খাতার কোড এবং নম্বর এন্ট্রিও মুছে যাবে। আপনি কি নিশ্চিত?"
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

import React, { useState, useEffect, useRef } from 'react';
import { MarkEntry, KataIdentification } from '../../types';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, FileCheck2, Check, X } from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';

interface MarkEntryTabProps {
  projectId: string;
  entries: MarkEntry[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const MarkEntryTab: React.FC<MarkEntryTabProps> = ({
  projectId,
  entries,
  loading,
  onRefresh
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MarkEntry | null>(null);

  // Add Form State
  const [kataCode, setKataCode] = useState('');
  const [obtainedMarks, setObtainedMarks] = useState<number | ''>('');
  const [identState, setIdentState] = useState<{
    loading: boolean;
    data: KataIdentification | null;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Form State
  const [editMarks, setEditMarks] = useState<number | ''>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Deletion confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Debounced auto-identification
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!kataCode.trim()) {
      setIdentState({ loading: false, data: null, error: null });
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setIdentState({ loading: true, data: null, error: null });
      setFormError(null);

      try {
        const result = await api.identifyKataCode(projectId, kataCode.trim());
        if (result.isAlreadyEntered) {
          setIdentState({
            loading: false,
            data: result,
            error: 'এই খাতার কোডের নম্বর ইতিমধ্যে এন্ট্রি করা হয়েছে।'
          });
        } else {
          setIdentState({
            loading: false,
            data: result,
            error: null
          });
        }
      } catch (err: any) {
        setIdentState({
          loading: false,
          data: null,
          error: err.message || 'এই কোডের কোনো শিক্ষার্থী বা বিষয় পাওয়া যায়নি।'
        });
      }
    }, 250);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [kataCode, projectId]);

  const openAddModal = () => {
    setKataCode('');
    setObtainedMarks('');
    setIdentState({ loading: false, data: null, error: null });
    setFormError(null);
    setSuccessMessage(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!kataCode.trim()) {
      setFormError('খাতার কোড অবশ্যই দিতে হবে।');
      return;
    }

    if (!identState.data) {
      setFormError('সঠিক খাতার কোড যাচাই না হওয়া পর্যন্ত নম্বর সংরক্ষণ করা যাবে না।');
      return;
    }

    if (identState.data.isAlreadyEntered) {
      setFormError('এই খাতার কোডের নম্বর ইতিমধ্যে এন্ট্রি করা হয়েছে।');
      return;
    }

    if (obtainedMarks === '' || isNaN(Number(obtainedMarks))) {
      setFormError('প্রাপ্ত নম্বর অবশ্যই দিতে হবে।');
      return;
    }

    const marksNum = Number(obtainedMarks);
    if (marksNum < 0) {
      setFormError('প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।');
      return;
    }

    if (marksNum > identState.data.totalMarks) {
      setFormError(`প্রাপ্ত নম্বর বিষয়ের পূর্ণমান (${identState.data.totalMarks})-এর বেশি হতে পারবে না।`);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createMarkEntry(projectId, kataCode.trim(), marksNum);
      setSuccessMessage('নম্বর সফলভাবে সংরক্ষিত হয়েছে!');
      // Reset form
      setKataCode('');
      setObtainedMarks('');
      setIdentState({ loading: false, data: null, error: null });
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'নম্বর সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (entry: MarkEntry) => {
    setEditingEntry(entry);
    setEditMarks(entry.obtainedMarks);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setEditError(null);
    if (editMarks === '' || isNaN(Number(editMarks))) {
      setEditError('প্রাপ্ত নম্বর অবশ্যই দিতে হবে।');
      return;
    }

    const marksNum = Number(editMarks);
    if (marksNum < 0) {
      setEditError('প্রাপ্ত নম্বর শূন্য বা তার বেশি হতে হবে।');
      return;
    }

    const maxMarks = editingEntry.totalMarks || 100;
    if (marksNum > maxMarks) {
      setEditError(`প্রাপ্ত নম্বর বিষয়ের পূর্ণমান (${maxMarks})-এর বেশি হতে পারবে না।`);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateMarkEntry(projectId, editingEntry._id, marksNum);
      setIsEditModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'নম্বর আপডেট করতে ব্যর্থ হয়েছে।');
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
        await api.deleteMarkEntry(projectId, deleteId);
        await onRefresh();
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
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">নম্বর এন্ট্রি</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            মোট নম্বর এন্ট্রি: <span className="font-mono-numbers font-semibold text-slate-800">{entries.length}</span> টি
          </p>
        </div>
        <button
          onClick={openAddModal}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl sm:rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন নম্বর যোগ করুন</span>
        </button>
      </div>

      {/* Mark Entries List / Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">এখনো কোনো নম্বর এন্ট্রি করা হয়নি</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            খাতার কোড ইনপুট দিলে স্বয়ংক্রিয়ভাবে শিক্ষার্থী ও বিষয় শনাক্ত করে নম্বর যোগ হবে।
          </p>
          <button
            onClick={openAddModal}
            type="button"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            প্রথম নম্বর এন্ট্রি করুন
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards (shown on <sm screens) */}
          <div className="sm:hidden space-y-2.5">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{entry.studentName}</h4>
                    <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-700 font-mono-numbers text-[11px] font-bold rounded">
                      {entry.kataCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span className="truncate">{entry.subjectName}</span>
                    <span>·</span>
                    <span className="font-mono-numbers font-bold text-slate-900">
                      {entry.obtainedMarks} <span className="text-[10px] font-normal text-slate-400">/ {entry.totalMarks}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(entry)}
                    className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-lg cursor-pointer"
                    title="নম্বর সংশোধন করুন"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(entry._id)}
                    className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-lg cursor-pointer"
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
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                সাম্প্রতিক নম্বর এন্ট্রির তালিকা
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-5">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-5">বিষয়ের নাম</th>
                    <th className="py-3 px-5">খাতার কোড</th>
                    <th className="py-3 px-5 text-right">প্রাপ্ত নম্বর</th>
                    <th className="py-3 px-5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900">
                        {entry.studentName}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">
                        {entry.subjectName}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 font-mono-numbers text-xs font-semibold rounded">
                          {entry.kataCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-numbers font-semibold text-slate-900">
                        {entry.obtainedMarks} <span className="text-xs font-normal text-slate-400">/ {entry.totalMarks}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(entry)}
                            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="নম্বর সংশোধন করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(entry._id)}
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

      {/* Add Mark Entry Modal (Responsive Mobile Bottom Sheet / PC Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 sm:border-0 sm:pb-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">নতুন নম্বর এন্ট্রি</h3>
                <p className="text-xs text-slate-500 mt-0.5">খাতার কোড দিলে স্বয়ংক্রিয়ভাবে শনাক্ত হবে।</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {/* Input 1: Kata Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খাতার কোড (Kata Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={kataCode}
                  onChange={(e) => setKataCode(e.target.value)}
                  placeholder="যেমন: B101"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers uppercase tracking-wider font-bold min-h-[48px]"
                  autoFocus
                />
              </div>

              {/* Automatic Identification Box (Verification only) */}
              {kataCode.trim() && (
                <div className="p-3.5 rounded-lg border text-xs transition-colors bg-slate-50 border-slate-200">
                  {identState.loading ? (
                    <div className="flex items-center gap-2 text-slate-500 py-1">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>কোড অনুসন্ধান করা হচ্ছে...</span>
                    </div>
                  ) : identState.error ? (
                    <div className="flex items-start gap-2 text-rose-600">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{identState.error}</p>
                        {identState.data?.isAlreadyEntered && (
                          <p className="text-slate-600 mt-1">
                            শিক্ষার্থী: <span className="font-bold text-slate-800">{identState.data.studentName}</span> ·
                            বিষয়: <span className="font-bold text-slate-800">{identState.data.subjectName}</span> ·
                            পূর্বে প্রাপ্ত নম্বর: <span className="font-mono-numbers font-bold text-slate-900">{identState.data.existingMark?.obtainedMarks}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ) : identState.data ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>সঠিক শিক্ষার্থী ও বিষয় শনাক্ত হয়েছে:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 border-t border-slate-200/80">
                        <div>
                          <span className="text-slate-400 block text-[11px]">শিক্ষার্থীর নাম</span>
                          <span className="font-bold text-slate-900 text-sm block truncate">{identState.data.studentName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">বিষয়ের নাম</span>
                          <span className="font-bold text-slate-900 text-sm block truncate">{identState.data.subjectName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">পূর্ণমান</span>
                          <span className="font-mono-numbers font-bold text-slate-900">{identState.data.totalMarks}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">পাস নম্বর</span>
                          <span className="font-mono-numbers font-bold text-slate-900">{identState.data.passMarks}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Input 2: Obtained Marks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রাপ্ত নম্বর (Obtained Marks) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={identState.data?.totalMarks || 100}
                  value={obtainedMarks}
                  disabled={!identState.data || identState.data.isAlreadyEntered}
                  onChange={(e) => setObtainedMarks(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={identState.data ? `০ থেকে ${identState.data.totalMarks}` : 'প্রথমে খাতার কোড দিন'}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers font-bold min-h-[48px] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !identState.data || identState.data.isAlreadyEntered}
                  className="px-5 py-2.5 min-h-[48px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Mark Entry Modal */}
      {isEditModalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 p-5 sm:p-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">প্রাপ্ত নম্বর সংশোধন</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              শিক্ষার্থী: <span className="font-bold text-slate-800">{editingEntry.studentName}</span> · বিষয়: <span className="font-bold text-slate-800">{editingEntry.subjectName}</span>
            </p>

            {editError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  খাতার কোড
                </label>
                <input
                  type="text"
                  value={editingEntry.kataCode}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg font-mono-numbers text-slate-600 cursor-not-allowed min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রাপ্ত নম্বর (পূর্ণমান: {editingEntry.totalMarks}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={editingEntry.totalMarks || 100}
                  value={editMarks}
                  onChange={(e) => setEditMarks(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono-numbers font-bold min-h-[48px]"
                  autoFocus
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="নম্বর এন্ট্রি মুছে ফেলতে চান?"
        message="এই নম্বর এন্ট্রিটি মুছে ফেললে সংশ্লিষ্ট বিষয়ের ফলাফল পুনরায় অপেক্ষমাণ (Pending) হয়ে যাবে। আপনি কি নিশ্চিত?"
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

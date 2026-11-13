import React, { useState, useMemo } from 'react';
import { Project, StudentResult, MarksheetData, Subject } from '../../types';
import { api } from '../../services/api';
import { Search, FileText, Award, ListFilter, ArrowUpDown } from 'lucide-react';
import { MarksheetModal } from './MarksheetModal';
import { CompleteResultModal } from './CompleteResultModal';

interface ResultsTabProps {
  project: Project;
  subjects: Subject[];
  results: StudentResult[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

type SortOption = 'merit' | 'gpa-desc' | 'gpa-asc' | 'marks-desc' | 'marks-asc' | 'name-asc' | 'name-desc';

export const ResultsTab: React.FC<ResultsTabProps> = ({
  project,
  subjects,
  results,
  loading
}) => {
  const projectId = project._id;
  const totalWorkingDays = project.totalWorkingDays;
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('merit');
  const [selectedMarksheet, setSelectedMarksheet] = useState<MarksheetData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteResultOpen, setIsCompleteResultOpen] = useState(false);
  const [loadingMarksheet, setLoadingMarksheet] = useState(false);

  // Filter and sort results
  const processedResults = useMemo(() => {
    let list = results.filter(r =>
      r.studentName.toLowerCase().includes(search.trim().toLowerCase())
    );

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'merit': {
          if (a.meritPosition === null && b.meritPosition === null) return 0;
          if (a.meritPosition === null) return 1;
          if (b.meritPosition === null) return -1;
          return a.meritPosition - b.meritPosition;
        }
        case 'gpa-desc': {
          if (a.gpa === null && b.gpa === null) return 0;
          if (a.gpa === null) return 1;
          if (b.gpa === null) return -1;
          if (b.gpa !== a.gpa) return b.gpa - a.gpa;
          return b.totalObtainedMarks - a.totalObtainedMarks;
        }
        case 'gpa-asc': {
          if (a.gpa === null && b.gpa === null) return 0;
          if (a.gpa === null) return 1;
          if (b.gpa === null) return -1;
          if (a.gpa !== b.gpa) return a.gpa - b.gpa;
          return a.totalObtainedMarks - b.totalObtainedMarks;
        }
        case 'marks-desc': {
          if (b.totalObtainedMarks !== a.totalObtainedMarks) {
            return b.totalObtainedMarks - a.totalObtainedMarks;
          }
          return (b.gpa ?? 0) - (a.gpa ?? 0);
        }
        case 'marks-asc': {
          return a.totalObtainedMarks - b.totalObtainedMarks;
        }
        case 'name-asc': {
          return a.studentName.localeCompare(b.studentName, 'bn');
        }
        case 'name-desc': {
          return b.studentName.localeCompare(a.studentName, 'bn');
        }
        default:
          return 0;
      }
    });
  }, [results, search, sortBy]);

  const handleViewMarksheet = async (studentId: string) => {
    try {
      setLoadingMarksheet(true);
      const data = await api.getMarksheet(projectId, studentId);
      setSelectedMarksheet(data);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Error fetching marksheet:', err);
    } finally {
      setLoadingMarksheet(false);
    }
  };

  const renderStatus = (status: 'Pass' | 'Fail' | 'Pending') => {
    if (status === 'Pass') {
      return <span className="font-bold text-emerald-700">পাস</span>;
    }
    if (status === 'Fail') {
      return <span className="font-bold text-rose-600">ফেল</span>;
    }
    return <span className="font-bold text-amber-600">অপেক্ষমাণ</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">ফলাফল</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">সব শিক্ষার্থীর প্রাপ্ত নম্বর, জিপিএ এবং চূড়ান্ত ফলাফল</p>
        </div>

        {/* Complete Result List Button */}
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCompleteResultOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl sm:rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <ListFilter className="w-4 h-4" />
            <span>সম্পূর্ণ ফলাফল তালিকা</span>
          </button>
        )}
      </div>

      {/* Search & Sorting Toolbar */}
      {results.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="শিক্ষার্থীর নাম দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 min-h-[40px] text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              সাজান:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer min-h-[40px]"
            >
              <option value="merit">মেধা স্থান (ডিফল্ট)</option>
              <option value="gpa-desc">GPA: বেশি থেকে কম</option>
              <option value="gpa-asc">GPA: কম থেকে বেশি</option>
              <option value="marks-desc">নম্বর: বেশি থেকে কম</option>
              <option value="marks-asc">নম্বর: কম থেকে বেশি</option>
              <option value="name-asc">নাম: A–Z</option>
              <option value="name-desc">নাম: Z–A</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Display */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">কোনো ফলাফল পাওয়া যায়নি</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            প্রথমে বিষয় এবং শিক্ষার্থী যোগ করে নম্বর এন্ট্রি সম্পন্ন করুন।
          </p>
        </div>
      ) : processedResults.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
          &quot;{search}&quot; নামে কোনো শিক্ষার্থীর ফলাফল পাওয়া যায়নি।
        </div>
      ) : (
        <>
          {/* Mobile Cards (shown on <sm screens) */}
          <div className="sm:hidden space-y-3">
            {processedResults.map((r) => (
              <div
                key={r.studentId}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-base truncate">{r.studentName}</h4>
                    <span className="text-[11px] text-indigo-700 font-semibold font-mono-numbers">
                      মেধা স্থান: {r.meritPosition !== null ? `${r.meritPosition}` : '—'}
                    </span>
                  </div>
                  <div>{renderStatus(r.finalStatus)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">উপস্থিতি</span>
                    <span className="font-mono-numbers font-bold text-slate-900 text-sm">
                      {r.totalAttendance ?? 0} <span className="text-[10px] text-slate-400 font-normal">/ {totalWorkingDays}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">মোট নম্বর</span>
                    <span className="font-mono-numbers font-bold text-slate-900 text-sm">
                      {r.totalObtainedMarks} <span className="text-[10px] text-slate-400 font-normal">/ {r.totalFullMarks}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">জিপিএ (GPA)</span>
                    <span className="font-mono-numbers font-bold text-slate-900 text-sm">
                      {r.gpa !== null ? r.gpa.toFixed(2) : <span className="text-slate-400 font-normal">অপেক্ষমাণ</span>}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleViewMarksheet(r.studentId)}
                  disabled={loadingMarksheet}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] text-xs font-semibold text-slate-800 bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>মার্কশিট দেখুন</span>
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table (shown on sm and larger) */}
          <div className="hidden sm:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4 text-center w-24">মেধা স্থান</th>
                    <th className="py-3 px-5">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">উপস্থিতি</th>
                    <th className="py-3 px-5 text-right">প্রাপ্ত মোট নম্বর</th>
                    <th className="py-3 px-5 text-right">জিপিএ (GPA)</th>
                    <th className="py-3 px-5 text-center">চূড়ান্ত ফলাফল</th>
                    <th className="py-3 px-5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedResults.map((r) => (
                    <tr key={r.studentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono-numbers font-bold">
                        {r.meritPosition !== null ? (
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                            {r.meritPosition}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {r.studentName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers text-slate-700 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{r.totalAttendance ?? 0}</span>{' '}
                        <span className="text-xs text-slate-400">/ {totalWorkingDays} দিন</span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-numbers font-semibold text-slate-900">
                        {r.totalObtainedMarks} <span className="text-xs font-normal text-slate-400">/ {r.totalFullMarks}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-numbers font-bold text-slate-900">
                        {r.gpa !== null ? r.gpa.toFixed(2) : <span className="text-slate-400 font-normal text-xs">অপেক্ষমাণ</span>}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {renderStatus(r.finalStatus)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewMarksheet(r.studentId)}
                          disabled={loadingMarksheet}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          মার্কশিট দেখুন
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Individual Marksheet Modal */}
      <MarksheetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMarksheet(null);
        }}
        data={selectedMarksheet}
      />

      {/* Complete Result List Modal (Master Sheet) */}
      <CompleteResultModal
        isOpen={isCompleteResultOpen}
        onClose={() => setIsCompleteResultOpen(false)}
        project={project}
        subjects={subjects}
        results={results}
      />
    </div>
  );
};

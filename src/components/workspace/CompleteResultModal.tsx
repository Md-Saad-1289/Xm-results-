import React, { useState, useMemo } from 'react';
import { Project, StudentResult, Subject } from '../../types';
import { X, Printer, Download, ArrowUpDown } from 'lucide-react';

interface CompleteResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  subjects: Subject[];
  results: StudentResult[];
}

type SortOption = 'merit' | 'gpa-desc' | 'gpa-asc' | 'marks-desc' | 'marks-asc' | 'name-asc' | 'name-desc';

function getOverallGrade(gpa: number | null, status: 'Pass' | 'Fail' | 'Pending'): string {
  if (status === 'Pending' || gpa === null) return '—';
  if (status === 'Fail' || gpa <= 0) return 'F';
  if (gpa >= 5.0) return 'A+';
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.5) return 'A-';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.0) return 'C';
  if (gpa >= 1.0) return 'D';
  return 'F';
}

export const CompleteResultModal: React.FC<CompleteResultModalProps> = ({
  isOpen,
  onClose,
  project,
  subjects,
  results
}) => {
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('merit');

  const instituteTitle = (project.instituteName || '').trim() || project.name;
  const examTitle = (project.examName || '').trim() || project.name;
  const classTitle = (project.className || '').trim() || '—';
  const sectionTitle = (project.sectionName || '').trim() || '—';
  const totalWorkingDays = project.totalWorkingDays;

  const passedCount = results.filter(r => r.finalStatus === 'Pass').length;
  const failedCount = results.filter(r => r.finalStatus === 'Fail').length;
  const pendingCount = results.filter(r => r.finalStatus === 'Pending').length;
  const passRate = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

  const avgAttendance = useMemo(() => {
    if (results.length === 0 || totalWorkingDays <= 0) return 0;
    const totalAtt = results.reduce((sum, r) => sum + Number(r.totalAttendance ?? 0), 0);
    return Math.round((totalAtt / (results.length * totalWorkingDays)) * 100);
  }, [results, totalWorkingDays]);

  // Filter then sort results
  const processedResults = useMemo(() => {
    const list = results.filter(r => {
      if (filter === 'pass') return r.finalStatus === 'Pass';
      if (filter === 'fail') return r.finalStatus === 'Fail';
      if (filter === 'pending') return r.finalStatus === 'Pending';
      return true;
    });

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
  }, [results, filter, sortBy]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${instituteTitle} - সম্পূর্ণ ফলাফল তালিকা</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: 16px;
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Hind Siliguri', sans-serif;
    }
    .result-sheet {
      width: 100%;
      max-width: 1080px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 24px 28px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
    }
    .sheet-header {
      text-align: center;
      margin-bottom: 14px;
    }
    .sheet-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1B365D;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .sheet-header .subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding: 10px 4px 12px 4px;
      font-size: 12.5px;
      color: #0f172a;
    }
    .meta-item strong {
      font-weight: 700;
      color: #0f172a;
    }
    .table-wrapper {
      width: 100%;
      overflow: visible;
    }
    table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      table-layout: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    thead th {
      background: #1B365D;
      color: #ffffff;
      font-weight: 700;
      text-align: center;
      border-color: #1B365D;
      padding: 8px 6px;
    }
    thead th.text-left {
      text-align: left;
    }
    tbody tr {
      background: #ffffff;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody tr.row-fail {
      background: #fdecec !important;
    }
    tbody tr.row-pending {
      background: #fffbeb !important;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .status-pass { color: #0f172a; font-weight: 700; }
    .status-fail { color: #dc2626; font-weight: 700; }
    .status-pending { color: #d97706; font-weight: 700; }
    .summary-strip {
      margin-top: 16px;
      display: grid;
      grid-template-columns: repeat(${pendingCount > 0 ? 6 : 5}, 1fr);
      border: 1px solid #cbd5e1;
      background: #eef4fb;
      page-break-inside: avoid;
    }
    .summary-cell {
      padding: 8px 10px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #1B365D;
      border-right: 1px solid #cbd5e1;
    }
    .summary-cell:last-child {
      border-right: none;
    }
    .signatures {
      margin-top: 44px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 40px;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-box {
      padding-top: 6px;
    }
    .sig-line {
      width: 170px;
      margin: 0 auto 6px auto;
      border-top: 1.5px solid #334155;
    }
    .sig-label {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .print-btn-bar {
      text-align: center;
      margin-bottom: 12px;
    }
    .print-btn {
      background: #1B365D;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12.5px;
      font-family: inherit;
      font-weight: 600;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .result-sheet { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
      .print-btn-bar { display: none; }
      table { width: 100% !important; max-width: 100% !important; font-size: 9pt; }
      th, td { padding: 4px 5px !important; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF সংরক্ষণ করুন</button>
  </div>
  <div class="result-sheet">
    <div class="sheet-header">
      <h1>${instituteTitle}</h1>
      <p class="subtitle">সম্পূর্ণ ফলাফল তালিকা (COMPLETE CLASS RESULT SHEET)</p>
    </div>

    <div class="meta-row">
      <div class="meta-item"><strong>পরীক্ষা:</strong> ${examTitle}</div>
      <div class="meta-item"><strong>শ্রেণি:</strong> ${classTitle}</div>
      <div class="meta-item"><strong>শাখা:</strong> ${sectionTitle}</div>
      <div class="meta-item"><strong>মোট কার্যদিবস:</strong> <span class="font-mono">${totalWorkingDays}</span> দিন</div>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 36px;">নং</th>
            <th class="text-left" style="min-width: 130px;">শিক্ষার্থীর নাম</th>
            ${subjects.map(s => `<th>${s.name}</th>`).join('')}
            <th style="width: 68px;">মোট নম্বর</th>
            <th style="width: 72px;">উপস্থিতি</th>
            <th style="width: 54px;">জিপিএ</th>
            <th style="width: 50px;">গ্রেড</th>
            <th style="width: 68px;">মেধা স্থান</th>
            <th style="width: 64px;">ফলাফল</th>
          </tr>
        </thead>
        <tbody>
          ${processedResults.map((r, idx) => {
            const rowClass = r.finalStatus === 'Fail' ? 'row-fail' : r.finalStatus === 'Pending' ? 'row-pending' : '';
            const gradeText = getOverallGrade(r.gpa, r.finalStatus);
            return `
            <tr class="${rowClass}">
              <td class="text-center font-mono">${idx + 1}</td>
              <td class="text-left" style="font-weight: 500;">${r.studentName}</td>
              ${subjects.map(s => {
                const subRes = r.subjectResults.find(sr => sr.subjectId === s._id);
                if (!subRes || subRes.obtainedMarks === null) {
                  return '<td class="text-center font-mono" style="color:#d97706;">—</td>';
                }
                const isFail = subRes.grade === 'F' || subRes.status === 'Fail';
                return `<td class="text-center font-mono" style="${isFail ? 'color:#dc2626;font-weight:bold;' : ''}">${subRes.obtainedMarks}</td>`;
              }).join('')}
              <td class="text-center font-mono" style="font-weight: 600;">${r.totalObtainedMarks}</td>
              <td class="text-center font-mono">${r.totalAttendance ?? 0}/${totalWorkingDays}</td>
              <td class="text-center font-mono" style="font-weight: 600;">${r.gpa !== null ? r.gpa.toFixed(2) : '—'}</td>
              <td class="text-center" style="font-weight: 600; ${gradeText === 'F' ? 'color:#dc2626;' : ''}">${gradeText}</td>
              <td class="text-center font-mono" style="font-weight: 600;">${r.meritPosition !== null ? r.meritPosition : '—'}</td>
              <td class="text-center ${r.finalStatus === 'Pass' ? 'status-pass' : r.finalStatus === 'Fail' ? 'status-fail' : 'status-pending'}">
                ${r.finalStatus === 'Pass' ? 'পাস' : r.finalStatus === 'Fail' ? 'ফেল' : 'অপেক্ষমাণ'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="summary-strip">
      <div class="summary-cell">মোট শিক্ষার্থী: <span class="font-mono">${results.length}</span></div>
      <div class="summary-cell">পাস: <span class="font-mono">${passedCount}</span></div>
      <div class="summary-cell">ফেল: <span class="font-mono">${failedCount}</span></div>
      ${pendingCount > 0 ? `<div class="summary-cell">অপেক্ষমাণ: <span class="font-mono">${pendingCount}</span></div>` : ''}
      <div class="summary-cell">পাসের হার: <span class="font-mono">${passRate}%</span></div>
      <div class="summary-cell">গড় উপস্থিতি: <span class="font-mono">${avgAttendance}%</span></div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">প্রস্তুতকারক</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">শ্রেণি শিক্ষক</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">প্রধান শিক্ষক</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_সম্পূর্ণ_ফলাফল.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderStatus = (status: 'Pass' | 'Fail' | 'Pending') => {
    if (status === 'Pass') {
      return <span className="font-bold text-slate-900">পাস</span>;
    }
    if (status === 'Fail') {
      return <span className="font-bold text-rose-600">ফেল</span>;
    }
    return <span className="font-bold text-amber-600">অপেক্ষমাণ</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full sm:max-w-6xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[95vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-3 shrink-0 print:hidden">
          <div>
            <h3 className="text-base font-bold text-slate-900">সম্পূর্ণ ফলাফল তালিকা (Master Sheet)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রজেক্ট: <span className="font-semibold text-slate-800">{project.name}</span> · মোট শিক্ষার্থী: <span className="font-mono-numbers font-semibold text-slate-800">{results.length}</span> জন
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="সম্পূর্ণ ফলাফল তালিকা প্রিন্ট বা PDF সেভ করুন"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF</span>
            </button>
            <button
              onClick={handleDownload}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-white bg-[#1B365D] hover:bg-slate-800 active:bg-slate-950 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="অফলাইন ফাইল হিসেবে ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>ডাউনলোড</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 active:bg-slate-200 rounded-lg transition-colors cursor-pointer ml-1"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body (Document / PDF Format) */}
        <div className="p-4 sm:p-7 bg-white overflow-y-auto flex-1 space-y-4 print:p-0 print:overflow-visible print:space-y-3">
          {/* Institutional Header (Matches Reference PDF) */}
          <div className="text-center space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B365D] tracking-wide uppercase print:text-2xl">
              {instituteTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wider uppercase print:text-xs">
              সম্পূর্ণ ফলাফল তালিকা (COMPLETE CLASS RESULT SHEET)
            </p>
          </div>

          {/* Exam / Class / Section / Working Days Metadata Row */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-4 px-1 py-2 text-xs sm:text-sm text-slate-900 border-b border-slate-200 print:flex print:justify-between print:border-b-0 print:py-1 print:text-[10pt]">
            <div>
              <span className="font-bold">পরীক্ষা:</span> <span>{examTitle}</span>
            </div>
            <div>
              <span className="font-bold">শ্রেণি:</span> <span>{classTitle}</span>
            </div>
            <div>
              <span className="font-bold">শাখা:</span> <span>{sectionTitle}</span>
            </div>
            <div>
              <span className="font-bold">মোট কার্যদিবস:</span>{' '}
              <span className="font-mono-numbers">{totalWorkingDays}</span> দিন
            </div>
          </div>

          {/* Filter Bar & Sorting Row (hidden in print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilter('all')}
                type="button"
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল ({results.length})
              </button>
              <button
                onClick={() => setFilter('pass')}
                type="button"
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'pass' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                পাস ({passedCount})
              </button>
              <button
                onClick={() => setFilter('fail')}
                type="button"
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'fail' ? 'bg-white text-rose-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                ফেল ({failedCount})
              </button>
              <button
                onClick={() => setFilter('pending')}
                type="button"
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filter === 'pending' ? 'bg-white text-amber-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-amber-600'
                }`}
              >
                অপেক্ষমাণ ({pendingCount})
              </button>
            </div>

            {/* Sorting Select */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                সাজান:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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

          {/* Master Result Table (Navy Header + Crisp Borders + Fail Pink Tint, Print-safe) */}
          <div className="border border-slate-300 overflow-x-auto print:overflow-visible print:w-full">
            <table className="w-full text-left text-xs sm:text-sm min-w-[760px] border-collapse print:min-w-0 print:w-full print:text-[8.5pt] print:table-auto">
              <thead>
                <tr className="bg-[#1B365D] text-white font-bold text-xs print:text-[8.5pt]">
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] w-10 print:py-1.5 print:px-1">নং</th>
                  <th className="py-2.5 px-3 text-left border border-[#1B365D] min-w-[140px] print:py-1.5 print:px-2">শিক্ষার্থীর নাম</th>
                  {subjects.map(s => (
                    <th key={s._id} className="py-2.5 px-2 text-center border border-[#1B365D] whitespace-nowrap print:whitespace-normal print:py-1.5 print:px-1">
                      {s.name}
                    </th>
                  ))}
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap print:py-1.5 print:px-1">মোট নম্বর</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap print:py-1.5 print:px-1">উপস্থিতি</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap print:py-1.5 print:px-1">জিপিএ</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap print:py-1.5 print:px-1">গ্রেড</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap print:py-1.5 print:px-1">মেধা স্থান</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap print:py-1.5 print:px-1">ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {processedResults.length === 0 ? (
                  <tr>
                    <td colSpan={subjects.length + 8} className="py-8 text-center text-slate-500 text-sm border border-slate-300">
                      কোনো ফলাফল পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  processedResults.map((r, idx) => {
                    const gradeText = getOverallGrade(r.gpa, r.finalStatus);
                    const rowBg =
                      r.finalStatus === 'Fail'
                        ? 'bg-[#FDECEC]'
                        : r.finalStatus === 'Pending'
                        ? 'bg-amber-50/70'
                        : idx % 2 === 1
                        ? 'bg-slate-50/70'
                        : 'bg-white';

                    return (
                      <tr key={r.studentId} className={`${rowBg} print:break-inside-avoid`}>
                        <td className="py-2 px-2.5 text-center font-mono-numbers text-slate-700 border border-slate-300 print:py-1 print:px-1">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 border border-slate-300 whitespace-nowrap print:whitespace-normal print:py-1 print:px-2">
                          {r.studentName}
                        </td>
                        {subjects.map(s => {
                          const subRes = r.subjectResults.find(sr => sr.subjectId === s._id);
                          if (!subRes || subRes.obtainedMarks === null) {
                            return (
                              <td key={s._id} className="py-2 px-2 text-center font-mono-numbers text-amber-600 border border-slate-300 print:py-1 print:px-1">
                                —
                              </td>
                            );
                          }
                          const isFail = subRes.grade === 'F' || subRes.status === 'Fail';
                          return (
                            <td
                              key={s._id}
                              className={`py-2 px-2 text-center font-mono-numbers border border-slate-300 print:py-1 print:px-1 ${
                                isFail ? 'text-rose-600 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {subRes.obtainedMarks}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2.5 text-center font-mono-numbers font-semibold text-slate-900 border border-slate-300 print:py-1 print:px-1">
                          {r.totalObtainedMarks}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono-numbers text-slate-800 border border-slate-300 whitespace-nowrap print:py-1 print:px-1">
                          {r.totalAttendance ?? 0}/{totalWorkingDays}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono-numbers font-semibold text-slate-900 border border-slate-300 print:py-1 print:px-1">
                          {r.gpa !== null ? r.gpa.toFixed(2) : '—'}
                        </td>
                        <td
                          className={`py-2 px-2.5 text-center font-semibold border border-slate-300 print:py-1 print:px-1 ${
                            gradeText === 'F' ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {gradeText}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono-numbers font-semibold text-slate-900 border border-slate-300 print:py-1 print:px-1">
                          {r.meritPosition !== null ? r.meritPosition : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-center border border-slate-300 whitespace-nowrap print:py-1 print:px-1">
                          {renderStatus(r.finalStatus)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Institutional Bottom Summary Strip (Matches Reference PDF Page 2) */}
          <div className={`grid grid-cols-2 ${pendingCount > 0 ? 'sm:grid-cols-6 print:grid-cols-6' : 'sm:grid-cols-5 print:grid-cols-5'} border border-slate-300 bg-[#EEF4FB] text-xs font-bold text-[#1B365D] print:text-[9pt] print:break-inside-avoid`}>
            <div className="py-2.5 px-3 text-center border-b sm:border-b-0 border-r border-slate-300 print:py-1.5 print:border-b-0">
              মোট শিক্ষার্থী: <span className="font-mono-numbers">{results.length}</span>
            </div>
            <div className="py-2.5 px-3 text-center border-b sm:border-b-0 sm:border-r border-slate-300 print:py-1.5 print:border-b-0 print:border-r">
              পাস: <span className="font-mono-numbers">{passedCount}</span>
            </div>
            <div className="py-2.5 px-3 text-center border-b sm:border-b-0 border-r border-slate-300 print:py-1.5 print:border-b-0">
              ফেল: <span className="font-mono-numbers">{failedCount}</span>
            </div>
            {pendingCount > 0 && (
              <div className="py-2.5 px-3 text-center border-b sm:border-b-0 sm:border-r border-slate-300 print:py-1.5 print:border-b-0 print:border-r">
                অপেক্ষমাণ: <span className="font-mono-numbers">{pendingCount}</span>
              </div>
            )}
            <div className="py-2.5 px-3 text-center sm:border-r border-slate-300 print:py-1.5 print:border-r">
              পাসের হার: <span className="font-mono-numbers">{passRate}%</span>
            </div>
            <div className="col-span-2 sm:col-span-1 py-2.5 px-3 text-center border-t sm:border-t-0 border-slate-300 print:py-1.5 print:col-span-1 print:border-t-0">
              গড় উপস্থিতি: <span className="font-mono-numbers">{avgAttendance}%</span>
            </div>
          </div>

          {/* 3-Column Signature Block (Matches Reference PDF Page 2) */}
          <div className="grid grid-cols-3 gap-4 sm:gap-10 pt-10 pb-2 text-center print:pt-10 print:break-inside-avoid">
            <div>
              <div className="border-t border-slate-700 w-28 sm:w-44 mx-auto pt-1.5 text-[11px] sm:text-xs font-bold text-slate-900">
                প্রস্তুতকারক
              </div>
            </div>
            <div>
              <div className="border-t border-slate-700 w-28 sm:w-44 mx-auto pt-1.5 text-[11px] sm:text-xs font-bold text-slate-900">
                শ্রেণি শিক্ষক
              </div>
            </div>
            <div>
              <div className="border-t border-slate-700 w-28 sm:w-44 mx-auto pt-1.5 text-[11px] sm:text-xs font-bold text-slate-900">
                প্রধান শিক্ষক
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

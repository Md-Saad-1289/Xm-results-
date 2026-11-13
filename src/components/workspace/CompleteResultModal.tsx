import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, StudentResult, Subject } from '../../types';
import { X, Printer, Download, ArrowUpDown } from 'lucide-react';

interface CompleteResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  subjects: Subject[];
  results: StudentResult[];
}

type SortOption =
  | 'merit'
  | 'gpa-desc'
  | 'gpa-asc'
  | 'marks-desc'
  | 'marks-asc'
  | 'name-asc'
  | 'name-desc';

type FilterOption = 'all' | 'pass' | 'fail' | 'pending';
type FinalStatus = 'Pass' | 'Fail' | 'Pending';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Escape user-supplied text before injecting it into the generated HTML. */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Remove characters that are illegal in file names on Windows/macOS/Linux. */
function toSafeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || 'result';
}

function getOverallGrade(gpa: number | null, status: FinalStatus): string {
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

const STATUS_LABEL: Record<FinalStatus, string> = {
  Pass: 'পাস',
  Fail: 'ফেল',
  Pending: 'অপেক্ষমাণ'
};

const FILTER_LABEL: Record<Exclude<FilterOption, 'all'>, string> = {
  pass: 'শুধু পাস',
  fail: 'শুধু ফেল',
  pending: 'শুধু অপেক্ষমাণ'
};

/** Sheet font size shrinks as the number of subject columns grows. */
function getPrintFontSize(subjectCount: number): number {
  if (subjectCount <= 6) return 10;
  if (subjectCount <= 9) return 9;
  if (subjectCount <= 12) return 8;
  return 7;
}

/* -------------------------------------------------------------------------- */
/*  Standalone HTML builder (used for BOTH print and download)                */
/* -------------------------------------------------------------------------- */

interface SheetData {
  instituteTitle: string;
  examTitle: string;
  classTitle: string;
  sectionTitle: string;
  totalWorkingDays: number;
  subjects: Subject[];
  rows: StudentResult[];
  total: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  passRate: number;
  avgAttendance: number;
  filterNote: string;
}

function buildSheetHtml(d: SheetData, opts: { showPrintButton: boolean }): string {
  const fontSize = getPrintFontSize(d.subjects.length);
  const summaryCols = d.pendingCount > 0 ? 6 : 5;
  const colCount = d.subjects.length + 8;

  const subjectHeads = d.subjects.map(s => `<th>${escapeHtml(s.name)}</th>`).join('');

  const bodyRows =
    d.rows.length === 0
      ? `<tr><td colspan="${colCount}" class="empty">কোনো ফলাফল পাওয়া যায়নি</td></tr>`
      : d.rows
          .map((r, idx) => {
            const rowClass =
              r.finalStatus === 'Fail' ? 'row-fail' : r.finalStatus === 'Pending' ? 'row-pending' : '';
            const gradeText = getOverallGrade(r.gpa, r.finalStatus);
            const statusClass =
              r.finalStatus === 'Pass'
                ? 'status-pass'
                : r.finalStatus === 'Fail'
                ? 'status-fail'
                : 'status-pending';

            const subjectCells = d.subjects
              .map(s => {
                const subRes = r.subjectResults.find(sr => sr.subjectId === s._id);
                if (!subRes || subRes.obtainedMarks === null || subRes.obtainedMarks === undefined) {
                  return '<td class="center mono dash">—</td>';
                }
                const isFail = subRes.grade === 'F' || subRes.status === 'Fail';
                return `<td class="center mono${isFail ? ' fail-mark' : ''}">${escapeHtml(subRes.obtainedMarks)}</td>`;
              })
              .join('');

            return `
        <tr class="${rowClass}">
          <td class="center mono">${idx + 1}</td>
          <td class="left name">${escapeHtml(r.studentName)}</td>
          ${subjectCells}
          <td class="center mono bold">${escapeHtml(r.totalObtainedMarks)}</td>
          <td class="center mono nowrap">${escapeHtml(r.totalAttendance ?? 0)}/${d.totalWorkingDays}</td>
          <td class="center mono bold">${r.gpa !== null && r.gpa !== undefined ? r.gpa.toFixed(2) : '—'}</td>
          <td class="center bold${gradeText === 'F' ? ' fail-mark' : ''}">${gradeText}</td>
          <td class="center mono bold">${r.meritPosition !== null && r.meritPosition !== undefined ? r.meritPosition : '—'}</td>
          <td class="center ${statusClass}">${STATUS_LABEL[r.finalStatus]}</td>
        </tr>`;
          })
          .join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(d.instituteTitle)} - সম্পূর্ণ ফলাফল তালিকা</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4 landscape;
      margin: 10mm 10mm 12mm 10mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #0f172a;
      font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Kalpurush', 'Nirmala UI', 'Vrinda', 'Segoe UI', Arial, sans-serif;
      line-height: 1.35;
    }
    body { padding: 16px; }
    .result-sheet {
      width: 100%;
      max-width: 1180px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 24px 28px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
    }
    .sheet-header { text-align: center; margin-bottom: 12px; }
    .sheet-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1B365D;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .sheet-header .subtitle {
      margin: 4px 0 0;
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
      gap: 8px 16px;
      padding: 8px 2px 10px;
      font-size: 12.5px;
    }
    .meta-row strong { font-weight: 700; }
    .filter-note {
      margin: 0 0 8px;
      font-size: 11.5px;
      color: #64748b;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${fontSize + 1.5}px;
      table-layout: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      overflow-wrap: anywhere;
    }
    thead { display: table-header-group; }   /* repeat header on every printed page */
    tfoot { display: table-footer-group; }
    thead th {
      background: #1B365D;
      color: #ffffff;
      font-weight: 700;
      text-align: center;
      border-color: #1B365D;
      padding: 7px 5px;
      vertical-align: middle;
    }
    thead th.left { text-align: left; }
    tbody tr { background: #ffffff; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr.row-fail { background: #fdecec !important; }
    tbody tr.row-pending { background: #fffbeb !important; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    td.empty { padding: 28px; text-align: center; color: #64748b; }
    .mono {
      font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      font-variant-numeric: tabular-nums;
    }
    .left { text-align: left; }
    .center { text-align: center; }
    .bold { font-weight: 600; }
    .nowrap { white-space: nowrap; }
    .name { font-weight: 500; min-width: 120px; }
    .dash { color: #d97706; }
    .fail-mark { color: #dc2626; font-weight: 700; }
    .status-pass { color: #0f172a; font-weight: 700; white-space: nowrap; }
    .status-fail { color: #dc2626; font-weight: 700; white-space: nowrap; }
    .status-pending { color: #d97706; font-weight: 700; white-space: nowrap; }
    .summary-strip {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(${summaryCols}, 1fr);
      border: 1px solid #cbd5e1;
      background: #eef4fb;
      break-inside: avoid;
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
    .summary-cell:last-child { border-right: none; }
    .signatures {
      margin-top: 44px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 40px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 170px;
      max-width: 100%;
      margin: 0 auto 6px;
      border-top: 1.5px solid #334155;
    }
    .sig-label { font-size: 12px; font-weight: 700; }
    .print-btn-bar { text-align: center; margin-bottom: 12px; }
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
    .table-wrapper { overflow-x: auto; }
    @media print {
      html, body { background: #fff; padding: 0; }
      body { padding: 0; }
      .result-sheet {
        border: none;
        box-shadow: none;
        border-radius: 0;
        padding: 0;
        max-width: 100%;
        width: 100%;
      }
      .table-wrapper { overflow: visible; }
      .print-btn-bar { display: none !important; }
      table { font-size: ${fontSize}pt; }
      th, td { padding: 3px 4px; }
      .sheet-header h1 { font-size: 18pt; }
      .sheet-header .subtitle { font-size: 9pt; }
      .meta-row { font-size: 9.5pt; padding: 4px 0 6px; }
      .summary-cell { font-size: 9pt; padding: 5px 6px; }
      .signatures { margin-top: 32px; }
    }
  </style>
</head>
<body>
  ${
    opts.showPrintButton
      ? '<div class="print-btn-bar"><button class="print-btn" onclick="window.print()">প্রিন্ট / PDF সংরক্ষণ করুন</button></div>'
      : ''
  }
  <div class="result-sheet">
    <div class="sheet-header">
      <h1>${escapeHtml(d.instituteTitle)}</h1>
      <p class="subtitle">সম্পূর্ণ ফলাফল তালিকা (COMPLETE CLASS RESULT SHEET)</p>
    </div>

    <div class="meta-row">
      <div><strong>পরীক্ষা:</strong> ${escapeHtml(d.examTitle)}</div>
      <div><strong>শ্রেণি:</strong> ${escapeHtml(d.classTitle)}</div>
      <div><strong>শাখা:</strong> ${escapeHtml(d.sectionTitle)}</div>
      <div><strong>মোট কার্যদিবস:</strong> <span class="mono">${d.totalWorkingDays}</span> দিন</div>
    </div>
    ${d.filterNote ? `<p class="filter-note">${escapeHtml(d.filterNote)}</p>` : ''}

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>নং</th>
            <th class="left">শিক্ষার্থীর নাম</th>
            ${subjectHeads}
            <th>মোট নম্বর</th>
            <th>উপস্থিতি</th>
            <th>জিপিএ</th>
            <th>গ্রেড</th>
            <th>মেধা স্থান</th>
            <th>ফলাফল</th>
          </tr>
        </thead>
        <tbody>${bodyRows}
        </tbody>
      </table>
    </div>

    <div class="summary-strip">
      <div class="summary-cell">মোট শিক্ষার্থী: <span class="mono">${d.total}</span></div>
      <div class="summary-cell">পাস: <span class="mono">${d.passedCount}</span></div>
      <div class="summary-cell">ফেল: <span class="mono">${d.failedCount}</span></div>
      ${d.pendingCount > 0 ? `<div class="summary-cell">অপেক্ষমাণ: <span class="mono">${d.pendingCount}</span></div>` : ''}
      <div class="summary-cell">পাসের হার: <span class="mono">${d.passRate}%</span></div>
      <div class="summary-cell">গড় উপস্থিতি: <span class="mono">${d.avgAttendance}%</span></div>
    </div>

    <div class="signatures">
      <div><div class="sig-line"></div><div class="sig-label">প্রস্তুতকারক</div></div>
      <div><div class="sig-line"></div><div class="sig-label">শ্রেণি শিক্ষক</div></div>
      <div><div class="sig-line"></div><div class="sig-label">প্রধান শিক্ষক</div></div>
    </div>
  </div>
</body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const CompleteResultModal: React.FC<CompleteResultModalProps> = ({
  isOpen,
  onClose,
  project,
  subjects,
  results
}) => {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('merit');

  const instituteTitle = (project.instituteName || '').trim() || project.name;
  const examTitle = (project.examName || '').trim() || project.name;
  const classTitle = (project.className || '').trim() || '—';
  const sectionTitle = (project.sectionName || '').trim() || '—';
  const totalWorkingDays = Number(project.totalWorkingDays) || 0;

  const { passedCount, failedCount, pendingCount, passRate } = useMemo(() => {
    const passed = results.filter(r => r.finalStatus === 'Pass').length;
    const failed = results.filter(r => r.finalStatus === 'Fail').length;
    const pending = results.filter(r => r.finalStatus === 'Pending').length;
    return {
      passedCount: passed,
      failedCount: failed,
      pendingCount: pending,
      passRate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0
    };
  }, [results]);

  const avgAttendance = useMemo(() => {
    if (results.length === 0 || totalWorkingDays <= 0) return 0;
    const totalAtt = results.reduce((sum, r) => sum + Number(r.totalAttendance ?? 0), 0);
    return Math.round((totalAtt / (results.length * totalWorkingDays)) * 100);
  }, [results, totalWorkingDays]);

  // Filter, then sort
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
          if (a.meritPosition == null && b.meritPosition == null) return 0;
          if (a.meritPosition == null) return 1;
          if (b.meritPosition == null) return -1;
          return a.meritPosition - b.meritPosition;
        }
        case 'gpa-desc': {
          if (a.gpa == null && b.gpa == null) return 0;
          if (a.gpa == null) return 1;
          if (b.gpa == null) return -1;
          if (b.gpa !== a.gpa) return b.gpa - a.gpa;
          return b.totalObtainedMarks - a.totalObtainedMarks;
        }
        case 'gpa-asc': {
          if (a.gpa == null && b.gpa == null) return 0;
          if (a.gpa == null) return 1;
          if (b.gpa == null) return -1;
          if (a.gpa !== b.gpa) return a.gpa - b.gpa;
          return a.totalObtainedMarks - b.totalObtainedMarks;
        }
        case 'marks-desc': {
          if (b.totalObtainedMarks !== a.totalObtainedMarks) {
            return b.totalObtainedMarks - a.totalObtainedMarks;
          }
          return (b.gpa ?? 0) - (a.gpa ?? 0);
        }
        case 'marks-asc':
          return a.totalObtainedMarks - b.totalObtainedMarks;
        case 'name-asc':
          return a.studentName.localeCompare(b.studentName, 'bn');
        case 'name-desc':
          return b.studentName.localeCompare(a.studentName, 'bn');
        default:
          return 0;
      }
    });
  }, [results, filter, sortBy]);

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const getSheetHtml = useCallback(
    (showPrintButton: boolean) =>
      buildSheetHtml(
        {
          instituteTitle,
          examTitle,
          classTitle,
          sectionTitle,
          totalWorkingDays,
          subjects,
          rows: processedResults,
          total: results.length,
          passedCount,
          failedCount,
          pendingCount,
          passRate,
          avgAttendance,
          filterNote:
            filter === 'all' ? '' : `ফিল্টার: ${FILTER_LABEL[filter]} (${processedResults.length} জন)`
        },
        { showPrintButton }
      ),
    [
      instituteTitle,
      examTitle,
      classTitle,
      sectionTitle,
      totalWorkingDays,
      subjects,
      processedResults,
      results.length,
      passedCount,
      failedCount,
      pendingCount,
      passRate,
      avgAttendance,
      filter
    ]
  );

  if (!isOpen) return null;

  /**
   * Print through an isolated hidden iframe so that:
   *  - only the result sheet is printed (not the whole app behind the modal),
   *  - the A4-landscape @page rule is honoured,
   *  - the app's Tailwind/print styles can't interfere.
   */
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      setTimeout(() => iframe.parentNode?.removeChild(iframe), 500);
    };

    iframe.onload = async () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      try {
        // Wait for web fonts (max 2s) so Bengali text doesn't print with fallback glyphs
        const fonts = (win.document as Document & { fonts?: FontFaceSet }).fonts;
        if (fonts?.ready) {
          await Promise.race([fonts.ready, new Promise(res => setTimeout(res, 2000))]);
        }
      } catch {
        /* ignore font loading errors */
      }
      win.onafterprint = cleanup;
      win.focus();
      win.print();
      setTimeout(cleanup, 60_000); // safety net for browsers without afterprint
    };

    iframe.srcdoc = getSheetHtml(false);
    document.body.appendChild(iframe);
  };

  const handleDownload = () => {
    const blob = new Blob([getSheetHtml(true)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${toSafeFileName(project.name)}_সম্পূর্ণ_ফলাফল.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const renderStatus = (status: FinalStatus) => {
    if (status === 'Pass') return <span className="font-bold text-slate-900">পাস</span>;
    if (status === 'Fail') return <span className="font-bold text-rose-600">ফেল</span>;
    return <span className="font-bold text-amber-600">অপেক্ষমাণ</span>;
  };

  const filterTabs: { key: FilterOption; label: string; count: number; active: string; hover: string }[] = [
    { key: 'all', label: 'সকল', count: results.length, active: 'text-slate-900', hover: 'hover:text-slate-900' },
    { key: 'pass', label: 'পাস', count: passedCount, active: 'text-emerald-700', hover: 'hover:text-emerald-700' },
    { key: 'fail', label: 'ফেল', count: failedCount, active: 'text-rose-600', hover: 'hover:text-rose-600' },
    { key: 'pending', label: 'অপেক্ষমাণ', count: pendingCount, active: 'text-amber-600', hover: 'hover:text-amber-600' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="সম্পূর্ণ ফলাফল তালিকা"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-6xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">সম্পূর্ণ ফলাফল তালিকা (Master Sheet)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রজেক্ট: <span className="font-semibold text-slate-800">{project.name}</span> · মোট শিক্ষার্থী:{' '}
              <span className="font-mono-numbers font-semibold text-slate-800">{results.length}</span> জন
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
              aria-label="বন্ধ করুন"
              className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 active:bg-slate-200 rounded-lg transition-colors cursor-pointer ml-1"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-7 bg-white overflow-y-auto flex-1 space-y-4">
          <div className="text-center space-y-1 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B365D] tracking-wide uppercase">
              {instituteTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wider uppercase">
              সম্পূর্ণ ফলাফল তালিকা (COMPLETE CLASS RESULT SHEET)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-4 px-1 py-2 text-xs sm:text-sm text-slate-900 border-b border-slate-200">
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

          {/* Filter + sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto no-scrollbar">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  type="button"
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filter === tab.key
                      ? `bg-white ${tab.active} shadow-xs font-semibold`
                      : `text-slate-600 ${tab.hover}`
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="result-sort"
                className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                সাজান:
              </label>
              <select
                id="result-sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
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

          {/* Table */}
          <div className="border border-slate-300 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-[#1B365D] text-white font-bold text-xs">
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] w-10">নং</th>
                  <th className="py-2.5 px-3 text-left border border-[#1B365D] min-w-[140px]">শিক্ষার্থীর নাম</th>
                  {subjects.map(s => (
                    <th key={s._id} className="py-2.5 px-2 text-center border border-[#1B365D] whitespace-nowrap">
                      {s.name}
                    </th>
                  ))}
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">মোট নম্বর</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">উপস্থিতি</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">জিপিএ</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">গ্রেড</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">মেধা স্থান</th>
                  <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {processedResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={subjects.length + 8}
                      className="py-8 text-center text-slate-500 text-sm border border-slate-300"
                    >
                      কোনো ফলাফল পাওয়া যায়নি
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
                      <tr key={r.studentId} className={rowBg}>
                        <td className="py-2 px-2.5 text-center font-mono-numbers text-slate-700 border border-slate-300">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 border border-slate-300 whitespace-nowrap">
                          {r.studentName}
                        </td>
                        {subjects.map(s => {
                          const subRes = r.subjectResults.find(sr => sr.subjectId === s._id);
                          if (!subRes || subRes.obtainedMarks === null || subRes.obtainedMarks === undefined) {
                            return (
                              <td
                                key={s._id}
                                className="py-2 px-2 text-center font-mono-numbers text-amber-600 border border-slate-300"
                              >
                                —
                              </td>
                            );
                          }
                          const isFail = subRes.grade === 'F' || subRes.status === 'Fail';
                          return (
                            <td
                              key={s._id}
                              className={`py-2 px-2 text-center font-mono-numbers border border-slate-300 ${
                                isFail ? 'text-rose-600 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {subRes.obtainedMarks}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2.5 text-center font-mono-numbers font-semibold text-slate-900 border border-slate-300">
                          {r.totalObtainedMarks}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono-numbers text-slate-800 border border-slate-300 whitespace-nowrap">
                          {r.totalAttendance ?? 0}/{totalWorkingDays}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono-numbers font-semibold text-slate-900 border border-slate-300">
                          {r.gpa !== null && r.gpa !== undefined ? r.gpa.toFixed(2) : '—'}
                        </td>
                        <td
                          className={`py-2 px-2.5 text-center font-semibold border border-slate-300 ${
                            gradeText === 'F' ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {gradeText}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono-numbers font-semibold text-slate-900 border border-slate-300">
                          {r.meritPosition !== null && r.meritPosition !== undefined ? r.meritPosition : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-center border border-slate-300 whitespace-nowrap">
                          {renderStatus(r.finalStatus)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary strip */}
          <div
            className={`grid grid-cols-2 ${
              pendingCount > 0 ? 'sm:grid-cols-6' : 'sm:grid-cols-5'
            } border border-slate-300 bg-[#EEF4FB] text-xs font-bold text-[#1B365D]`}
          >
            <div className="py-2.5 px-3 text-center border-b sm:border-b-0 border-r border-slate-300">
              মোট শিক্ষার্থী: <span className="font-mono-numbers">{results.length}</span>
            </div>
            <div className="py-2.5 px-3 text-center border-b sm:border-b-0 sm:border-r border-slate-300">
              পাস: <span className="font-mono-numbers">{passedCount}</span>
            </div>
            <div className="py-2.5 px-3 text-center border-b sm:border-b-0 border-r border-slate-300">
              ফেল: <span className="font-mono-numbers">{failedCount}</span>
            </div>
            {pendingCount > 0 && (
              <div className="py-2.5 px-3 text-center border-b sm:border-b-0 sm:border-r border-slate-300">
                অপেক্ষমাণ: <span className="font-mono-numbers">{pendingCount}</span>
              </div>
            )}
            <div className="py-2.5 px-3 text-center sm:border-r border-slate-300">
              পাসের হার: <span className="font-mono-numbers">{passRate}%</span>
            </div>
            <div className="col-span-2 sm:col-span-1 py-2.5 px-3 text-center border-t sm:border-t-0 border-slate-300">
              গড় উপস্থিতি: <span className="font-mono-numbers">{avgAttendance}%</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 sm:gap-10 pt-10 pb-2 text-center">
            {['প্রস্তুতকারক', 'শ্রেণি শিক্ষক', 'প্রধান শিক্ষক'].map(label => (
              <div key={label}>
                <div className="border-t border-slate-700 w-28 sm:w-44 mx-auto pt-1.5 text-[11px] sm:text-xs font-bold text-slate-900">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
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

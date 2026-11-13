import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { MarksheetData } from '../../types';
import { downloadHtmlAsPdf } from '../../utils/pdfExport';

interface MarksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MarksheetData | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toSafeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/^\.+/, '')
    .trim();
  return cleaned || 'marksheet';
}

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

function getAttendanceRateText(attendance: number, workingDays: number): string {
  if (!workingDays || workingDays <= 0) return '—';
  const pct = (attendance / workingDays) * 100;
  return `${pct.toFixed(1)}%`;
}

function buildMarksheetHtml(data: MarksheetData, opts: { forPdf?: boolean } = {}): string {
  const instituteHeading = escapeHtml((data.instituteName || '').trim() || data.projectName);
  const examTitle = escapeHtml((data.examName || '').trim() || data.projectName);
  const classTitle = escapeHtml((data.className || '').trim() || '—');
  const sectionTitle = escapeHtml((data.sectionName || '').trim() || '—');
  const rollTitle = escapeHtml((data.rollNo || '').trim() || '—');
  const studentCodeTitle = escapeHtml((data.studentCode || '').trim() || '—');
  const attendanceVal = Number(data.totalAttendance ?? 0);
  const workingDaysVal = Number(data.totalWorkingDays ?? 0);
  const attendanceRate = getAttendanceRateText(attendanceVal, workingDaysVal);
  const finalGrade = getOverallGrade(data.gpa, data.finalStatus);

  const statusText =
    data.finalStatus === 'Pass' ? 'পাস' : data.finalStatus === 'Fail' ? 'ফেল' : 'অপেক্ষমাণ';
  const statusClass =
    data.finalStatus === 'Pass'
      ? 'status-pass'
      : data.finalStatus === 'Fail'
      ? 'status-fail'
      : 'status-pending';

  const subjectRows =
    data.subjectResults.length === 0
      ? `<tr><td colspan="6" class="empty">কোনো বিষয় পাওয়া যায়নি</td></tr>`
      : data.subjectResults
          .map(sub => {
            const isFail = sub.grade === 'F' || sub.status === 'Fail';
            const highestText =
              sub.highestMarks !== null && sub.highestMarks !== undefined
                ? escapeHtml(sub.highestMarks)
                : '—';
            const obtainedText =
              sub.obtainedMarks !== null && sub.obtainedMarks !== undefined
                ? escapeHtml(sub.obtainedMarks)
                : '—';
            const gradeText = sub.grade !== null ? escapeHtml(sub.grade) : 'অপেক্ষমাণ';
            const gpText = sub.gradePoint !== null ? sub.gradePoint.toFixed(2) : '—';

            return `
          <tr>
            <td class="left bold">${escapeHtml(sub.subjectName)}</td>
            <td class="center mono">${escapeHtml(sub.totalMarks)}</td>
            <td class="center mono">${highestText}</td>
            <td class="center mono bold${isFail ? ' fail-text' : ''}">${obtainedText}</td>
            <td class="center bold${isFail ? ' fail-text' : ''}">${gradeText}</td>
            <td class="center mono${isFail ? ' fail-text' : ''}">${gpText}</td>
          </tr>`;
          })
          .join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.studentName)} - একাডেমিক মার্কশিট</title>
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
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: ${opts.forPdf ? '0' : '16px'};
      background: ${opts.forPdf ? '#ffffff' : '#f1f5f9'};
      color: #0f172a;
      font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Kalpurush', 'Nirmala UI', 'Segoe UI', Arial, sans-serif;
      line-height: 1.4;
    }
    .marksheet-box {
      width: 100%;
      max-width: ${opts.forPdf ? 'none' : '740px'};
      margin: 0 auto;
      background: #ffffff;
      border: ${opts.forPdf ? 'none' : '1px solid #cbd5e1'};
      border-radius: ${opts.forPdf ? '0' : '6px'};
      padding: ${opts.forPdf ? '8px 10px' : '28px 32px'};
      box-shadow: ${opts.forPdf ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.05)'};
    }
    .header {
      text-align: center;
      border-bottom: 1.5px solid #94a3b8;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #1B365D;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    .header .subtitle {
      margin: 3px 0 0;
      font-size: 12.5px;
      font-weight: 700;
      color: #1B365D;
      letter-spacing: 0.6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-table {
      margin-bottom: 12px;
      font-size: 12px;
    }
    .meta-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 9px;
      vertical-align: middle;
    }
    .meta-label {
      background: #f8fafc;
      color: #475569;
      font-weight: 500;
      white-space: nowrap;
    }
    .meta-value {
      background: #ffffff;
      color: #0f172a;
      font-weight: 600;
    }
    .section-title {
      margin: 16px 0 6px;
      font-size: 12px;
      font-weight: 700;
      color: #1B365D;
      letter-spacing: 0.4px;
    }
    .result-table {
      font-size: 12.5px;
    }
    .result-table th,
    .result-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
    }
    .result-table thead th {
      background: #1B365D;
      color: #ffffff;
      border-color: #1B365D;
      font-weight: 700;
      text-align: center;
    }
    .result-table thead th.left {
      text-align: left;
    }
    .result-table tbody tr {
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .result-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .empty {
      text-align: center;
      color: #64748b;
      padding: 20px !important;
    }
    .left { text-align: left; }
    .center { text-align: center; }
    .bold { font-weight: 600; }
    .mono {
      font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      font-variant-numeric: tabular-nums;
    }
    .fail-text {
      color: #dc2626 !important;
      font-weight: 700;
    }
    .summary-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
      margin-top: 6px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .summary-table {
      font-size: 12px;
    }
    .summary-table th,
    .summary-table td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
    }
    .summary-table th.overall-head {
      background: #1B365D;
      color: #ffffff;
      border-color: #1B365D;
      font-weight: 700;
      text-align: left;
      letter-spacing: 0.3px;
    }
    .summary-table td.sum-label {
      background: #f8fafc;
      color: #475569;
      font-weight: 500;
      width: 52%;
    }
    .summary-table td.sum-val {
      background: #ffffff;
      color: #0f172a;
      font-weight: 600;
    }
    .summary-table td.sum-val-strong {
      background: #ffffff;
      color: #0f172a;
      font-weight: 700;
    }
    .status-pass { color: #15803d !important; font-weight: 700; }
    .status-fail { color: #dc2626 !important; font-weight: 700; }
    .status-pending { color: #d97706 !important; font-weight: 700; }
    .signatures {
      margin-top: 56px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-col {
      padding-left: 16px;
      padding-right: 16px;
    }
    .sig-line {
      width: 190px;
      max-width: 100%;
      margin: 0 auto 6px;
      border-top: 1.5px solid #475569;
    }
    .sig-label {
      text-align: center;
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
    }
    .footer-note {
      margin-top: 22px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 10px;
      color: #64748b;
      text-align: left;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    @media print {
      html, body { background: #ffffff; padding: 0; }
      .marksheet-box { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="marksheet-box">
    <div class="header">
      <h1>${instituteHeading}</h1>
      <p class="subtitle">একাডেমিক মার্কশিট (ACADEMIC MARKSHEET)</p>
    </div>

    <table class="meta-table">
      <tbody>
        <tr>
          <td class="meta-label" style="width: 12%;">পরীক্ষা</td>
          <td class="meta-value" style="width: 34%;">${examTitle}</td>
          <td class="meta-label" style="width: 10%;">শ্রেণি</td>
          <td class="meta-value" style="width: 16%;">${classTitle}</td>
          <td class="meta-label" style="width: 10%;">শাখা</td>
          <td class="meta-value" style="width: 18%;">${sectionTitle}</td>
        </tr>
      </tbody>
    </table>

    <table class="meta-table">
      <tbody>
        <tr>
          <td class="meta-label" style="width: 18%;">শিক্ষার্থীর নাম</td>
          <td class="meta-value" style="width: 36%;">${escapeHtml(data.studentName)}</td>
          <td class="meta-label" style="width: 15%;">রোল নং</td>
          <td class="meta-value mono" style="width: 31%;">${rollTitle}</td>
        </tr>
        <tr>
          <td class="meta-label">শিক্ষার্থী আইডি</td>
          <td class="meta-value mono">${studentCodeTitle}</td>
          <td class="meta-label">উপস্থিতি</td>
          <td class="meta-value mono">${attendanceVal} / ${workingDaysVal} দিন</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">বিষয়ভিত্তিক ফলাফল (SUBJECT-WISE RESULT)</div>
    <table class="result-table">
      <thead>
        <tr>
          <th class="left">বিষয়</th>
          <th style="width: 13%;">পূর্ণমান</th>
          <th style="width: 15%;">সর্বোচ্চ নম্বর</th>
          <th style="width: 15%;">প্রাপ্ত নম্বর</th>
          <th style="width: 12%;">গ্রেড</th>
          <th style="width: 12%;">জিপি (GP)</th>
        </tr>
      </thead>
      <tbody>${subjectRows}
      </tbody>
    </table>

    <div class="section-title" style="margin-top: 18px;">ফলাফল সারসংক্ষেপ (RESULT SUMMARY)</div>
    <div class="summary-row">
      <table class="summary-table">
        <tbody>
          <tr>
            <td class="sum-label">মোট উপস্থিতি</td>
            <td class="sum-val mono">${attendanceVal} / ${workingDaysVal} দিন</td>
          </tr>
          <tr>
            <td class="sum-label">উপস্থিতির হার</td>
            <td class="sum-val mono">${attendanceRate}</td>
          </tr>
          <tr>
            <td class="sum-label">মেধা স্থান</td>
            <td class="sum-val mono">${data.meritPosition !== null && data.meritPosition !== undefined ? escapeHtml(data.meritPosition) : '—'}</td>
          </tr>
        </tbody>
      </table>

      <table class="summary-table">
        <thead>
          <tr>
            <th colspan="2" class="overall-head">সামগ্রিক ফলাফল (OVERALL RESULT)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="sum-label">মোট নম্বর</td>
            <td class="sum-val-strong mono">${escapeHtml(data.totalObtainedMarks)} / ${escapeHtml(data.totalFullMarks)}</td>
          </tr>
          <tr>
            <td class="sum-label">জিপিএ (GPA)</td>
            <td class="sum-val-strong mono">${data.gpa !== null && data.gpa !== undefined ? `${data.gpa.toFixed(2)} / 5.00` : '—'}</td>
          </tr>
          <tr>
            <td class="sum-label">চূড়ান্ত গ্রেড</td>
            <td class="sum-val-strong${finalGrade === 'F' ? ' fail-text' : ''}">${finalGrade}</td>
          </tr>
          <tr>
            <td class="sum-label">ফলাফল</td>
            <td class="sum-val-strong ${statusClass}">${statusText}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-label">শ্রেণি শিক্ষক</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-label">প্রধান শিক্ষক</div>
      </div>
    </div>

    <div class="footer-note">
      গ্রেডিং স্কেল: A+ (৮০-১০০%, ৫.০০) · A (৭০-৭৯%, ৪.০০) · A- (৬০-৬৯%, ৩.৫০) · B (৫০-৫৯%, ৩.০০) · C (৪০-৪৯%, ২.০০) · D (৩৩-৩৯%, ১.০০) · F (০-৩২%, ০.০০)
    </div>
  </div>
</body>
</html>`;
}

export const MarksheetModal: React.FC<MarksheetModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

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

  if (!isOpen || !data) return null;

  const instituteHeading = (data.instituteName || '').trim() || data.projectName;
  const examTitle = (data.examName || '').trim() || data.projectName;
  const classTitle = (data.className || '').trim() || '—';
  const sectionTitle = (data.sectionName || '').trim() || '—';
  const rollTitle = (data.rollNo || '').trim() || '—';
  const studentCodeTitle = (data.studentCode || '').trim() || '—';
  const attendanceVal = Number(data.totalAttendance ?? 0);
  const workingDaysVal = Number(data.totalWorkingDays ?? 0);
  const attendanceRate = getAttendanceRateText(attendanceVal, workingDaysVal);
  const finalGrade = getOverallGrade(data.gpa, data.finalStatus);

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
        const fonts = (win.document as Document & { fonts?: FontFaceSet }).fonts;
        if (fonts?.ready) {
          await Promise.race([fonts.ready, new Promise(res => setTimeout(res, 2000))]);
        }
      } catch {
        // ignore font loading errors
      }
      win.onafterprint = cleanup;
      win.focus();
      win.print();
      setTimeout(cleanup, 60_000);
    };

    iframe.srcdoc = buildMarksheetHtml(data, { forPdf: true });
    document.body.appendChild(iframe);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadError('');
    try {
      await downloadHtmlAsPdf({
        html: buildMarksheetHtml(data, { forPdf: true }),
        filename: `${toSafeFileName(data.studentName)}_মার্কশিট.pdf`,
        targetSelector: '.marksheet-box',
        orientation: 'portrait',
        renderWidthPx: 760,
        marginMm: 10
      });
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'PDF ডাউনলোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderStatus = (status: 'Pass' | 'Fail' | 'Pending') => {
    if (status === 'Pass') {
      return <span className="text-emerald-700 font-bold">পাস</span>;
    }
    if (status === 'Fail') {
      return <span className="text-rose-600 font-bold">ফেল</span>;
    }
    return <span className="text-amber-600 font-bold">অপেক্ষমাণ</span>;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="শিক্ষার্থীর একাডেমিক মার্কশিট"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-6 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">শিক্ষার্থীর একাডেমিক মার্কশিট</h3>
            <p className="text-xs text-slate-500 mt-0.5">{data.studentName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="মার্কশিট প্রিন্ট বা PDF আকারে সংরক্ষণ করুন"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-white bg-[#1B365D] hover:bg-slate-800 active:bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
              title="PDF ফাইল হিসেবে ডাউনলোড করুন"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloading ? 'PDF তৈরি হচ্ছে...' : 'ডাউনলোড PDF'}</span>
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

        {downloadError && (
          <div className="px-4 sm:px-6 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-medium shrink-0">
            {downloadError}
          </div>
        )}

        {/* Academic Marksheet Sheet Body */}
        <div className="p-4 sm:p-8 bg-white overflow-y-auto flex-1 space-y-4">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-300 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1B365D] tracking-wide uppercase">
              {instituteHeading}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-[#1B365D] tracking-wider uppercase mt-0.5">
              একাডেমিক মার্কশিট (ACADEMIC MARKSHEET)
            </p>
          </div>

          {/* Exam Metadata Strip */}
          <div className="border border-slate-300 overflow-hidden text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-6">
              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-b sm:border-b-0 border-r border-slate-300">
                পরীক্ষা
              </div>
              <div className="bg-white text-slate-900 font-semibold px-2.5 py-2 border-b sm:border-b-0 sm:border-r border-slate-300 sm:col-span-1">
                {examTitle}
              </div>
              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-b sm:border-b-0 border-r border-slate-300">
                শ্রেণি
              </div>
              <div className="bg-white text-slate-900 font-semibold px-2.5 py-2 border-b sm:border-b-0 sm:border-r border-slate-300">
                {classTitle}
              </div>
              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-r border-slate-300">
                শাখা
              </div>
              <div className="bg-white text-slate-900 font-semibold px-2.5 py-2">
                {sectionTitle}
              </div>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="border border-slate-300 overflow-hidden text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-b border-r border-slate-300">
                শিক্ষার্থীর নাম
              </div>
              <div className="bg-white text-slate-900 font-semibold px-2.5 py-2 border-b sm:border-r border-slate-300">
                {data.studentName}
              </div>
              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-b border-r border-slate-300">
                রোল নং
              </div>
              <div className="bg-white text-slate-900 font-semibold font-mono-numbers px-2.5 py-2 border-b border-slate-300">
                {rollTitle}
              </div>

              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-b sm:border-b-0 border-r border-slate-300">
                শিক্ষার্থী আইডি
              </div>
              <div className="bg-white text-slate-900 font-semibold font-mono-numbers px-2.5 py-2 border-b sm:border-b-0 sm:border-r border-slate-300">
                {studentCodeTitle}
              </div>
              <div className="bg-slate-50 text-slate-600 font-medium px-2.5 py-2 border-r border-slate-300">
                উপস্থিতি
              </div>
              <div className="bg-white text-slate-900 font-semibold font-mono-numbers px-2.5 py-2">
                {attendanceVal} / {workingDaysVal} দিন
              </div>
            </div>
          </div>

          {/* Subject-Wise Result Table */}
          <div>
            <h3 className="text-xs font-bold text-[#1B365D] uppercase tracking-wider mb-1.5">
              বিষয়ভিত্তিক ফলাফল (SUBJECT-WISE RESULT)
            </h3>
            <div className="border border-slate-300 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[460px] border-collapse">
                <thead>
                  <tr className="bg-[#1B365D] text-white font-bold text-xs">
                    <th className="py-2.5 px-3 text-left border border-[#1B365D]">বিষয়</th>
                    <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">পূর্ণমান</th>
                    <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">সর্বোচ্চ নম্বর</th>
                    <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">প্রাপ্ত নম্বর</th>
                    <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">গ্রেড</th>
                    <th className="py-2.5 px-2.5 text-center border border-[#1B365D] whitespace-nowrap">জিপি (GP)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjectResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 text-sm border border-slate-300">
                        কোনো বিষয় পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    data.subjectResults.map((sub, idx) => {
                      const isFail = sub.grade === 'F' || sub.status === 'Fail';
                      return (
                        <tr key={sub.subjectId} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-2 px-3 font-semibold text-slate-800 border border-slate-300">
                            {sub.subjectName}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono-numbers text-slate-700 border border-slate-300">
                            {sub.totalMarks}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono-numbers text-slate-700 border border-slate-300">
                            {sub.highestMarks !== null && sub.highestMarks !== undefined ? sub.highestMarks : '—'}
                          </td>
                          <td
                            className={`py-2 px-2.5 text-center font-mono-numbers font-bold border border-slate-300 ${
                              isFail ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {sub.obtainedMarks !== null && sub.obtainedMarks !== undefined ? sub.obtainedMarks : '—'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold border border-slate-300">
                            {sub.grade !== null ? (
                              <span className={isFail ? 'text-rose-600' : 'text-slate-900'}>{sub.grade}</span>
                            ) : (
                              <span className="text-amber-600 text-xs">অপেক্ষমাণ</span>
                            )}
                          </td>
                          <td
                            className={`py-2 px-2.5 text-center font-mono-numbers border border-slate-300 ${
                              isFail ? 'text-rose-600 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {sub.gradePoint !== null ? sub.gradePoint.toFixed(2) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Result Summary Two-Column Tables */}
          <div>
            <h3 className="text-xs font-bold text-[#1B365D] uppercase tracking-wider mb-1.5">
              ফলাফল সারসংক্ষেপ (RESULT SUMMARY)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
              {/* Left Summary Table */}
              <table className="w-full text-xs border-collapse border border-slate-300">
                <tbody>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300 w-1/2">
                      মোট উপস্থিতি
                    </td>
                    <td className="bg-white text-slate-900 font-semibold font-mono-numbers px-3 py-2 border border-slate-300">
                      {attendanceVal} / {workingDaysVal} দিন
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300">
                      উপস্থিতির হার
                    </td>
                    <td className="bg-white text-slate-900 font-semibold font-mono-numbers px-3 py-2 border border-slate-300">
                      {attendanceRate}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300">
                      মেধা স্থান
                    </td>
                    <td className="bg-white text-slate-900 font-semibold font-mono-numbers px-3 py-2 border border-slate-300">
                      {data.meritPosition !== null && data.meritPosition !== undefined ? (
                        data.meritPosition
                      ) : (
                        <span className="text-slate-400 font-normal">অপেক্ষমাণ</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Right Overall Result Table */}
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr>
                    <th
                      colSpan={2}
                      className="bg-[#1B365D] text-white font-bold text-left px-3 py-2 border border-[#1B365D] tracking-wide uppercase"
                    >
                      সামগ্রিক ফলাফল (OVERALL RESULT)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300 w-1/2">
                      মোট নম্বর
                    </td>
                    <td className="bg-white text-slate-900 font-bold font-mono-numbers px-3 py-2 border border-slate-300">
                      {data.totalObtainedMarks} / {data.totalFullMarks}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300">
                      জিপিএ (GPA)
                    </td>
                    <td className="bg-white text-slate-900 font-bold font-mono-numbers px-3 py-2 border border-slate-300">
                      {data.gpa !== null && data.gpa !== undefined ? `${data.gpa.toFixed(2)} / 5.00` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300">
                      চূড়ান্ত গ্রেড
                    </td>
                    <td
                      className={`bg-white font-bold px-3 py-2 border border-slate-300 ${
                        finalGrade === 'F' ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {finalGrade}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 text-slate-600 font-medium px-3 py-2 border border-slate-300">
                      ফলাফল
                    </td>
                    <td className="bg-white px-3 py-2 border border-slate-300">
                      {renderStatus(data.finalStatus)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Two-Column Signatures */}
          <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-10 pb-2 text-center">
            {['শ্রেণি শিক্ষক', 'প্রধান শিক্ষক'].map(label => (
              <div key={label}>
                <div className="border-t border-slate-600 w-32 sm:w-44 mx-auto pt-1.5 text-xs font-bold text-slate-600">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Grading Scale */}
          <div className="pt-2.5 border-t border-slate-300 text-[11px] text-slate-500">
            গ্রেডিং স্কেল: A+ (৮০-১০০%, ৫.০০) · A (৭০-৭৯%, ৪.০০) · A- (৬০-৬৯%, ৩.৫০) · B (৫০-৫৯%, ৩.০০) · C (৪০-৪৯%, ২.০০) · D (৩৩-৩৯%, ১.০০) · F (০-৩২%, ০.০০)
          </div>
        </div>

        {/* Modal Footer */}
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

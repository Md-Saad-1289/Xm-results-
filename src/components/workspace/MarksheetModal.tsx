import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { MarksheetData } from '../../types';

interface MarksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MarksheetData | null;
}

export const MarksheetModal: React.FC<MarksheetModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.studentName} - মার্কশিট</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 16px;
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Hind Siliguri', sans-serif;
    }
    .marksheet-box {
      width: 100%;
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      color: #0f172a;
    }
    .header p {
      margin: 3px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      font-size: 13px;
    }
    .info-row strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 13px;
      table-layout: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-top: 20px;
      text-align: center;
    }
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 4px;
    }
    .summary-card span {
      display: block;
      font-size: 10.5px;
      color: #64748b;
    }
    .summary-card strong {
      display: block;
      font-size: 14px;
      margin-top: 3px;
      color: #0f172a;
    }
    .status-pass { color: #15803d; }
    .status-fail { color: #dc2626; }
    .status-pending { color: #d97706; }
    .footer-note {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #64748b;
      text-align: center;
    }
    .print-btn-bar {
      text-align: center;
      margin-bottom: 12px;
    }
    .print-btn {
      background: #0f172a;
      color: #fff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      font-weight: 600;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .marksheet-box { border: none; box-shadow: none; padding: 0; width: 100%; max-width: 100%; }
      .print-btn-bar { display: none; }
      table { width: 100% !important; max-width: 100% !important; font-size: 10pt; }
      th, td { padding: 6px 8px !important; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF সংরক্ষণ করুন</button>
  </div>
  <div class="marksheet-box">
    <div class="header">
      <h1>${data.instituteName || data.projectName}</h1>
      <p>অফিসিয়াল মার্কশিট ও ফলাফল বিবরণী${data.examName ? ` · ${data.examName}` : ''}${data.className ? ` · শ্রেণি: ${data.className}` : ''}${data.sectionName ? ` · শাখা: ${data.sectionName}` : ''}</p>
      <div class="info-row">
        <div>শিক্ষার্থীর নাম: <strong>${data.studentName}</strong></div>
        <div>মোট উপস্থিতি: <strong class="font-mono">${data.totalAttendance ?? 0} / ${data.totalWorkingDays} দিন</strong></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>বিষয়</th>
          <th class="text-right" style="width: 80px;">পূর্ণমান</th>
          <th class="text-right" style="width: 85px;">প্রাপ্ত নম্বর</th>
          <th class="text-center" style="width: 65px;">গ্রেড</th>
          <th class="text-right" style="width: 95px;">গ্রেড পয়েন্ট</th>
        </tr>
      </thead>
      <tbody>
        ${data.subjectResults.map(sub => `
          <tr>
            <td><strong>${sub.subjectName}</strong></td>
            <td class="text-right font-mono">${sub.totalMarks}</td>
            <td class="text-right font-mono"><strong>${sub.obtainedMarks !== null ? sub.obtainedMarks : '—'}</strong></td>
            <td class="text-center"><strong>${sub.grade !== null ? sub.grade : 'অপেক্ষমাণ'}</strong></td>
            <td class="text-right font-mono">${sub.gradePoint !== null ? sub.gradePoint.toFixed(2) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="summary-grid">
      <div class="summary-card">
        <span>মোট প্রাপ্ত নম্বর</span>
        <strong class="font-mono">${data.totalObtainedMarks}</strong>
      </div>
      <div class="summary-card">
        <span>সর্বমোট পূর্ণমান</span>
        <strong class="font-mono">${data.totalFullMarks}</strong>
      </div>
      <div class="summary-card">
        <span>জিপিএ (GPA)</span>
        <strong class="font-mono">${data.gpa !== null ? data.gpa.toFixed(2) : '—'}</strong>
      </div>
      <div class="summary-card">
        <span>মেধা স্থান (Merit)</span>
        <strong class="font-mono" style="color: #4338ca;">${data.meritPosition !== null ? data.meritPosition : '—'}</strong>
      </div>
      <div class="summary-card">
        <span>চূড়ান্ত ফলাফল</span>
        <strong class="${data.finalStatus === 'Pass' ? 'status-pass' : data.finalStatus === 'Fail' ? 'status-fail' : 'status-pending'}">
          ${data.finalStatus === 'Pass' ? 'পাস' : data.finalStatus === 'Fail' ? 'ফেল' : 'অপেক্ষমাণ'}
        </strong>
      </div>
    </div>
    <div class="footer-note">
      গ্রেডিং স্কেল: A+ (৮০-১০০%, ৫.০০) · A (৭০-৭৯%, ৪.০০) · A- (৬০-৬৯%, ৩.৫০) · B (৫০-৫৯%, ৩.০০) · C (৪০-৪৯%, ২.০০) · D (৩৩-৩৯%, ১.০০) · F (০-৩২%, ০.০০)
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.studentName.replace(/\s+/g, '_')}_মার্কশিট.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: 'Pass' | 'Fail' | 'Pending') => {
    if (status === 'Pass') {
      return <span className="text-emerald-700 font-bold">পাস</span>;
    }
    if (status === 'Fail') {
      return <span className="text-rose-600 font-bold">ফেল</span>;
    }
    return <span className="text-amber-600 font-bold">অপেক্ষমাণ</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-0 sm:my-8 animate-in slide-in-from-bottom sm:slide-in-from-none sm:fade-in sm:zoom-in-95 duration-150 max-h-[94vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0 print:hidden">
          <span className="text-sm font-bold text-slate-800">শিক্ষার্থীর মার্কশিট</span>
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
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg transition-colors cursor-pointer shadow-xs"
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

        {/* Printable Marksheet Content (scrollable body) */}
        <div className="p-4 sm:p-8 bg-white overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="border-b border-slate-300 pb-4 text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-[#1B365D]">{data.instituteName || data.projectName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              অফিসিয়াল মার্কশিট ও ফলাফল বিবরণী
              {data.examName ? ` · ${data.examName}` : ''}
              {data.className ? ` · শ্রেণি: ${data.className}` : ''}
              {data.sectionName ? ` · শাখা: ${data.sectionName}` : ''}
            </p>
            
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
              <div className="text-left">
                <span className="text-slate-400 text-[11px] block">শিক্ষার্থীর নাম</span>
                <span className="font-bold text-slate-900 text-base">{data.studentName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">মোট উপস্থিতি</span>
                <span className="font-bold font-mono-numbers text-slate-900 text-base">
                  {data.totalAttendance ?? 0} / {data.totalWorkingDays} দিন
                </span>
              </div>
            </div>
          </div>

          {/* Subject-wise Result Table (Print-safe container) */}
          <div className="mt-5 sm:mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">বিষয়ভিত্তিক ফলাফল</h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto print:border print:border-slate-300 print:overflow-visible print:w-full">
              <table className="w-full text-left text-xs sm:text-sm min-w-[340px] print:min-w-0 print:w-full print:table-auto">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-xs font-semibold text-slate-700 print:bg-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 sm:px-4 print:py-1.5 print:px-2">বিষয়</th>
                    <th className="py-2.5 px-2 sm:px-4 text-right print:py-1.5 print:px-2">পূর্ণমান</th>
                    <th className="py-2.5 px-2 sm:px-4 text-right print:py-1.5 print:px-2">প্রাপ্ত</th>
                    <th className="py-2.5 px-2 sm:px-4 text-center print:py-1.5 print:px-2">গ্রেড</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right print:py-1.5 print:px-2">পয়েন্ট (GP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {data.subjectResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500 text-sm">
                        কোনো বিষয় পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    data.subjectResults.map((sub) => (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/50 transition-colors print:break-inside-avoid">
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-800 print:py-1.5 print:px-2">
                          {sub.subjectName}
                        </td>
                        <td className="py-2.5 px-2 sm:px-4 text-right font-mono-numbers text-slate-600 print:py-1.5 print:px-2">
                          {sub.totalMarks}
                        </td>
                        <td className="py-2.5 px-2 sm:px-4 text-right font-mono-numbers font-bold text-slate-900 print:py-1.5 print:px-2">
                          {sub.obtainedMarks !== null ? sub.obtainedMarks : '—'}
                        </td>
                        <td className="py-2.5 px-2 sm:px-4 text-center font-bold print:py-1.5 print:px-2">
                          {sub.grade !== null ? (
                            <span className={sub.grade === 'F' ? 'text-rose-600' : 'text-slate-800'}>
                              {sub.grade}
                            </span>
                          ) : (
                            <span className="text-amber-600 text-xs">অপেক্ষমাণ</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-right font-mono-numbers text-slate-800 print:py-1.5 print:px-2">
                          {sub.gradePoint !== null ? sub.gradePoint.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Summary Card: Responsive 2-cols on mobile, 5-cols on desktop with Merit Position */}
          <div className="mt-5 sm:mt-6 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 print:bg-slate-50 print:p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 print:mb-1.5">চূড়ান্ত সারসংক্ষেপ</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-center print:grid-cols-5 print:gap-2">
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 print:p-1.5">
                <span className="text-[11px] text-slate-500 block truncate print:text-[9px]">মোট প্রাপ্ত নম্বর</span>
                <span className="text-base sm:text-lg font-bold font-mono-numbers text-slate-900 mt-0.5 block print:text-sm">
                  {data.totalObtainedMarks}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 print:p-1.5">
                <span className="text-[11px] text-slate-500 block truncate print:text-[9px]">সর্বমোট পূর্ণমান</span>
                <span className="text-base sm:text-lg font-bold font-mono-numbers text-slate-900 mt-0.5 block print:text-sm">
                  {data.totalFullMarks}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 print:p-1.5">
                <span className="text-[11px] text-slate-500 block truncate print:text-[9px]">জিপিএ (GPA)</span>
                <span className="text-base sm:text-lg font-bold font-mono-numbers text-slate-900 mt-0.5 block print:text-sm">
                  {data.gpa !== null ? data.gpa.toFixed(2) : '—'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 print:p-1.5">
                <span className="text-[11px] text-slate-500 block truncate print:text-[9px]">মেধা স্থান (Merit)</span>
                <span className="text-base sm:text-lg font-bold font-mono-numbers text-indigo-700 mt-0.5 block print:text-sm">
                  {data.meritPosition !== null ? data.meritPosition : <span className="text-slate-400 font-normal text-xs">অপেক্ষমাণ</span>}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 bg-white rounded-lg border border-slate-200/80 print:p-1.5 print:col-span-1">
                <span className="text-[11px] text-slate-500 block truncate print:text-[9px]">চূড়ান্ত ফলাফল</span>
                <span className="text-base sm:text-lg font-bold mt-0.5 block print:text-sm">
                  {getStatusBadge(data.finalStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Grading Legend Reference */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] sm:text-xs text-slate-500 leading-relaxed print:text-[8pt] print:pt-2">
            <span>গ্রেডিং স্কেল: A+ (৮০-১০০%) · A (৭০-৭৯%) · A- (৬০-৬৯%) · B (৫০-৫৯%) · C (৪০-৪৯%) · D (৩৩-৩৯%) · F (০-৩২%)</span>
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

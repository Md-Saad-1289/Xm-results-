import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  html: string;
  filename: string;
  targetSelector: string;
  orientation?: 'portrait' | 'landscape';
  renderWidthPx?: number;
  marginMm?: number;
}

/**
 * Renders standalone HTML inside an isolated offscreen iframe (avoiding parent
 * Tailwind v4 oklch CSS colors) and converts it into a multi-page A4 PDF file.
 */
export async function downloadHtmlAsPdf({
  html,
  filename,
  targetSelector,
  orientation = 'portrait',
  renderWidthPx = 794,
  marginMm = 10
}: PdfExportOptions): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${renderWidthPx}px`,
    'height:1200px',
    'border:0',
    'opacity:1',
    'pointer-events:none',
    'z-index:-1'
  ].join(';');

  try {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error('PDF রেন্ডার হতে বেশি সময় লাগছে'));
      }, 10000);

      iframe.onload = () => {
        window.clearTimeout(timeoutId);
        resolve();
      };
      iframe.onerror = () => {
        window.clearTimeout(timeoutId);
        reject(new Error('PDF কন্টেন্ট লোড করতে ব্যর্থ হয়েছে'));
      };

      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    });

    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error('PDF ডকুমেন্ট তৈরি করা যায়নি');
    }

    try {
      const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) {
        await Promise.race([fonts.ready, new Promise(res => window.setTimeout(res, 2500))]);
      }
    } catch {
      // Fallback to system Bengali fonts if web fonts fail
    }

    await new Promise(res => window.setTimeout(res, 100));

    const fullHeight = Math.max(
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0,
      800
    );
    iframe.style.height = `${fullHeight + 40}px`;

    await new Promise(res => window.requestAnimationFrame(() => res(undefined)));

    const targetEl = (doc.querySelector(targetSelector) || doc.body) as HTMLElement | null;
    if (!targetEl) {
      throw new Error('PDF টার্গেট এলিমেন্ট পাওয়া যায়নি');
    }

    const targetRect = targetEl.getBoundingClientRect();
    const breakElements = Array.from(
      targetEl.querySelectorAll('tr, .summary-strip, .signatures, .summary-grid, .footer-note')
    );
    const cssBreakOffsets = breakElements
      .map(el => el.getBoundingClientRect().bottom - targetRect.top)
      .filter(y => y > 0 && y < targetRect.height);

    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: renderWidthPx,
      windowHeight: fullHeight + 40,
      scrollX: 0,
      scrollY: 0
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentHeightMm = pageHeightMm - marginMm * 2;

    const pxPerMm = canvas.width / contentWidthMm;
    const maxPageHeightPx = Math.floor(contentHeightMm * pxPerMm);
    const scaleRatio = targetRect.height > 0 ? canvas.height / targetRect.height : 2;
    const canvasBreaks = cssBreakOffsets
      .map(y => Math.round(y * scaleRatio))
      .sort((a, b) => a - b);

    if (canvas.height <= maxPageHeightPx) {
      const imgHeightMm = canvas.height / pxPerMm;
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        marginMm,
        marginMm,
        contentWidthMm,
        imgHeightMm,
        undefined,
        'FAST'
      );
    } else {
      let yStart = 0;
      let pageIndex = 0;

      while (yStart < canvas.height) {
        const maxEnd = yStart + maxPageHeightPx;
        let yEnd: number;

        if (maxEnd >= canvas.height) {
          yEnd = canvas.height;
        } else {
          const minPreferredY = yStart + Math.floor(maxPageHeightPx * 0.45);
          let bestBreak = -1;
          for (const b of canvasBreaks) {
            if (b > minPreferredY && b <= maxEnd) {
              bestBreak = b;
            }
          }
          yEnd = bestBreak > yStart ? bestBreak : maxEnd;
        }

        const sliceHeightPx = Math.max(1, yEnd - yStart);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;

        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            yStart,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );
        }

        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeightMm = sliceHeightPx / pxPerMm;
        pdf.addImage(
          sliceCanvas.toDataURL('image/png'),
          'PNG',
          marginMm,
          marginMm,
          contentWidthMm,
          sliceHeightMm,
          undefined,
          'FAST'
        );

        yStart = yEnd;
        pageIndex += 1;
      }
    }

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completedAt: Date;
  certificateNo: string;
  durationMonths: number;
}

// Landshaft A4 sertifikat PDF'ini to'g'ridan-to'g'ri response'ga oqizadi
export function streamCertificatePdf(res: Response, data: CertificateData): void {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="sertifikat-${data.certificateNo}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;

  // Fon va ramkalar
  doc.rect(0, 0, W, H).fill('#ffffff');
  doc.rect(0, 0, W, 10).fill('#0ea5e9');
  doc.rect(0, H - 10, W, 10).fill('#0ea5e9');
  doc.lineWidth(2.5).roundedRect(28, 28, W - 56, H - 56, 14).stroke('#0ea5e9');
  doc.lineWidth(1).roundedRect(38, 38, W - 76, H - 76, 10).stroke('#bae6fd');

  // Sarlavha
  doc.fillColor('#0ea5e9').font('Helvetica-Bold').fontSize(28).text('DATA LIFE', 0, 76, { align: 'center' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(11).text("IT ta'lim markazi", 0, 110, { align: 'center' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(38)
    .text('SERTIFIKAT', 0, 150, { align: 'center', characterSpacing: 8 });

  // Asosiy matn
  doc.fillColor('#475569').font('Helvetica').fontSize(13)
    .text('Ushbu sertifikat', 0, 228, { align: 'center' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(27)
    .text(data.studentName, 60, 254, { align: 'center', width: W - 120 });

  doc.fillColor('#475569').font('Helvetica').fontSize(13)
    .text(`ga "${data.courseTitle}" kursini (${data.durationMonths} oylik dastur)`, 60, 300, { align: 'center', width: W - 120 });
  doc.fillColor('#475569').font('Helvetica').fontSize(13)
    .text("muvaffaqiyatli yakunlagani uchun beriladi", 60, 320, { align: 'center', width: W - 120 });

  // Chiziq
  doc.moveTo(W / 2 - 120, 372).lineTo(W / 2 + 120, 372).lineWidth(1).stroke('#e2e8f0');

  // Pastki qator: sana, raqam, imzo
  const bottomY = H - 150;
  const dateStr = data.completedAt.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(dateStr, 110, bottomY, { width: 180, align: 'center' });
  doc.moveTo(110, bottomY + 20).lineTo(290, bottomY + 20).lineWidth(1).stroke('#94a3b8');
  doc.fillColor('#64748b').font('Helvetica').fontSize(10).text('Berilgan sana', 110, bottomY + 26, { width: 180, align: 'center' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(data.certificateNo, (W - 180) / 2, bottomY, { width: 180, align: 'center' });
  doc.moveTo((W - 180) / 2, bottomY + 20).lineTo((W + 180) / 2, bottomY + 20).lineWidth(1).stroke('#94a3b8');
  doc.fillColor('#64748b').font('Helvetica').fontSize(10).text('Sertifikat raqami', (W - 180) / 2, bottomY + 26, { width: 180, align: 'center' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('DATA LIFE', W - 290, bottomY, { width: 180, align: 'center' });
  doc.moveTo(W - 290, bottomY + 20).lineTo(W - 110, bottomY + 20).lineWidth(1).stroke('#94a3b8');
  doc.fillColor('#64748b').font('Helvetica').fontSize(10).text("O'quv markazi", W - 290, bottomY + 26, { width: 180, align: 'center' });

  doc.end();
}

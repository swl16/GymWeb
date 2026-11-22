import { reportData } from './report-data.mjs';
/** PDF EXPORT: A4 report with repeated table headings, page breaks and page numbers. */
export async function createReportPdf(data, month) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const report = reportData(data, month),
    doc = new jsPDF({ format: 'a4', unit: 'mm' }),
    blue = [45, 156, 219];
  const rm = (value) => 'RM ' + Number(value).toFixed(2);
  doc.setFillColor(17, 33, 49);
  doc.rect(0, 0, 210, 37, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  doc.text('PULSE', 16, 17);
  doc.setFontSize(10);
  doc.text('GYM MANAGEMENT REPORT', 16, 26);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporting month: ' + month, 194, 25, { align: 'right' });
  doc.setTextColor(30, 43, 57);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly revenue', 16, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(105, 119, 132);
  doc.text(
    'Verified payments only. Month is based on Malaysia verification time.',
    16,
    57,
  );
  autoTable(doc, {
    startY: 63,
    head: [['Payment type', 'Verified revenue']],
    body: [
      ['Membership subscriptions', rm(report.membershipRevenue)],
      ['Class bookings', rm(report.classRevenue)],
      ['Total revenue', rm(report.total)],
    ],
    margin: { left: 16, right: 16, top: 18, bottom: 22 },
    headStyles: { fillColor: blue },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 1: { halign: 'right' } },
  });
  function heading(title) {
    let y = (doc.lastAutoTable?.finalY || 60) + 15;
    if (y > 245) {
      doc.addPage();
      y = 22;
    }
    doc.setTextColor(30, 43, 57);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 16, y);
    return y + 6;
  }
  autoTable(doc, {
    startY: heading('Membership summary'),
    head: [['Plan', 'Subscribers', 'Active', 'Expired']],
    body: report.plans.map((p) => [p.name, p.subscribers, p.active, p.expired]),
    margin: { left: 16, right: 16, top: 18, bottom: 22 },
    headStyles: { fillColor: blue },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });
  autoTable(doc, {
    startY: heading('Class popularity'),
    head: [['Rank', 'Class', 'Bookings', 'Attendance']],
    body: report.classes.map((c, i) => [i + 1, c.name, c.bookings, c.attendance]),
    margin: { left: 16, right: 16, top: 18, bottom: 22 },
    headStyles: { fillColor: blue },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 98 },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 238);
    doc.line(16, 282, 194, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(125, 137, 149);
    doc.text('PULSE Fitness | ' + month + ' | Amounts in MYR', 16, 288);
    doc.text('Page ' + page + ' of ' + pages, 194, 288, { align: 'right' });
  }
  return doc;
}
export async function downloadReportPdf(data, month) {
  const doc = await createReportPdf(data, month);
  doc.save('PULSE_Report_' + month + '.pdf');
}

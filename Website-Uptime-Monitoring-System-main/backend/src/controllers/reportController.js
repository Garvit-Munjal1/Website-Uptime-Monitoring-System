import PDFDocument from 'pdfkit';
import { Check } from '../models/Check.js';
import { Monitor } from '../models/Monitor.js';

const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const downloadCsvReport = async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user.id });
  if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

  const checks = await Check.find({ monitorId: monitor._id }).sort({ checkedAt: -1 }).limit(1000);
  const rows = ['checkedAt,status,statusCode,responseTimeMs,reason'];
  checks.forEach((c) => {
    rows.push([
      escapeCsv(c.checkedAt.toISOString()),
      escapeCsv(c.status),
      escapeCsv(c.statusCode || ''),
      escapeCsv(c.responseTimeMs || ''),
      escapeCsv(c.reason || '')
    ].join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${monitor.name}-report.csv"`);
  return res.send(rows.join('\n'));
};

export const downloadPdfReport = async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user.id });
  if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

  const checks = await Check.find({ monitorId: monitor._id }).sort({ checkedAt: -1 }).limit(50);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${monitor.name}-report.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text(`Uptime Report - ${monitor.name}`);
  doc.moveDown().fontSize(11).text(`URL: ${monitor.url}`);
  doc.text(`Current Status: ${monitor.currentStatus.toUpperCase()}`);
  doc.text(`30-day Uptime: ${monitor.uptimePercent30d}%`);
  doc.moveDown();

  checks.forEach((c) => {
    doc.fontSize(10).text(`${c.checkedAt.toISOString()} | ${c.status.toUpperCase()} | ${c.statusCode || '-'} | ${c.responseTimeMs || '-'} ms | ${c.reason}`);
  });

  doc.end();
};

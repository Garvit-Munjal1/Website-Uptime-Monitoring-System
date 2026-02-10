import { Router } from 'express';
import { createMonitor, getMonitorTimeline, listDashboard, removeMonitor } from '../controllers/monitorController.js';
import { downloadCsvReport, downloadPdfReport } from '../controllers/reportController.js';

const router = Router();
router.get('/dashboard', listDashboard);
router.post('/', createMonitor);
router.get('/:id/timeline', getMonitorTimeline);
router.get('/:id/reports/csv', downloadCsvReport);
router.get('/:id/reports/pdf', downloadPdfReport);
router.delete('/:id', removeMonitor);

export default router;

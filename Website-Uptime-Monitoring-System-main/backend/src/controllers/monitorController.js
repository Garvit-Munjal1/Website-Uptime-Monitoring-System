import { Monitor } from '../models/Monitor.js';
import { Check } from '../models/Check.js';
import { Incident } from '../models/Incident.js';
import { getCachedSummary } from '../services/monitorEngine.js';

export const createMonitor = async (req, res) => {
  const { name, url, intervalSeconds, expectedStatusCodes } = req.body;
  const baseInterval = Math.min(900, Math.max(30, Number(intervalSeconds) || 60));
  const monitor = await Monitor.create({
    userId: req.user.id,
    name,
    url,
    intervalSeconds: baseInterval,
    adaptiveIntervalSeconds: baseInterval,
    expectedStatusCodes: expectedStatusCodes?.length ? expectedStatusCodes : undefined
  });
  return res.status(201).json(monitor);
};

export const listDashboard = async (req, res) => {
  const summary = await getCachedSummary(req.user.id);
  return res.json(summary);
};

export const getMonitorTimeline = async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user.id });
  if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

  const checks = await Check.find({ monitorId: monitor._id }).sort({ checkedAt: -1 }).limit(200);
  const incidents = await Incident.find({ monitorId: monitor._id }).sort({ startedAt: -1 }).limit(20);
  return res.json({ monitor, checks: checks.reverse(), incidents });
};

export const removeMonitor = async (req, res) => {
  const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!monitor) return res.status(404).json({ message: 'Monitor not found' });

  await Promise.all([
    Check.deleteMany({ monitorId: monitor._id }),
    Incident.deleteMany({ monitorId: monitor._id })
  ]);

  return res.json({ message: 'Deleted' });
};

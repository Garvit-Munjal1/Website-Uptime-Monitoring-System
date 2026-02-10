import axios from 'axios';
import NodeCache from 'node-cache';
import { Monitor } from '../models/Monitor.js';
import { Check } from '../models/Check.js';
import { Incident } from '../models/Incident.js';
import User from '../models/User.js';
import { sendStatusEmail } from './emailService.js';

const dashboardCache = new NodeCache({ stdTTL: 20 });

const quickProbe = async (url, expectedStatusCodes) => {
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      maxRedirects: 5,
      headers: { 'User-Agent': 'UptimeSentinel/1.0' }
    });

    const responseTimeMs = Date.now() - start;
    const up = expectedStatusCodes.includes(res.status);

    return {
      up,
      responseTimeMs,
      statusCode: res.status,
      reason: up ? 'Healthy' : `Unexpected status ${res.status}`
    };
  } catch (error) {
    return {
      up: false,
      responseTimeMs: Date.now() - start,
      reason: error.code || error.message || 'Network error'
    };
  }
};

const computeFailureDensity = (checks) => {
  if (!checks.length) return 0;
  const downCount = checks.filter((check) => check.status === 'down').length;
  return Number((downCount / checks.length).toFixed(4));
};

const computeResponseVariance = (checks) => {
  const samples = checks
    .map((check) => check.responseTimeMs)
    .filter((ms) => typeof ms === 'number' && Number.isFinite(ms) && ms >= 0);

  if (samples.length < 2) return 0;

  const mean = samples.reduce((acc, value) => acc + value, 0) / samples.length;
  const variance = samples.reduce((acc, value) => acc + (value - mean) ** 2, 0) / samples.length;
  return Number(Math.sqrt(variance).toFixed(2));
};

const computeConsecutiveDowns = (checks) => {
  let streak = 0;
  for (const check of checks) {
    if (check.status !== 'down') break;
    streak += 1;
  }
  return streak;
};

const classifyOutageFingerprint = ({ checks, probes, currentStatus, statusCode }) => {
  if (!checks.length) {
    return {
      fingerprint: 'stable',
      details: 'No outage signal detected yet for classification.',
      confidence: 15
    };
  }

  const failureDensity = computeFailureDensity(checks);
  const responseVariance = computeResponseVariance(checks);
  const consecutiveDowns = computeConsecutiveDowns(checks);
  const retrySuccess = probes.length > 1 && probes.some((probe) => probe.up);
  const highLatencySignals = checks.filter((check) => (check.responseTimeMs || 0) >= 3500).length;

  if (consecutiveDowns >= 4 || (failureDensity >= 0.7 && currentStatus === 'down')) {
    return {
      fingerprint: 'persistent-hard-downtime',
      details:
        'Outage Fingerprint Classification Engine detected sustained downtime sequences with high failure density, indicating persistent service unavailability.',
      confidence: 92
    };
  }

  if (failureDensity >= 0.25 && (retrySuccess || (consecutiveDowns > 0 && consecutiveDowns <= 3))) {
    return {
      fingerprint: 'transient-flaky-outage',
      details:
        'Outage Fingerprint Classification Engine detected intermittent recoveries and retry-sensitive failures, indicating transient/flaky outage behavior.',
      confidence: 86
    };
  }

  if ((failureDensity > 0.05 && highLatencySignals >= 2 && responseVariance >= 500) || (currentStatus === 'up' && [500, 502, 503, 504].includes(statusCode))) {
    return {
      fingerprint: 'partial-service-degradation',
      details:
        'Outage Fingerprint Classification Engine detected partial degradation with unstable response timing and mixed success states.',
      confidence: 78
    };
  }

  if (failureDensity === 0 && responseVariance < 150) {
    return {
      fingerprint: 'stable',
      details: 'Outage Fingerprint Classification Engine observed stable responses with no outage bursts.',
      confidence: 96
    };
  }

  return {
    fingerprint: 'observed-variation',
    details:
      'Outage Fingerprint Classification Engine observed variable reliability patterns that do not yet match a strict transient, persistent, or degradation class.',
    confidence: 64
  };
};

const computePriorityAndRisk = (failureDensity, responseVariance, currentStatus) => {
  const riskWindowScore = Math.min(100, Math.round(failureDensity * 70 + Math.min(responseVariance / 20, 30)));

  if (currentStatus === 'down' || riskWindowScore >= 70) {
    return { smartPriority: 'critical', riskWindowScore };
  }

  if (riskWindowScore >= 40) {
    return { smartPriority: 'high', riskWindowScore };
  }

  if (riskWindowScore >= 20) {
    return { smartPriority: 'medium', riskWindowScore };
  }

  return { smartPriority: 'normal', riskWindowScore };
};

const computeAdaptiveIntervalSeconds = ({ baseIntervalSeconds, currentStatus, failureDensity, responseVariance, recentlyRecovered }) => {
  const safeBase = Math.min(900, Math.max(30, baseIntervalSeconds || 60));

  if (currentStatus === 'down') {
    return {
      adaptiveIntervalSeconds: Math.max(30, Math.floor(safeBase * 0.45)),
      adaptiveIntervalReason: 'Adaptive Monitoring Interval Engine escalated checks during confirmed downtime.'
    };
  }

  if (recentlyRecovered) {
    return {
      adaptiveIntervalSeconds: Math.max(30, Math.floor(safeBase * 0.6)),
      adaptiveIntervalReason: 'Adaptive Monitoring Interval Engine is in post-recovery aggressive verification mode.'
    };
  }

  if (failureDensity >= 0.25 || responseVariance >= 500) {
    return {
      adaptiveIntervalSeconds: Math.max(30, Math.floor(safeBase * 0.72)),
      adaptiveIntervalReason: 'Adaptive Monitoring Interval Engine tightened interval due to instability signals.'
    };
  }

  if (failureDensity <= 0.05 && responseVariance < 150) {
    return {
      adaptiveIntervalSeconds: Math.min(900, Math.floor(safeBase * 1.55)),
      adaptiveIntervalReason: 'Adaptive Monitoring Interval Engine relaxed interval for a highly stable service.'
    };
  }

  return {
    adaptiveIntervalSeconds: safeBase,
    adaptiveIntervalReason: 'Adaptive Monitoring Interval Engine kept the baseline cadence due to mixed signals.'
  };
};

const recomputeUptime = async (monitorId) => {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const checks = await Check.find({ monitorId, checkedAt: { $gte: since } }).select('status');
  if (!checks.length) return 100;

  const upCount = checks.filter((check) => check.status === 'up').length;
  return Number(((upCount / checks.length) * 100).toFixed(2));
};

const processMonitor = async (monitor) => {
  const probes = [];
  for (let i = 0; i < 3; i += 1) {
    probes.push(await quickProbe(monitor.url, monitor.expectedStatusCodes));
    if (probes[i].up && i === 0) break;
  }

  const upVotes = probes.filter((probe) => probe.up).length;
  const finalUp = upVotes >= 2 || (probes.length === 1 && probes[0].up);
  const primaryProbe = probes[probes.length - 1];

  await Check.create({
    monitorId: monitor._id,
    userId: monitor.userId,
    status: finalUp ? 'up' : 'down',
    responseTimeMs: primaryProbe.responseTimeMs,
    statusCode: primaryProbe.statusCode,
    reason: primaryProbe.reason,
    checkedAt: new Date()
  });

  const recentChecks = await Check.find({ monitorId: monitor._id }).sort({ checkedAt: -1 }).limit(30);
  const uptimePercent30d = await recomputeUptime(monitor._id);
  const failureDensity = computeFailureDensity(recentChecks);
  const responseVariance = computeResponseVariance(recentChecks);
  const resilienceScore = Math.max(1, Math.round(uptimePercent30d - recentChecks.filter((check) => check.status === 'down').length / 2));
  const stabilityScore = Math.max(1, Math.round(100 - (failureDensity * 60 + Math.min(responseVariance / 15, 30))));

  const previousStatus = monitor.currentStatus;
  monitor.currentStatus = finalUp ? 'up' : 'down';
  monitor.lastCheckedAt = new Date();
  monitor.uptimePercent30d = uptimePercent30d;
  monitor.resilienceScore = resilienceScore;
  monitor.failureDensity = failureDensity;
  monitor.responseVarianceMs = responseVariance;
  monitor.stabilityScore = stabilityScore;

  const fingerprint = classifyOutageFingerprint({
    checks: recentChecks,
    probes,
    currentStatus: monitor.currentStatus,
    statusCode: primaryProbe.statusCode
  });
  monitor.outageFingerprint = fingerprint.fingerprint;
  monitor.outageFingerprintDetails = fingerprint.details;
  monitor.outageFingerprintConfidence = fingerprint.confidence;
  monitor.outageFingerprintUpdatedAt = new Date();

  const priority = computePriorityAndRisk(failureDensity, responseVariance, monitor.currentStatus);
  monitor.smartPriority = priority.smartPriority;
  monitor.riskWindowScore = priority.riskWindowScore;

  const recentlyRecovered = previousStatus === 'down' && monitor.currentStatus === 'up';
  const adaptiveInterval = computeAdaptiveIntervalSeconds({
    baseIntervalSeconds: monitor.intervalSeconds,
    currentStatus: monitor.currentStatus,
    failureDensity,
    responseVariance,
    recentlyRecovered
  });
  monitor.adaptiveIntervalSeconds = adaptiveInterval.adaptiveIntervalSeconds;
  monitor.adaptiveIntervalReason = adaptiveInterval.adaptiveIntervalReason;
  monitor.nextCheckAt = new Date(Date.now() + adaptiveInterval.adaptiveIntervalSeconds * 1000);

  const user = await User.findById(monitor.userId).select('email');
  if (previousStatus !== monitor.currentStatus && user) {
    if (monitor.currentStatus === 'down') {
      monitor.downSince = new Date();
      await Incident.create({
        monitorId: monitor._id,
        userId: monitor.userId,
        startedAt: new Date(),
        rootCauseGuess: primaryProbe.reason,
        timeline: [{ at: new Date(), message: `Detected downtime: ${primaryProbe.reason}` }]
      });
    } else {
      const activeIncident = await Incident.findOne({ monitorId: monitor._id, endedAt: null }).sort({ startedAt: -1 });
      if (activeIncident) {
        activeIncident.endedAt = new Date();
        activeIncident.timeline.push({ at: new Date(), message: 'Service recovered' });
        await activeIncident.save();
      }
      monitor.downSince = null;
      monitor.lastRecoveredAt = new Date();
    }

    await sendStatusEmail({
      to: user.email,
      monitorName: monitor.name,
      url: monitor.url,
      status: monitor.currentStatus,
      reason: primaryProbe.reason
    });
  }

  await monitor.save();
  dashboardCache.del(`summary:${monitor.userId.toString()}`);
};

export const runMonitoringCycle = async () => {
  const batch = Number(process.env.CHECK_BATCH_LIMIT || 30);
  const dueMonitors = await Monitor.find({ isActive: true, nextCheckAt: { $lte: new Date() } }).limit(batch);
  await Promise.all(dueMonitors.map((monitor) => processMonitor(monitor)));
};

export const getCachedSummary = async (userId) => {
  const key = `summary:${userId}`;
  const cached = dashboardCache.get(key);
  if (cached) return cached;

  const monitors = await Monitor.find({ userId }).sort({ createdAt: -1 });
  const payload = {
    total: monitors.length,
    up: monitors.filter((monitor) => monitor.currentStatus === 'up').length,
    down: monitors.filter((monitor) => monitor.currentStatus === 'down').length,
    avgUptime: monitors.length
      ? Number((monitors.reduce((acc, monitor) => acc + (monitor.uptimePercent30d || 0), 0) / monitors.length).toFixed(2))
      : 0,
    monitors
  };

  dashboardCache.set(key, payload);
  return payload;
};

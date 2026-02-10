import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import '../styles/pages.css';

export default function WebsiteDetailsPage() {
  const { monitorId } = useParams();
  const [timelineData, setTimelineData] = useState({ monitor: null, checks: [], incidents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await api.get(`/monitors/${monitorId}/timeline`);
      setTimelineData(data);
      setLoading(false);
    };

    load();
  }, [monitorId]);

  const chartData = useMemo(() => timelineData.checks.map((check) => ({
    at: new Date(check.checkedAt).toLocaleTimeString(),
    responseTime: check.responseTimeMs || 0,
    status: check.status === 'up' ? 1 : 0
  })), [timelineData.checks]);

  if (loading) {
    return <p className="hint">Loading website details...</p>;
  }

  return (
    <div className="page">
      <h2>Website Details</h2>
      <div className="glass-card">
        <h3>{timelineData.monitor?.name}</h3>
        <p className="website-url">{timelineData.monitor?.url}</p>
        <p>Current status: <strong>{timelineData.monitor?.currentStatus}</strong></p>
        <p>Uptime: <strong>{timelineData.monitor?.uptimePercent30d}%</strong></p>
        <p>Outage Fingerprint: <strong>{timelineData.monitor?.outageFingerprint}</strong></p>
        <p>Fingerprint Confidence: <strong>{timelineData.monitor?.outageFingerprintConfidence || 0}%</strong></p>
        <p>Fingerprint Details: <strong>{timelineData.monitor?.outageFingerprintDetails}</strong></p>
        <p>Adaptive Monitoring Interval: <strong>{timelineData.monitor?.adaptiveIntervalSeconds || timelineData.monitor?.intervalSeconds}s</strong></p>
        <p>Adaptive Interval Reason: <strong>{timelineData.monitor?.adaptiveIntervalReason}</strong></p>
        <p>Risk Priority: <strong>{timelineData.monitor?.smartPriority}</strong></p>
      </div>

      <div className="chart-wrap">
        <h3>Response Time Graph</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="at" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="responseTime" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card">
        <h3>Recent Incident Timeline</h3>
        {!timelineData.incidents.length && <p className="hint">No incidents recorded for this website yet.</p>}
        {timelineData.incidents.map((incident) => (
          <div key={incident._id} className="incident-item">
            <strong>{new Date(incident.startedAt).toLocaleString()}</strong>
            <span>{incident.rootCauseGuess || 'No root cause available'}</span>
            <em>{incident.endedAt ? `Recovered: ${new Date(incident.endedAt).toLocaleString()}` : 'Website currently down'}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

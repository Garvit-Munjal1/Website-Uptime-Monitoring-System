import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import '../styles/pages.css';

const downloadReport = async (monitorId, format) => {
  const response = await api.get(`/monitors/${monitorId}/reports/${format}`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `report-${monitorId}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export default function WebsitesPage() {
  const [summary, setSummary] = useState({ monitors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMonitors = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/monitors/dashboard');
      setSummary(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load websites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonitors();
  }, [loadMonitors]);

  const removeMonitor = async (id) => {
    await api.delete(`/monitors/${id}`);
    loadMonitors();
  };

  return (
    <div className="page">
      <h2>My Websites</h2>
      {loading && <p className="hint">Loading websites...</p>}
      {error && <span className="error">{error}</span>}

      <div className="website-grid">
        {summary.monitors.map((m) => (
          <article className="website-card" key={m._id}>
            <h3 title={m.name}>{m.name}</h3>
            <p className="website-url" title={m.url}>{m.url}</p>

            <div className="chips">
              <span className={`chip ${m.currentStatus}`}>{m.currentStatus.toUpperCase()}</span>
              <span className="chip">Uptime: {m.uptimePercent30d}%</span>
              <span className="chip">Priority: {m.smartPriority}</span>
              <span className="chip">Fingerprint: {m.outageFingerprint}</span>
              <span className="chip">Fingerprint Confidence: {m.outageFingerprintConfidence || 0}%</span>
              <span className="chip">Adaptive Interval: {m.adaptiveIntervalSeconds || m.intervalSeconds}s</span>
            </div>

            <div className="actions-row">
              <Link to={`/app/websites/${m._id}`}>View Details</Link>
              <button type="button" onClick={() => downloadReport(m._id, 'csv')}>CSV Report</button>
              <button type="button" onClick={() => downloadReport(m._id, 'pdf')}>PDF Report</button>
              <button type="button" onClick={() => removeMonitor(m._id)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

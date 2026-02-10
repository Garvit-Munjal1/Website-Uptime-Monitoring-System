import { useEffect, useState } from 'react';
import api from '../api/client';
import '../styles/pages.css';

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState([]);
  const [form, setForm] = useState({ name: '', url: '', intervalSeconds: 60, expectedKeyword: '' });

  const load = () => api.get('/monitors').then(({ data }) => setMonitors(data));
  useEffect(() => { load(); }, []);

  const addMonitor = async (e) => {
    e.preventDefault();
    await api.post('/monitors', form);
    setForm({ name: '', url: '', intervalSeconds: 60, expectedKeyword: '' });
    load();
  };

  return (
    <div className="page">
      <h2>Monitors</h2>
      <form className="inline-form" onSubmit={addMonitor}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="https://example.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        <input placeholder="Keyword check (optional)" value={form.expectedKeyword} onChange={(e) => setForm({ ...form, expectedKeyword: e.target.value })} />
        <select value={form.intervalSeconds} onChange={(e) => setForm({ ...form, intervalSeconds: Number(e.target.value) })}>
          <option value={60}>1 min</option>
          <option value={120}>2 min</option>
          <option value={300}>5 min</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <div className="card-list">
        {monitors.map((m) => (
          <article key={m._id} className="glass-card">
            <h3>{m.name}</h3>
            <p>{m.url}</p>
            <div className="chips">
              <span className={`chip ${m.currentStatus}`}>{m.currentStatus}</span>
              <span className="chip">Uptime: {m.uptimePercent30d}%</span>
              <span className="chip">Resilience: {m.resilienceScore}</span>
              <span className="chip">Risk: {m.riskWindowScore}</span>
              <span className="chip">Priority: {m.smartPriority}</span>
            </div>
            <div className="actions-row">
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/monitors/${m._id}/reports/csv`} target="_blank">CSV</a>
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/monitors/${m._id}/reports/pdf`} target="_blank">PDF</a>
              <button onClick={async () => { await api.delete(`/monitors/${m._id}`); load(); }}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addTrendLine } from '../utils/regression';
import '../styles/dashboard.css';

const colors = ['#22c55e', '#ef4444'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState({ total: 0, up: 0, down: 0, avgUptime: 0, monitors: [] });
  const [selected, setSelected] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({ name: '', url: '', intervalSeconds: 60 });

  const loadDashboard = async () => {
    const { data } = await api.get('/monitors/dashboard');
    setDashboard(data);
    if (!selected && data.monitors.length) setSelected(data.monitors[0]);
  };

  useEffect(() => {
    loadDashboard();
    const id = setInterval(loadDashboard, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selected?._id) return;
    api.get(`/monitors/${selected._id}/timeline`).then(({ data }) => {
      const baseTimeline = data.checks.map((c) => ({ t: new Date(c.checkedAt).toLocaleTimeString(), ms: c.responseTimeMs || 0, status: c.status === 'up' ? 1 : 0 }));
      setTimeline(addTrendLine(baseTimeline, 'ms', 'trendLine'));
      setIncidents(data.incidents);
    });
  }, [selected]);

  const addMonitor = async (e) => {
    e.preventDefault();
    await api.post('/monitors', form);
    setForm({ name: '', url: '', intervalSeconds: 60 });
    loadDashboard();
  };

  const removeMonitor = async (id) => {
    await api.delete(`/monitors/${id}`);
    setSelected(null);
    loadDashboard();
  };

  const pieData = useMemo(() => [{ name: 'Up', value: dashboard.up }, { name: 'Down', value: dashboard.down }], [dashboard]);

  return (
    <div className="dash-layout">
      <aside className="left-panel">
        <h2>Uptime Sentinel</h2>
        <p>Hello, {user.name}</p>
        <div className="metric-grid">
          <div><span>Total</span><strong>{dashboard.total}</strong></div>
          <div><span>Up</span><strong>{dashboard.up}</strong></div>
          <div><span>Down</span><strong>{dashboard.down}</strong></div>
          <div><span>Avg Uptime</span><strong>{dashboard.avgUptime}%</strong></div>
        </div>
        <form onSubmit={addMonitor} className="monitor-form">
          <h3>Add Website</h3>
          <input placeholder="Website Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="https://example.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          <select value={form.intervalSeconds} onChange={(e) => setForm({ ...form, intervalSeconds: Number(e.target.value) })}>
            <option value={60}>Every 1 min</option>
            <option value={120}>Every 2 min</option>
            <option value={300}>Every 5 min</option>
          </select>
          <button type="submit">Add Monitor</button>
        </form>
        <button className="logout" onClick={logout}>Logout</button>
      </aside>

      <main className="main-panel">
        <div className="monitor-list">
          {dashboard.monitors.map((m) => (
            <article key={m._id} className={`monitor-card ${selected?._id === m._id ? 'active' : ''}`} onClick={() => setSelected(m)}>
              <h4>{m.name}</h4>
              <p>{m.url}</p>
              <span className={`pill ${m.currentStatus}`}>{m.currentStatus}</span>
              <small>Uptime: {m.uptimePercent30d}% | Score: {m.resilienceScore}</small>
              <div className="actions">
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/monitors/${m._id}/reports/csv`} target="_blank">CSV</a>
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/monitors/${m._id}/reports/pdf`} target="_blank">PDF</a>
                <button onClick={(e) => { e.stopPropagation(); removeMonitor(m._id); }}>Remove</button>
              </div>
            </article>
          ))}
        </div>

        <section className="charts-grid">
          <div className="chart-card">
            <h3>Response Time Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeline}>
                <XAxis dataKey="t" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ms" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="trendLine" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Fleet Health</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={90}>
                  {pieData.map((_, index) => <Cell key={index} fill={colors[index]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="incident-card">
          <h3>Recent Incidents (Selected Monitor)</h3>
          {!incidents.length && <p>No incidents detected yet.</p>}
          {incidents.map((i) => (
            <div key={i._id} className="incident-row">
              <strong>{new Date(i.startedAt).toLocaleString()}</strong>
              <span>{i.rootCauseGuess || 'No root cause data'}</span>
              <em>{i.endedAt ? `Recovered ${new Date(i.endedAt).toLocaleString()}` : 'Still Down'}</em>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

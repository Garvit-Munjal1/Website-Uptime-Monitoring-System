import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/client';
import '../styles/pages.css';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState({ up: 0, down: 0 });
  useEffect(() => { api.get('/monitors/dashboard').then(({ data }) => setSummary(data)); }, []);
  const pie = useMemo(() => [{ name: 'Up', value: summary.up }, { name: 'Down', value: summary.down }], [summary]);

  return (
    <div className="page">
      <h2>Analytics</h2>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie data={pie} dataKey="value" outerRadius={120}>
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="hint">Advanced Engine: Outage Fingerprint Classification tracks failure behavior patterns across recent checks.</p>
      <p className="hint">Advanced Engine: Adaptive Monitoring Interval adjusts check cadence dynamically based on reliability signals.</p>
    </div>
  );
}

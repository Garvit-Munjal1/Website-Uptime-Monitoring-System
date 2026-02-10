import { useEffect, useState } from 'react';
import api from '../api/client';
import '../styles/pages.css';

export default function OverviewPage() {
  const [summary, setSummary] = useState({ total: 0, up: 0, down: 0 });

  useEffect(() => {
    api.get('/monitors/dashboard').then(({ data }) => {
      setSummary({ total: data.total, up: data.up, down: data.down });
    });
  }, []);

  return (
    <div className="page">
      <h2>Overview</h2>
      <div className="stats-grid">
        <div><span>Total Websites Added</span><strong>{summary.total}</strong></div>
        <div><span>Currently Up</span><strong>{summary.up}</strong></div>
        <div><span>Currently Down</span><strong>{summary.down}</strong></div>
      </div>
    </div>
  );
}

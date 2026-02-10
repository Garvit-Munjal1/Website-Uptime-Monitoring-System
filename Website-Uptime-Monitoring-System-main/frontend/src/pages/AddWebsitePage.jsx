import { useState } from 'react';
import api from '../api/client';
import '../styles/pages.css';

const platformFeatures = [
  {
    title: 'Outage Fingerprint Classification Engine',
    description:
      'Generates a failure-behavior fingerprint per website using temporal patterns, retry outcomes, status signals, and response volatility to classify outages as transient, persistent, degradation, or stable.'
  },
  {
    title: 'Adaptive Monitoring Interval Engine',
    description:
      'Dynamically adjusts monitoring cadence per website from live reliability behavior, with aggressive verification during instability and efficient relaxed intervals during stable periods.'
  },
  {
    title: 'Multi-Probe Verification',
    description:
      'Runs confirmation probes before finalizing DOWN status to reduce false positives and improve alert precision.'
  },
  {
    title: 'Incident Timeline Tracking',
    description:
      'Stores outage start/end windows with timeline events so teams can review incident progression and recovery history.'
  },
  {
    title: 'Smart Risk Prioritization',
    description:
      'Calculates risk windows from failure density and latency variance to prioritize high-risk websites for immediate attention.'
  },
  {
    title: 'CSV and PDF Reporting',
    description:
      'Provides downloadable reports for operational reviews, audits, and sharing uptime evidence with stakeholders.'
  },
  {
    title: 'Response-Time Analytics',
    description:
      'Tracks and visualizes response-time history to reveal performance regression before complete downtime occurs.'
  },
  {
    title: 'Email Status Notifications',
    description:
      'Sends real-time email alerts on state transitions so users know immediately when a service goes down or recovers.'
  }
];

export default function AddWebsitePage() {
  const [form, setForm] = useState({ name: '', url: '', intervalSeconds: 60 });
  const [state, setState] = useState({ loading: false, error: '', success: '' });

  const addMonitor = async (e) => {
    e.preventDefault();
    try {
      setState({ loading: true, error: '', success: '' });
      await api.post('/monitors', form);
      setForm({ name: '', url: '', intervalSeconds: 60 });
      setState({ loading: false, error: '', success: 'Website added successfully.' });
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || 'Unable to add website.', success: '' });
    }
  };

  return (
    <div className="page">
      <h2>Add Website</h2>
      <form className="add-card" onSubmit={addMonitor}>
        <input
          placeholder="Website Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="https://example.com"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          required
          type="url"
        />
        <select
          value={form.intervalSeconds}
          onChange={(e) => setForm({ ...form, intervalSeconds: Number(e.target.value) })}
        >
          <option value={60}>Every 1 minute</option>
          <option value={120}>Every 2 minutes</option>
          <option value={300}>Every 5 minutes</option>
        </select>
        <button disabled={state.loading} type="submit">{state.loading ? 'Saving...' : 'Add Website'}</button>
        {state.error && <span className="error">{state.error}</span>}
        {state.success && <span className="success">{state.success}</span>}
      </form>

      <div className="feature-strip">
        {platformFeatures.map((feature) => (
          <div key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../api/client';
import '../styles/pages.css';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  useEffect(() => { api.get('/monitors/incidents').then(({ data }) => setIncidents(data)); }, []);

  return (
    <div className="page">
      <h2>Incidents</h2>
      {!incidents.length && <p className="hint">No incidents yet.</p>}
      {incidents.map((i) => (
        <div key={i._id} className="incident-item">
          <strong>{new Date(i.startedAt).toLocaleString()}</strong>
          <span>{i.rootCauseGuess || 'No cause recorded'}</span>
          <em>{i.endedAt ? `Recovered at ${new Date(i.endedAt).toLocaleString()}` : 'Ongoing outage'}</em>
        </div>
      ))}
    </div>
  );
}

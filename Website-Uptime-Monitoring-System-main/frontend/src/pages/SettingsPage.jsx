import { useEffect, useState } from 'react';
import api from '../api/client';
import '../styles/pages.css';

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  useEffect(() => { api.get('/auth/me').then(({ data }) => setProfile(data.user)); }, []);

  return (
    <div className="page">
      <h2>Settings</h2>
      {profile && (
        <div className="glass-card">
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Timezone:</strong> {profile.timezone}</p>
          <p><strong>Joined:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

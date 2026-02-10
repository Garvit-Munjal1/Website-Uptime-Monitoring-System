import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AppLayout from './components/AppLayout';
import AddWebsitePage from './pages/AddWebsitePage';
import WebsitesPage from './pages/WebsitesPage';
import WebsiteDetailsPage from './pages/WebsiteDetailsPage';
import OverviewPage from './pages/OverviewPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/app"
        element={(
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        )}
      >
        <Route index element={<Navigate to="add-website" replace />} />
        <Route path="add-website" element={<AddWebsitePage />} />
        <Route path="websites" element={<WebsitesPage />} />
        <Route path="websites/:monitorId" element={<WebsiteDetailsPage />} />
        <Route path="overview" element={<OverviewPage />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? '/app/add-website' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/app/add-website' : '/login'} replace />} />
    </Routes>
  );
}

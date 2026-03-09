import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { CloudinaryProvider } from './context/CloudinaryContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanReceipt from './pages/ScanReceipt';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><ScanReceipt /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CloudinaryProvider>
        <ApiKeyProvider>
          <AuthProvider>
            <DataProvider>
              <AppRoutes />
            </DataProvider>
          </AuthProvider>
        </ApiKeyProvider>
      </CloudinaryProvider>
    </BrowserRouter>
  );
}

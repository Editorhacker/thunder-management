import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Analytics from './pages/Analytics';
import OwnerDashboard from './pages/OwnerDashboard';
import PricingConfigPage from './pages/PricingConfig';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/employee/*" element={<EmployeeDashboard />} />
        <Route path="/analytic" element={<Analytics />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/owner/pricing" element={<DashboardLayout><PricingConfigPage /></DashboardLayout>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

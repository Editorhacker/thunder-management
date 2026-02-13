
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

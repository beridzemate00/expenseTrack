import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { token, loading } = useAuth();

    if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

    return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;

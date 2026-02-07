import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="glass">
            <div className="logo">ExpenseTracker</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span>Welcome, <strong style={{ color: 'var(--primary)' }}>{user?.name}</strong></span>
                {user?.role === 'ADMIN' && (
                    <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--primary)' }}>ADMIN</span>
                )}
                <button onClick={logout} className="btn-primary" style={{ backgroundColor: 'var(--danger)' }}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;

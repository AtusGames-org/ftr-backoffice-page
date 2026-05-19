import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { logout } from '../services/authService';

const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/users': 'Users',
    '/worlds': 'Worlds',
    '/metrics': 'Metrics',
};

const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/worlds', label: 'Worlds' },
    { to: '/metrics', label: 'Metrics' },
];

function Topbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const title = titles[location.pathname] ?? 'Dashboard';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-20 border-b border-[#2a2640] bg-black/40 backdrop-blur">
            <div className="px-6 py-4 md:px-10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-[#6ae4ff]">Feed the Realm</p>
                        <h1 className="app-title text-2xl md:text-3xl">{title}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden rounded-full border border-[rgba(139,92,246,0.5)] bg-[rgba(12,10,20,0.6)] px-3 py-1 text-xs text-[#c9c1ea] md:block">
                            Last sync: 2 min ago
                        </div>
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
                <nav className="mt-4 flex flex-wrap gap-2 md:hidden">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `rounded-full border px-3 py-1 text-xs ${isActive
                                    ? 'border-[rgba(245,180,74,0.7)] bg-[rgba(139,92,246,0.18)] text-[#f8f5ff]'
                                    : 'border-[#2a2640] text-[#b8b0d6]'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    );
}

export default Topbar;

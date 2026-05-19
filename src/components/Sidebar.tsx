import { NavLink } from 'react-router-dom';
import { GiCastle, GiCrown, GiDragonHead, GiRank3 } from 'react-icons/gi';
import logo from '../assets/ftr_logo.jpeg';

const navItems = [
    { to: '/', label: 'Dashboard', icon: GiDragonHead },
    { to: '/users', label: 'Users', icon: GiCrown },
    { to: '/worlds', label: 'Worlds', icon: GiCastle },
    { to: '/metrics', label: 'Metrics', icon: GiRank3 },
];

function Sidebar() {
    return (
        <aside className="app-sidebar hidden w-64 flex-col border-r border-[#2a2640] px-5 pb-8 pt-6 md:flex">
            <div className="flex items-center gap-3">
                <img src={logo} alt="Feed the Realm" className="h-10 w-10 rounded-full border border-[rgba(245,180,74,0.5)]" />
                <div>
                    <p className="app-title text-lg">Feed the Realm</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b8b0d6]">Backoffice</p>
                </div>
            </div>
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-[rgba(106,228,255,0.35)] to-transparent" />
            <nav className="flex flex-1 flex-col gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive
                                    ? 'bg-[rgba(139,92,246,0.18)] text-[#f8f5ff] shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                                    : 'text-[#b8b0d6] hover:bg-[rgba(106,228,255,0.12)] hover:text-[#f8f5ff]'
                                }`
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>
            <div className="mt-8 rounded-xl border border-[rgba(139,92,246,0.4)] bg-[rgba(12,10,20,0.7)] p-4 text-xs text-[#c9c1ea]">
                <p className="font-semibold text-[#f8f5ff]">Realm status</p>
                <p className="mt-1">Stable. 1.4k concurrent players.</p>
            </div>
        </aside>
    );
}

export default Sidebar;

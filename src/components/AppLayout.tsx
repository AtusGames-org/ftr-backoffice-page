import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function AppLayout() {
  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="px-6 pb-10 pt-6 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

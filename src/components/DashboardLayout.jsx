import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300">

                {/* Topbar */}
                <Topbar onMenuClick={() => setSidebarOpen(true)} />

                {/* Page Content with Fade In */}
                <main className="flex-1 p-4 md:p-8 animate-in fade-in duration-500">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Menu, Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './components/Login';
import DashboardHome from './components/DashboardHome';
import AdminUsers from './components/AdminUsers';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import LabReservation from './components/LabReservation';
import Settings from './components/Settings';
import PrintsView from './views/PrintsView';
import TicketsView from './views/TicketsView';
import EquipmentRequestView from './views/EquipmentRequestView';
import ScheduleAdminView from './views/ScheduleAdminView';
import InventoryView from './views/InventoryView';
import AdminDaysTrackingView from './views/AdminDaysTrackingView';

// --- TEMPORARY PLACEHOLDER COMPONENT ---
const PlaceholderView = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-white rounded-3xl border border-dashed border-slate-300">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500 max-w-md">
      Esta seccion esta en construccion. Pronto podras acceder a todas las funcionalidades de {title.toLowerCase()}.
    </p>
  </div>
);

// Protected Layout using Outlet
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img
            src="/assets/logo_eyr.png"
            alt="School Logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* User Avatar (Mobile) */}
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xs overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name.charAt(0)
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 relative">
        <div className="hidden md:block">
          <Topbar />
        </div>

        <div className="p-4 md:p-10 pt-20 md:pt-10 min-h-screen">
          <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

// Admin Days Redirect Wrapper
const AdministrativeDaysView = () => {
  const { user } = useAuth();
  if (!user) return null;
  const adminRoles = ['director', 'admin', 'super_admin', 'utp_head', 'inspector'];
  return adminRoles.includes(user.role) ? <AdminDashboard /> : <TeacherDashboard />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/administrative-days" element={<AdministrativeDaysView />} />
          <Route path="/labs" element={<LabReservation />} />

          {/* Placeholders */}
          <Route path="/schedule" element={<PlaceholderView title="Mi Horario" />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="/prints" element={<PrintsView />} />
          <Route path="/tickets" element={<TicketsView />} />
          <Route path="/equipment" element={<EquipmentRequestView />} />
          <Route path="/admin/schedules" element={<ScheduleAdminView />} />
          <Route path="/admin/days-tracking" element={<AdminDaysTrackingView />} />

          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

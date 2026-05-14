import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePermissions } from './context/PermissionsContext';
import { cn } from './lib/utils';
import logoEyr from './assets/logo_eyr.png';

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
import StatsView from './views/StatsView';
import MedicalLeavesView from './views/MedicalLeavesView';
import ReplacementLogsView from './views/ReplacementLogsView';
import ConvivenciaReservation from './components/ConvivenciaReservation';
import PermissionsManager from './views/PermissionsManager';
import TeacherHoursView from './views/TeacherHoursView';
import AttendanceMonitorView from './views/AttendanceMonitorView';
import JustificativesView from './views/JustificativesView';
import EntrevistasView from './views/EntrevistasView';
import UTPView from './utp/UTPView';
import EditorFormato from './utp/EditorFormato';
import CalendarioEvaluaciones from './utp/CalendarioEvaluaciones';
import CalendarioMobile from './utp/CalendarioMobile';
import AgendaSemanal from './utp/AgendaSemanal';
import TemarioView from './utp/TemarioView';
import ControlSanoView from './views/ControlSanoView';
import FichaClap from './views/FichaClap';
import AtencionDiariaView from './views/AtencionDiariaView';
import EnfermeriaResumenView from './views/EnfermeriaResumenView';
import CorridaEscolarView from './views/CorridaEscolarView';
import RetosAdminView from './views/RetosAdminView';
import RetosSesionView from './views/RetosSesionView';
import RetoAlumnoView from './views/RetoAlumnoView';
import TasksView from './views/TasksView';
import TodoView from './views/TodoView';
import CoberturaDashboard from './views/cobertura/CoberturaDashboard';
import CoberturaGradeView from './views/cobertura/CoberturaGradeView';
import CoberturaSubjectView from './views/cobertura/CoberturaSubjectView';
import CoberturaTeacherView from './views/cobertura/CoberturaTeacherView';
import CoberturaAdminList from './views/cobertura/admin/CoberturaAdminList';
import CoberturaEditor from './views/cobertura/admin/CoberturaEditor';
import CoberturaMigrar from './views/cobertura/admin/CoberturaMigrar';
import IncentivoEYRView from './views/IncentivoEYRView';
import KioskoAlumnoView from './views/KioskoAlumnoView';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
        </div>

        <div className="relative flex flex-col items-center gap-8">
          {/* Logo with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-400/20 rounded-3xl blur-2xl scale-150 animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl shadow-indigo-200/50 border border-white/60">
              <img
                src={logoEyr}
                alt="Centro Educacional Ernesto Yañez Rivera"
                className="h-20 w-auto object-contain"
                style={{ animation: 'fadeInScale 0.8s ease-out both' }}
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-2" style={{ animation: 'fadeInUp 0.8s ease-out 0.3s both' }}>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">EYR Digital</h1>
            <p className="text-sm text-slate-400 font-medium">Preparando tu espacio de trabajo...</p>
          </div>

          {/* Animated loading bar */}
          <div className="w-48 h-1.5 bg-slate-200/80 rounded-full overflow-hidden" style={{ animation: 'fadeInUp 0.8s ease-out 0.5s both' }}>
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full" style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
              width: '100%'
            }} />
          </div>
        </div>

        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Mobile Header — fixed */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img
            src={logoEyr}
            alt="EYR"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* User Avatar (Mobile) */}
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xs overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            (user?.name || user?.displayName || '?').charAt(0)
          )}
        </div>
      </div>

      <div className={cn(
        "flex-1 min-w-0 flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "md:ml-[72px]" : "md:ml-72"
      )}>
        {/* Desktop topbar */}
        <div className="hidden md:block shrink-0">
          <Topbar />
        </div>
        {/* Mobile spacer for fixed header */}
        <div className="md:hidden h-16 shrink-0" />

        {/* Cada ruta maneja su propio overflow */}
        <Outlet />
      </div>
    </div>
  );
};

// Layout con padding para todas las rutas normales (no full-bleed)
const PaddedLayout = () => (
  <div className="flex-1 overflow-y-auto">
    <div className="p-4 md:p-10">
      <main className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
        <Outlet />
      </main>
    </div>
  </div>
);

// Admin Days Redirect Wrapper
const AdministrativeDaysView = () => {
  const { user } = useAuth();
  if (!user) return null;
  const adminRoles = ['director', 'admin', 'super_admin', 'utp_head', 'inspector'];
  return adminRoles.includes(user.role) ? <AdminDashboard /> : <TeacherDashboard />;
};

// UTP guard: only utp_head / admin / super_admin can access admin cobertura routes
const UtpGuard = ({ children }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (!['utp_head', 'admin', 'super_admin'].includes(user.role))
    return <Navigate to="/cobertura" replace />;
  return children;
};

// Vista unificada de cobertura: admin para utp/admin, dashboard de lectura para el resto
const CoberturaPage = () => {
  const { user } = useAuth();
  const canManage = ['super_admin', 'admin', 'utp_head'].includes(user?.role);
  if (canManage) return <CoberturaAdminList />;
  return <div className="flex-1 overflow-y-auto"><CoberturaDashboard /></div>;
};

// Permission gate: checks canAccess for a given moduleKey, redirects to / if denied
const PermissionGate = ({ moduleKey, children }) => {
  const { canAccess } = usePermissions();
  if (!canAccess(moduleKey)) return <Navigate to="/" replace />;
  return children;
};

// Home redirect: teachers (no jefatura) and convivencia go straight to Convivencia
const HomeRedirect = () => {
  const { user } = useAuth();
  const isProfesorJefe = !!(user?.isHeadTeacher && user?.headTeacherOf);
  if (!isProfesorJefe && (user?.role === 'teacher' || user?.role === 'convivencia' || user?.role === 'convivencia_head')) return <Navigate to="/convivencia" replace />;
  return <DashboardHome />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public — student reto (no auth required) */}
        <Route path="/reto/:sesionId" element={<RetoAlumnoView />} />

        {/* Public — kiosko alumno (QR scan) */}
        <Route path="/kiosko/:studentId" element={<KioskoAlumnoView />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes */}
        <Route element={<ProtectedLayout />}>

          {/* ── Cobertura — full-bleed (sin padding wrapper) ── */}
          <Route path="/cobertura" element={<PermissionGate moduleKey="cobertura"><CoberturaPage /></PermissionGate>} />
          <Route path="/cobertura/dashboard" element={<Navigate to="/cobertura" replace />} />

          {/* ── Agenda Semanal — full-bleed (sin padding wrapper) ── */}
          <Route path="/utp/agenda" element={<PermissionGate moduleKey="utp_agenda"><AgendaSemanal /></PermissionGate>} />

          {/* ── Calendario de Evaluaciones — full-bleed (fondo animado propio) ── */}
          <Route path="/utp/calendario" element={
            <PermissionGate moduleKey="utp_calendario">
              <div className="hidden sm:flex flex-1 min-h-0"><CalendarioEvaluaciones /></div>
              <CalendarioMobile />
            </PermissionGate>
          } />

          {/* ── Todas las demás rutas — con padding estándar ── */}
          <Route element={<PaddedLayout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/todo" element={<TodoView />} />
            <Route path="/users" element={<PermissionGate moduleKey="users"><AdminUsers /></PermissionGate>} />
            <Route path="/administrative-days" element={<AdministrativeDaysView />} />
            <Route path="/labs" element={<PermissionGate moduleKey="labs"><LabReservation /></PermissionGate>} />
            <Route path="/schedule" element={<ScheduleAdminView selfView />} />
            <Route path="/inventory" element={<InventoryView />} />
            <Route path="/prints" element={<PrintsView />} />
            <Route path="/tickets" element={<PermissionGate moduleKey="tickets"><TicketsView /></PermissionGate>} />
            <Route path="/equipment" element={<EquipmentRequestView />} />
            <Route path="/admin/schedules" element={<PermissionGate moduleKey="schedules"><ScheduleAdminView /></PermissionGate>} />
            <Route path="/admin/days-tracking" element={<PermissionGate moduleKey="days_tracking"><AdminDaysTrackingView /></PermissionGate>} />
            <Route path="/admin/stats" element={<PermissionGate moduleKey="stats"><StatsView /></PermissionGate>} />
            <Route path="/admin/medical-leaves" element={<PermissionGate moduleKey="medical_leaves"><MedicalLeavesView /></PermissionGate>} />
            <Route path="/admin/replacements" element={<PermissionGate moduleKey="replacements"><ReplacementLogsView /></PermissionGate>} />
            <Route path="/admin/teacher-hours" element={<PermissionGate moduleKey="teacher_hours"><TeacherHoursView /></PermissionGate>} />
            <Route path="/admin/attendance" element={<PermissionGate moduleKey="attendance_monitor"><AttendanceMonitorView /></PermissionGate>} />
            <Route path="/convivencia" element={<PermissionGate moduleKey="convivencia"><ConvivenciaReservation /></PermissionGate>} />
            <Route path="/incentivo-eyr" element={<PermissionGate moduleKey="incentivo_eyr"><IncentivoEYRView /></PermissionGate>} />
            <Route path="/corrida-escolar" element={<PermissionGate moduleKey="corrida_escolar"><CorridaEscolarView /></PermissionGate>} />
            <Route path="/retos" element={<PermissionGate moduleKey="retos_admin"><RetosAdminView /></PermissionGate>} />
            <Route path="/retos/sesion" element={<PermissionGate moduleKey="no_pierde_clases"><RetosSesionView /></PermissionGate>} />
            <Route path="/admin/permissions" element={<PermissionGate moduleKey="permissions"><PermissionsManager /></PermissionGate>} />
            <Route path="/inspectoria/justificativos" element={<PermissionGate moduleKey="justificatives"><JustificativesView /></PermissionGate>} />
            <Route path="/inspectoria/entrevistas" element={<PermissionGate moduleKey="entrevistas"><EntrevistasView /></PermissionGate>} />
            <Route path="/utp" element={<PermissionGate moduleKey="utp_evaluaciones"><UTPView /></PermissionGate>} />
            <Route path="/utp/formatos" element={<PermissionGate moduleKey="utp_formatos"><EditorFormato /></PermissionGate>} />
            <Route path="/utp/temario" element={<PermissionGate moduleKey="utp_temario"><TemarioView /></PermissionGate>} />
            {/* utp/calendario moved to full-bleed above */}
            <Route path="/pie" element={<PermissionGate moduleKey="pie"><PlaceholderView title="PIE" /></PermissionGate>} />
            <Route path="/enfermeria/control-sano" element={<PermissionGate moduleKey="control_sano"><ControlSanoView /></PermissionGate>} />
            <Route path="/enfermeria/ficha-clap" element={<PermissionGate moduleKey="ficha_clap"><FichaClap /></PermissionGate>} />
            <Route path="/enfermeria/atenciones-diarias" element={<PermissionGate moduleKey="atenciones_diarias"><AtencionDiariaView /></PermissionGate>} />
            <Route path="/enfermeria/resumen" element={<PermissionGate moduleKey="enfermeria_resumen"><EnfermeriaResumenView /></PermissionGate>} />
            <Route path="/cobertura/curso/:grade" element={<CoberturaGradeView />} />
            <Route path="/cobertura/asignatura/:subject" element={<CoberturaSubjectView />} />
            <Route path="/cobertura/docente/:teacherId" element={<CoberturaTeacherView />} />
            <Route path="/cobertura/docente" element={<CoberturaTeacherView />} />
            <Route path="/admin/cobertura/:coverageId/edit" element={<UtpGuard><CoberturaEditor /></UtpGuard>} />
            <Route path="/admin/cobertura/migrar/:coverageId" element={<UtpGuard><CoberturaMigrar /></UtpGuard>} />
            <Route path="/settings" element={<Settings />} />
          </Route>

        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

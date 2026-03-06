import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarDays, CalendarClock, CalendarCheck, Monitor, LifeBuoy, Settings, Package, LogOut, Users, Printer, Box, X, BarChart3, HeartPulse, PanelLeftClose, Award, UserCheck, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import logoEyr from '../assets/logo_eyr.png';

// ... (lines 7-111 skipped)

<img
    src={logoEyr}
    alt="Centro Educacional Ernesto Yañez Rivera"
    className="h-full w-auto object-contain max-w-[180px]"
/>

// ============================================
// COMMON NAVIGATION (All Roles)
// ============================================
const COMMON_MENU_ITEMS = [
    {
        name: 'Inicio',
        icon: LayoutDashboard,
        path: '/'
    },
    {
        name: 'Reservar Enlace',
        icon: Monitor,
        path: '/labs'
    },
    {
        name: 'Tickets / Soporte',
        icon: LifeBuoy,
        path: '/tickets'
    }
];

// ============================================
// ROLE-SPECIFIC NAVIGATION
// ============================================
const ROLE_SPECIFIC_ITEMS = [
    {
        name: 'Equipo EYR',
        icon: Users,
        path: '/users',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.DIRECTOR]
    },
    {
        name: 'Gestionar Horarios',
        icon: CalendarClock,
        path: '/admin/schedules',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.UTP_HEAD]
    },
    {
        name: 'Gestión Días Admin',
        icon: CalendarCheck,
        path: '/admin/days-tracking',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.UTP_HEAD, ROLES.INSPECTOR]
    },
    {
        name: 'Licencias Médicas',
        icon: HeartPulse,
        path: '/medical-leaves',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.UTP_HEAD, ROLES.INSPECTOR, ROLES.DIRECTOR]
    },
    {
        name: 'Estadísticas',
        icon: BarChart3,
        path: '/admin/stats',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.DIRECTOR, ROLES.UTP_HEAD, ROLES.INSPECTOR]
    },
    {
        name: 'SIMCE',
        icon: Award,
        path: '/admin/simce',
        roles: [ROLES.UTP_HEAD, ROLES.SUPER_ADMIN]
    },
    {
        name: 'Asistencia',
        icon: UserCheck,
        path: '/admin/attendance',
        roles: [ROLES.UTP_HEAD, ROLES.SUPER_ADMIN]
    },
    {
        name: 'Cobertura Curricular',
        icon: BookOpen,
        path: '/admin/curriculum',
        roles: [ROLES.UTP_HEAD, ROLES.SUPER_ADMIN]
    },
    {
        name: 'Mi Horario',
        icon: CalendarDays,
        path: '/schedule',
        roles: [ROLES.TEACHER]
    },
    {
        name: 'Días Administrativos',
        icon: Calendar,
        path: '/administrative-days',
        roles: [ROLES.TEACHER]
    },
    {
        name: 'Solicitar Equipos',
        icon: Box,
        path: '/equipment',
        roles: [ROLES.TEACHER]
    },
    /*
    {
        name: 'Inventario',
        icon: Package,
        path: '/inventory',
        roles: [ROLES.DIRECTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]
    }
    */
];

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Close sidebar when route changes
    React.useEffect(() => {
        if (isOpen && onClose) {
            onClose();
        }
    }, [location.pathname]);

    // Filter role-specific items based on current user's role
    const roleSpecificItems = ROLE_SPECIFIC_ITEMS.filter(item =>
        item.roles.includes(user?.role)
    );

    // Render a menu link
    const renderMenuItem = (item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
            <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
            >
                <div className={cn(
                    "absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive ? "opacity-0" : ""
                )} />
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Drawer */}
            <div className={cn(
                "h-screen w-72 bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 overflow-y-auto transition-transform duration-300",
                // Mobile: Translate based on isOpen
                !isOpen && "-translate-x-full",
                // Desktop: visible unless collapsed
                isCollapsed ? "md:-translate-x-full" : "md:translate-x-0"
            )}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <img
                                src={logoEyr}
                                alt="Centro Educacional Ernesto Yañez Rivera"
                                className="h-12 w-auto object-contain"
                            />
                        </div>
                        {/* Close button for mobile */}
                        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        {/* Collapse button for desktop */}
                        <button onClick={onToggleCollapse} className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <PanelLeftClose className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {/* Section Label */}
                        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">General</p>
                        {COMMON_MENU_ITEMS.map(renderMenuItem)}

                        {/* Role Specific Items */}
                        {roleSpecificItems.length > 0 && (
                            <>
                                <div className="my-4 border-t border-slate-100" />
                                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Mi Área</p>
                                {roleSpecificItems.map(renderMenuItem)}
                            </>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100 bg-gradient-to-t from-slate-50 to-transparent">
                    <div className="flex items-center gap-3 mb-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0)
                            )}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="font-bold text-sm text-slate-800 truncate">{user?.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{getRoleLabel(user?.role)}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
}

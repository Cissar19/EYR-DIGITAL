import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, X, PanelLeftClose, ChevronDown, FolderOpen, Folder, ClipboardList } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { MODULE_REGISTRY } from '../data/moduleRegistry';
import logoEyr from '../assets/logo_eyr.png';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const { user, logout } = useAuth();
    const { canAccess } = usePermissions();
    const location = useLocation();

    // Close sidebar when route changes
    React.useEffect(() => {
        if (isOpen && onClose) {
            onClose();
        }
    }, [location.pathname]);

    // Filter modules by permission, split by category
    const commonItems = MODULE_REGISTRY
        .filter(m => m.category === 'common' && canAccess(m.key));
    const roleSpecificItems = MODULE_REGISTRY
        .filter(m => m.category === 'role_specific' && canAccess(m.key));

    // Split role-specific into ungrouped and grouped
    const ungroupedItems = roleSpecificItems.filter(m => !m.group);
    const groupedItems = roleSpecificItems.filter(m => m.group === 'administracion');
    const inspectoriaItems = roleSpecificItems.filter(m => m.group === 'inspectoria');

    // Track which groups are expanded (auto-expand if any child is active)
    const hasActiveChild = groupedItems.some(m => location.pathname === m.path);
    const [adminOpen, setAdminOpen] = React.useState(hasActiveChild);
    React.useEffect(() => { if (hasActiveChild) setAdminOpen(true); }, [hasActiveChild]);

    const hasActiveInspChild = inspectoriaItems.some(m => location.pathname === m.path);
    const [inspOpen, setInspOpen] = React.useState(hasActiveInspChild);
    React.useEffect(() => { if (hasActiveInspChild) setInspOpen(true); }, [hasActiveInspChild]);

    // Teachers and Convivencia: hide "General" header, show single "Menu" header
    const isMinimalRole = user?.role === ROLES.TEACHER || user?.role === ROLES.CONVIVENCIA;

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
                        {/* Common section — hidden for teacher/convivencia */}
                        {!isMinimalRole && commonItems.length > 0 && (
                            <>
                                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">General</p>
                                {commonItems.map(renderMenuItem)}
                            </>
                        )}

                        {/* Role Specific Items */}
                        {roleSpecificItems.length > 0 && (
                            <>
                                {!isMinimalRole && commonItems.length > 0 && (
                                    <div className="my-4 border-t border-slate-100" />
                                )}
                                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    {isMinimalRole ? 'Menu' : 'Mi Area'}
                                </p>

                                {/* Ungrouped items */}
                                {ungroupedItems.map(renderMenuItem)}

                                {/* Administración folder */}
                                {groupedItems.length > 0 && (
                                    <div className="mt-1">
                                        <button
                                            onClick={() => setAdminOpen(v => !v)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left group",
                                                hasActiveChild && !adminOpen
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            {adminOpen
                                                ? <FolderOpen className="w-5 h-5 text-indigo-500" />
                                                : <Folder className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                            }
                                            <span className="font-medium flex-1">Administración</span>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 text-slate-400 transition-transform duration-200",
                                                adminOpen ? "rotate-0" : "-rotate-90"
                                            )} />
                                        </button>
                                        {adminOpen && (
                                            <div className="ml-3 pl-3 border-l-2 border-slate-100 space-y-0.5 mt-0.5">
                                                {groupedItems.map(renderMenuItem)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Inspectoría folder */}
                                {inspectoriaItems.length > 0 && (
                                    <div className="mt-1">
                                        <button
                                            onClick={() => setInspOpen(v => !v)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left group",
                                                hasActiveInspChild && !inspOpen
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            {inspOpen
                                                ? <FolderOpen className="w-5 h-5 text-indigo-500" />
                                                : <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                            }
                                            <span className="font-medium flex-1">Inspectoría</span>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 text-slate-400 transition-transform duration-200",
                                                inspOpen ? "rotate-0" : "-rotate-90"
                                            )} />
                                        </button>
                                        {inspOpen && (
                                            <div className="ml-3 pl-3 border-l-2 border-slate-100 space-y-0.5 mt-0.5">
                                                {inspectoriaItems.map(renderMenuItem)}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                        <span>Cerrar Sesion</span>
                    </button>
                </div>
            </div>
        </>
    );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, X, ChevronLeft, ChevronRight, ChevronDown, FolderOpen, Folder, ClipboardList } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { MODULE_REGISTRY } from '../data/moduleRegistry';
import logoEyr from '../assets/logo_eyr.png';

function Tooltip({ children, label, show }) {
    if (!show) return children;
    return (
        <div className="relative group/tip">
            {children}
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity duration-200 z-[70] shadow-lg">
                {label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
            </span>
        </div>
    );
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const { user, logout } = useAuth();
    const { canAccess } = usePermissions();
    const location = useLocation();

    // Close mobile sidebar when route changes
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
            <Tooltip key={item.path} label={item.name} show={isCollapsed}>
                <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                        "flex items-center gap-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                        isCollapsed ? "justify-center px-0 py-3 mx-auto w-12 h-12" : "px-4 py-3",
                        isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    <div className={cn(
                        "absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity",
                        isActive ? "opacity-0" : ""
                    )} />
                    <Icon className={cn(
                        "w-5 h-5 shrink-0",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500"
                    )} />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                    {!isCollapsed && isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                    )}
                </Link>
            </Tooltip>
        );
    };

    // Render a collapsible group (Administración / Inspectoría)
    const renderGroup = ({ label, icon: GroupIcon, items, isOpen: groupOpen, setOpen, hasActive }) => {
        if (items.length === 0) return null;

        if (isCollapsed) {
            // In collapsed mode, click expands sidebar and opens the group
            return (
                <Tooltip label={label} show>
                    <button
                        onClick={() => {
                            onToggleCollapse();
                            setOpen(true);
                        }}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all duration-200 cursor-pointer",
                            hasActive
                                ? "bg-indigo-100 text-indigo-600"
                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <GroupIcon className="w-5 h-5" />
                    </button>
                </Tooltip>
            );
        }

        return (
            <div className="mt-1">
                <button
                    onClick={() => setOpen(v => !v)}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left group",
                        hasActive && !groupOpen
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    {groupOpen
                        ? <FolderOpen className="w-5 h-5 text-indigo-500" />
                        : <GroupIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                    }
                    <span className="font-medium flex-1">{label}</span>
                    <ChevronDown className={cn(
                        "w-4 h-4 text-slate-400 transition-transform duration-200",
                        groupOpen ? "rotate-0" : "-rotate-90"
                    )} />
                </button>
                {groupOpen && (
                    <div className="ml-3 pl-3 border-l-2 border-slate-100 space-y-0.5 mt-0.5">
                        {items.map(renderMenuItem)}
                    </div>
                )}
            </div>
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

            {/* Sidebar — Desktop: always visible, toggles width. Mobile: slide drawer */}
            <div className={cn(
                "h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 overflow-y-auto overflow-x-hidden",
                // Mobile: full-width drawer
                "w-72 transition-transform duration-300 md:transition-[width] md:duration-300",
                !isOpen && "-translate-x-full",
                // Desktop: always visible, change width
                "md:translate-x-0",
                isCollapsed ? "md:w-[72px]" : "md:w-72"
            )}>
                {/* Header: Logo + collapse/close button */}
                <div className={cn(
                    "flex items-center shrink-0 border-b border-slate-100",
                    isCollapsed ? "md:justify-center md:px-0 px-6 py-4" : "px-6 py-4 justify-between"
                )}>
                    {/* Logo — hidden when collapsed on desktop */}
                    <div className={cn(
                        "flex items-center gap-3",
                        isCollapsed && "md:hidden"
                    )}>
                        <img
                            src={logoEyr}
                            alt="Centro Educacional Ernesto Yañez Rivera"
                            className="h-12 w-auto object-contain"
                        />
                    </div>

                    {/* Mobile close button */}
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    {/* Desktop collapse/expand button */}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>

                {/* User Profile */}
                <div className={cn(
                    "shrink-0 border-b border-slate-100",
                    isCollapsed ? "md:py-4 md:px-0 md:flex md:justify-center p-4" : "p-4"
                )}>
                    {isCollapsed ? (
                        /* Collapsed: avatar only with tooltip */
                        <>
                            {/* Mobile: show full profile even when desktop is collapsed */}
                            <div className="md:hidden flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
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
                            {/* Desktop collapsed: avatar only */}
                            <Tooltip label={user?.name} show>
                                <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm mx-auto">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0)
                                    )}
                                </div>
                            </Tooltip>
                        </>
                    ) : (
                        /* Expanded: full profile card */
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
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
                    )}
                </div>

                {/* Navigation */}
                <div className={cn("flex-1 py-4", isCollapsed ? "md:px-2 px-6" : "px-6")}>
                    <nav className={cn("space-y-1", isCollapsed && "md:flex md:flex-col md:items-center")}>
                        {/* Common section */}
                        {!isMinimalRole && commonItems.length > 0 && (
                            <>
                                {isCollapsed ? (
                                    <div className="hidden md:block w-8 border-t border-slate-200 my-2" />
                                ) : (
                                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">General</p>
                                )}
                                {/* On mobile, always show label even if desktop is collapsed */}
                                <p className={cn(
                                    "md:hidden px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2",
                                    !isCollapsed && "hidden"
                                )}>General</p>
                                {commonItems.map(renderMenuItem)}
                            </>
                        )}

                        {/* Role Specific Items */}
                        {roleSpecificItems.length > 0 && (
                            <>
                                {!isMinimalRole && commonItems.length > 0 && (
                                    isCollapsed
                                        ? <div className="hidden md:block w-8 border-t border-slate-200 my-2" />
                                        : <div className="my-4 border-t border-slate-100" />
                                )}
                                {isCollapsed ? (
                                    <div className="hidden md:block w-8 border-t border-slate-200 my-2" />
                                ) : (
                                    <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        {isMinimalRole ? 'Menu' : 'Mi Area'}
                                    </p>
                                )}
                                {/* Mobile label when collapsed on desktop */}
                                <p className={cn(
                                    "md:hidden px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2",
                                    !isCollapsed && "hidden"
                                )}>
                                    {isMinimalRole ? 'Menu' : 'Mi Area'}
                                </p>

                                {/* Ungrouped items */}
                                {ungroupedItems.map(renderMenuItem)}

                                {/* Administración folder */}
                                {renderGroup({
                                    label: 'Administración',
                                    icon: Folder,
                                    items: groupedItems,
                                    isOpen: adminOpen,
                                    setOpen: setAdminOpen,
                                    hasActive: hasActiveChild,
                                })}

                                {/* Inspectoría folder */}
                                {renderGroup({
                                    label: 'Inspectoría',
                                    icon: ClipboardList,
                                    items: inspectoriaItems,
                                    isOpen: inspOpen,
                                    setOpen: setInspOpen,
                                    hasActive: hasActiveInspChild,
                                })}
                            </>
                        )}
                    </nav>
                </div>

                {/* Logout */}
                <div className={cn(
                    "shrink-0 border-t border-slate-100",
                    isCollapsed ? "md:py-4 md:px-0 md:flex md:justify-center p-4" : "p-4"
                )}>
                    <Tooltip label="Cerrar Sesión" show={isCollapsed}>
                        <button
                            onClick={logout}
                            className={cn(
                                "flex items-center gap-3 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium",
                                isCollapsed
                                    ? "md:justify-center md:w-12 md:h-12 md:p-0 md:mx-auto w-full px-4 py-2.5"
                                    : "w-full px-4 py-2.5"
                            )}
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            {isCollapsed ? (
                                <span className="md:hidden">Cerrar Sesión</span>
                            ) : (
                                <span>Cerrar Sesión</span>
                            )}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </>
    );
}

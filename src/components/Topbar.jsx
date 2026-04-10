import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth, getRoleLabel, ROLES } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { DEFAULT_SCHEDULES } from '../data/defaultSchedules';
import { User, Bell, Search, Menu, LogOut, Settings, ChevronDown, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Topbar({ onMenuClick }) {
    const { user, logout, users, canEdit } = useAuth();
    const { schedules } = useSchedule();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBellOpen, setIsBellOpen] = useState(false);
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const userCanEdit = canEdit();

    // Teachers without schedules
    const teachersWithoutSchedule = useMemo(() => {
        if (!userCanEdit) return [];
        return users
            .filter(u => u.role === ROLES.TEACHER)
            .filter(u => u.teachesClasses !== false)
            .filter(u => {
                const hasFirestore = schedules[u.id]?.length > 0;
                const hasDefault   = !!DEFAULT_SCHEDULES[u.email];
                return !hasFirestore && !hasDefault;
            })
            .map(u => u.name);
    }, [users, schedules, userCanEdit]);

    const alertCount = teachersWithoutSchedule.length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsBellOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="sticky top-0 z-40 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-200/50 transition-all">

            {/* Mobile Menu Trigger & Search */}
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors active:scale-95">
                    <Menu className="w-5 h-5" />
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200 transition-all w-72 text-slate-500 hover:bg-slate-100/50">
                    <Search className="w-4 h-4 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-slate-700"
                    />
                    <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-200/50 rounded border border-slate-200/80">
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-5">

                {/* Notification Bell */}
                {userCanEdit && (
                    <div className="relative" ref={bellRef}>
                        <button
                            onClick={() => setIsBellOpen(!isBellOpen)}
                            className="relative p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95"
                        >
                            <Bell className="w-5 h-5" />
                            {alertCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                                    {alertCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isBellOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden origin-top-right"
                                >
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm font-bold text-slate-700">Alertas</span>
                                    </div>

                                    <div className="max-h-72 overflow-y-auto">
                                        {alertCount === 0 ? (
                                            <div className="px-4 py-6 text-center text-slate-400 text-sm">
                                                No hay alertas pendientes.
                                            </div>
                                        ) : (
                                            <>
                                                <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                                                    <p className="text-xs font-semibold text-amber-700">
                                                        {alertCount} docente{alertCount !== 1 && 's'} sin horario cargado
                                                    </p>
                                                    <p className="text-[11px] text-amber-600 mt-0.5">
                                                        No aparecerán en posibles reemplazos.
                                                    </p>
                                                </div>
                                                {teachersWithoutSchedule.map((name, i) => (
                                                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                                                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                                                            {name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm text-slate-700 truncate">{name}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {alertCount > 0 && (
                                        <Link
                                            to="/schedules"
                                            onClick={() => setIsBellOpen(false)}
                                            className="block px-4 py-2.5 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 transition-colors"
                                        >
                                            Ir a Gestionar Horarios
                                        </Link>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Bell for non-admin (no dropdown) */}
                {!userCanEdit && (
                    <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95">
                        <Bell className="w-5 h-5" />
                    </button>
                )}

                {/* Profile Dropdown Trigger */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 pl-3 md:pl-5 border-l border-slate-200/50 cursor-pointer group"
                    >
                        <div className="text-right hidden md:block group-hover:opacity-80 transition-opacity">
                            <p className="text-sm font-bold text-slate-700 leading-tight">{user?.name}</p>
                            <p className="text-[11px] font-medium text-slate-400">
                                {getRoleLabel(user?.role)}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm overflow-hidden group-hover:shadow-md transition-all">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || <User className="w-5 h-5" />
                            )}
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden md:block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden text-sm origin-top-right"
                            >
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <p className="text-slate-900 font-semibold truncate">{user?.name}</p>
                                    <p className="text-slate-500 text-xs truncate">{user?.email || 'usuario@eduhuechuraba.cl'}</p>
                                </div>

                                <div className="p-1.5">
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span>Mi Perfil</span>
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Settings className="w-4 h-4 text-slate-400" />
                                        <span>Configuracion</span>
                                    </Link>
                                </div>

                                <div className="h-px bg-slate-100 mx-2" />

                                <div className="p-1.5">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Cerrar Sesion</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}

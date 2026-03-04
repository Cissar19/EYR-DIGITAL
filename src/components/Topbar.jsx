import React, { useState, useRef, useEffect } from 'react';
import { useAuth, getRoleLabel } from '../context/AuthContext';
import { User, Bell, Search, Menu, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Topbar({ onMenuClick }) {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

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
                <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                </button>

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
                                    <p className="text-slate-500 text-xs truncate">{user?.email || 'usuario@escuela.cl'}</p>
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
                                        <span>Configuración</span>
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
                                        <span>Cerrar Sesión</span>
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

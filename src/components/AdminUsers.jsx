import React, { useState, useMemo } from 'react';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { MODULE_REGISTRY } from '../data/moduleRegistry';
import { resolvePermissions } from '../lib/permissionResolver';
import { User, Plus, Trash2, Mail, Shield, GraduationCap, X, Sparkles, Edit, Search, ChevronLeft, ChevronRight, IdCard, UserPlus, Pencil, ShieldCheck, Briefcase, AlertTriangle, BookOpen, Eye, Shuffle, Heart, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
    const { user: currentUser, users: MOCK_USERS, addUser, updateUser, deleteUser } = useAuth();
    const { roleDefaults } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isEditAttributesOpen, setIsEditAttributesOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'teacher' });
    const [attributesData, setAttributesData] = useState({ id: null, headTeacherOf: '', subjects: '' });
    const [editingUserId, setEditingUserId] = useState(null);
    const [permOverrides, setPermOverrides] = useState({});
    const [showPermissions, setShowPermissions] = useState(false);
    const [notification, setNotification] = useState(null);

    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const openCreateModal = () => {
        setEditingUserId(null);
        setFormData({ name: '', email: '', role: 'teacher' });
        setPermOverrides({});
        setShowPermissions(false);
        setIsModalOpen(true);
    };

    const openEditModal = (userToEdit) => {
        setEditingUserId(userToEdit.id);
        setFormData({
            name: userToEdit.name,
            email: userToEdit.email,
            role: userToEdit.role
        });
        setPermOverrides(userToEdit.permissionOverrides || {});
        setShowPermissions(false);
        setIsModalOpen(true);
    };

    const openAttributesModal = (userToEdit) => {
        setAttributesData({
            id: userToEdit.id,
            headTeacherOf: userToEdit.headTeacherOf || '',
            subjects: userToEdit.subjects || ''
        });
        setIsEditAttributesOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return;

        try {
            if (editingUserId) {
                await updateUser(editingUserId, { ...formData, permissionOverrides: permOverrides });
                setNotification('Usuario actualizado correctamente');
            } else {
                await addUser(formData);
                setNotification('Usuario creado correctamente');
            }

            setIsModalOpen(false);
            setEditingUserId(null);
            setFormData({ name: '', email: '', role: 'teacher' });
            setPermOverrides({});
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            const msg = error.code === 'auth/email-already-in-use'
                ? 'Ya existe un usuario con ese correo'
                : error.message;
            setNotification('Error: ' + msg);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleAttributesSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(attributesData.id, {
                headTeacherOf: attributesData.headTeacherOf,
                subjects: attributesData.subjects
            });
            setNotification('Atributos académicos actualizados');
            setIsEditAttributesOpen(false);
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            setNotification('Error: ' + error.message);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleDelete = (id) => {
        const user = MOCK_USERS.find(u => u.id === id);
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete.id);
                setNotification('Usuario eliminado');
                setTimeout(() => setNotification(null), 3000);
            } catch (error) {
                setNotification('Error: ' + error.message);
                setTimeout(() => setNotification(null), 5000);
            }
        }
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const confirmReset = () => {
        setIsResetModalOpen(false);
    };

    // Helper function for accent-insensitive and case-insensitive search
    const normalizeText = (text) => {
        return text
            ?.toString()
            .toLowerCase()
            .normalize("NFD") // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, "") || ""; // Remove accent marks
    };

    // Helper to get role badge configuration
    const getRoleBadge = (role) => {
        switch (role) {
            case ROLES.TEACHER:
                return {
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-600',
                    label: 'Docente',
                    icon: GraduationCap
                };
            case ROLES.STAFF:
                return {
                    bgColor: 'bg-teal-100',
                    textColor: 'text-teal-600',
                    label: 'Asistente',
                    icon: Briefcase
                };
            case ROLES.ADMIN:
                return {
                    bgColor: 'bg-amber-100',
                    textColor: 'text-amber-600',
                    label: 'Administradora',
                    icon: ShieldCheck
                };
            case ROLES.DIRECTOR:
                return {
                    bgColor: 'bg-indigo-100',
                    textColor: 'text-indigo-600',
                    label: 'Director',
                    icon: Shield
                };
            case ROLES.UTP_HEAD:
                return {
                    bgColor: 'bg-purple-100',
                    textColor: 'text-purple-600',
                    label: 'Jefa UTP',
                    icon: BookOpen
                };
            case ROLES.INSPECTOR:
                return {
                    bgColor: 'bg-orange-100',
                    textColor: 'text-orange-600',
                    label: 'Inspectoría',
                    icon: Eye
                };
            case ROLES.CONVIVENCIA:
                return {
                    bgColor: 'bg-rose-100',
                    textColor: 'text-rose-600',
                    label: 'Convivencia Escolar',
                    icon: Heart
                };
            default:
                return {
                    bgColor: 'bg-slate-100',
                    textColor: 'text-slate-500',
                    label: getRoleLabel(role),
                    icon: User
                };
        }
    };

    // Combine users from MOCK_USERS and filter out system roles
    const allUsers = MOCK_USERS.filter(user =>
        user.role !== ROLES.SUPER_ADMIN &&
        user.role !== ROLES.PRINTER
    );

    // Security Check: Only Admin can manage users
    const canManageUsers = currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.DIRECTOR || currentUser.role === ROLES.SUPER_ADMIN);

    // Sort users alphabetically by name for better readability
    const sortedUsers = [...allUsers].sort((a, b) => {
        return a.name.localeCompare(b.name);
    });


    // Filter Logic with accent-insensitive search
    const filteredUsers = sortedUsers.filter(u =>
        normalizeText(u.name).includes(normalizeText(searchTerm)) ||
        normalizeText(u.email).includes(normalizeText(searchTerm))
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to page 1 on search
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 relative px-4 sm:px-6">

            {/* Ambient Background Mesh */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[80px]" />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        Equipo EYR
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                            {allUsers.length} Miembros
                        </span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Gestión de todo el personal de la escuela (Docentes y Asistentes).</p>
                </div>

                <div className="flex gap-3">
                    {canManageUsers && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openCreateModal}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-slate-200 transition-all hover:-translate-y-1"
                            >
                                <Plus className="w-5 h-5" /> Nuevo Usuario
                            </motion.button>
                        </>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative w-full md:max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm font-medium"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-24 right-8 z-50 bg-white/80 backdrop-blur-md text-emerald-800 px-6 py-4 rounded-2xl border border-emerald-100 shadow-2xl shadow-emerald-500/10 flex items-center gap-3"
                    >
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{notification}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Users Grid */}
            {currentUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentUsers.map(u => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={u.id}
                            className="group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
                        >
                            {/* Top Row: Avatar + Name/Role + Actions */}
                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-4 text-center md:text-left flex-wrap">
                                {/* Left: User Info */}
                                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 min-w-0 w-full flex-wrap">

                                    {(() => {
                                        const badge = getRoleBadge(u.role);
                                        const BadgeIcon = badge.icon;
                                        return (
                                            <>
                                                <div className={`w-16 h-16 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${badge.bgColor} ${badge.textColor}`}>
                                                    <BadgeIcon className="w-8 h-8 md:w-7 md:h-7" />
                                                </div>
                                                <div className="min-w-0 flex-1 w-full">
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{u.name}</h3>
                                                    <div className={`flex items-center justify-center md:justify-start gap-1 text-xs font-medium mt-1 uppercase tracking-wider ${badge.textColor}`}>
                                                        <BadgeIcon className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{badge.label}</span>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Right: Action Buttons */}
                                {canManageUsers && u.id !== currentUser?.id && (
                                    <div className="flex items-center justify-end md:justify-end gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                        <button
                                            onClick={() => openEditModal(u)}
                                            className="flex-1 md:flex-none flex justify-center items-center p-2 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                                            title="Editar Usuario"
                                        >
                                            <Pencil className="w-5 h-5 md:w-4 md:h-4 text-gray-400 group-hover/btn:text-blue-600 transition-colors" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="flex-1 md:flex-none flex justify-center items-center p-2 hover:bg-red-50 rounded-lg transition-colors group/btn"
                                            title="Eliminar Usuario"
                                        >
                                            <Trash2 className="w-5 h-5 md:w-4 md:h-4 text-gray-400 group-hover/btn:text-red-600 transition-colors" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{u.email}</span>
                                </div>

                                {/* Replacement Eligibility Toggle */}
                                {canManageUsers && (
                                    <button
                                        onClick={() => {
                                            const current = u.canReplace !== undefined ? u.canReplace : u.role === 'teacher';
                                            updateUser(u.id, { canReplace: !current });
                                        }}
                                        className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${
                                            (u.canReplace !== undefined ? u.canReplace : u.role === 'teacher')
                                                ? 'bg-teal-50/50 border-teal-100 hover:bg-teal-50'
                                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shuffle className={`w-3.5 h-3.5 ${
                                                (u.canReplace !== undefined ? u.canReplace : u.role === 'teacher')
                                                    ? 'text-teal-600' : 'text-slate-400'
                                            }`} />
                                            <span className="text-xs font-semibold text-slate-600">Puede reemplazar</span>
                                        </div>
                                        <div className={`w-9 h-5 rounded-full transition-colors relative ${
                                            (u.canReplace !== undefined ? u.canReplace : u.role === 'teacher')
                                                ? 'bg-teal-500' : 'bg-slate-300'
                                        }`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                (u.canReplace !== undefined ? u.canReplace : u.role === 'teacher')
                                                    ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                        </div>
                                    </button>
                                )}

                                {/* Academic Attributes Preview */}
                                {(u.headTeacherOf || u.subjects) ? (
                                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-50 space-y-2">
                                        {u.headTeacherOf && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                Profesor Jefe: {u.headTeacherOf}
                                            </div>
                                        )}
                                        {u.subjects && (
                                            <div className="text-xs text-slate-600 line-clamp-2">
                                                <span className="font-bold text-slate-500">Asignaturas:</span> {u.subjects}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center">
                                        <span className="text-xs text-slate-400 italic">Sin atributos académicos asignados</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No se encontraron miembros del equipo</h3>
                    <p className="text-slate-500">Intenta con otro nombre o término de búsqueda.</p>
                </div>
            )}

            {/* Pagination Controls */}
            {filteredUsers.length > ITEMS_PER_PAGE && (
                <div className="flex justify-center items-center gap-6 mt-10">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                        Página {currentPage} de {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">
                                    {editingUserId ? 'Editar Usuario' : 'Nuevo Miembro'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium"
                                        placeholder="Ej: Juan Pérez"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium"
                                        placeholder="ejemplo@escuela.cl"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Rol de Sistema</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'teacher' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'teacher'
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <GraduationCap className="w-4 h-4" />
                                            Docente
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'staff' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'staff'
                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            Asistente
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'admin' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'admin'
                                                    ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            Administradora
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'director' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'director'
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Shield className="w-4 h-4" />
                                            Director
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'utp_head' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'utp_head'
                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            Jefa UTP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'inspector' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'inspector'
                                                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            Inspectoría
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'convivencia' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'convivencia'
                                                    ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Heart className="w-4 h-4" />
                                            Convivencia
                                        </button>
                                    </div>
                                </div>

                                {/* Collapsible Permissions Section (edit mode only) */}
                                {editingUserId && (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setShowPermissions(p => !p)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                        >
                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-indigo-500" />
                                                Permisos de Acceso
                                                {Object.keys(permOverrides).length > 0 && (
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                                                        {Object.keys(permOverrides).length} override{Object.keys(permOverrides).length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showPermissions ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showPermissions && (
                                            <div className="px-4 py-3 space-y-2">
                                                {(formData.role === 'admin' || formData.role === 'super_admin') ? (
                                                    <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                                                        <Shield className="w-4 h-4" />
                                                        Este rol tiene acceso completo siempre.
                                                    </div>
                                                ) : (
                                                    <>
                                                        {Object.keys(permOverrides).length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPermOverrides({})}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors mb-2"
                                                            >
                                                                <RotateCcw className="w-3 h-3" />
                                                                Restaurar Permisos del Rol
                                                            </button>
                                                        )}
                                                        {MODULE_REGISTRY.map(mod => {
                                                            // Compute resolved value using the form's current role + overrides
                                                            const fakeUser = { role: formData.role, permissionOverrides: permOverrides };
                                                            const resolved = resolvePermissions(fakeUser, roleDefaults);
                                                            const value = resolved[mod.key];
                                                            const isOverride = permOverrides[mod.key] !== undefined;

                                                            // Compute role-level value (without user overrides)
                                                            const roleValue = (() => {
                                                                let v = mod.defaultRoles === null ? true : mod.defaultRoles.includes(formData.role);
                                                                const ro = roleDefaults[formData.role]?.modules?.[mod.key];
                                                                if (ro !== undefined) v = ro;
                                                                return v;
                                                            })();

                                                            return (
                                                                <div key={mod.key} className="flex items-center justify-between py-1.5">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <mod.icon className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span className={`font-medium ${isOverride ? 'text-indigo-700' : 'text-slate-600'}`}>{mod.name}</span>
                                                                        {isOverride && (
                                                                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded uppercase">override</span>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newOverrides = { ...permOverrides };
                                                                            const newValue = !value;
                                                                            if (newValue === roleValue) {
                                                                                delete newOverrides[mod.key];
                                                                            } else {
                                                                                newOverrides[mod.key] = newValue;
                                                                            }
                                                                            setPermOverrides(newOverrides);
                                                                        }}
                                                                        className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center
                                                                            ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                    >
                                                                        <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform
                                                                            ${value ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-6 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-all"
                                    >
                                        {editingUserId ? 'Guardar Cambios' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Attributes Modal */}
            <AnimatePresence>
                {isEditAttributesOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-50"
                        >
                            <div className="p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-50/50">
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" /> Atributos Académicos
                                </h3>
                                <button onClick={() => setIsEditAttributesOpen(false)} className="p-2 hover:bg-indigo-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-indigo-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAttributesSubmit} className="p-4 md:p-6 space-y-5">
                                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-4">
                                    Configura la carga académica para este docente. Esto afectará cómo se muestra en los horarios y reportes.
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Profesor Jefe de:</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium"
                                        value={attributesData.headTeacherOf}
                                        onChange={(e) => setAttributesData({ ...attributesData, headTeacherOf: e.target.value })}
                                    >
                                        <option value="">-- No es Profesor Jefe --</option>
                                        <option value="Pre-Kinder">Pre-Kinder</option>
                                        <option value="Kinder">Kinder</option>
                                        <option value="1° Básico">1° Básico</option>
                                        <option value="2° Básico">2° Básico</option>
                                        <option value="3° Básico">3° Básico</option>
                                        <option value="4° Básico">4° Básico</option>
                                        <option value="5° Básico">5° Básico</option>
                                        <option value="6° Básico">6° Básico</option>
                                        <option value="7° Básico">7° Básico</option>
                                        <option value="8° Básico">8° Básico</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Asignaturas (Separadas por comas)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium"
                                        placeholder="Ej: Matemáticas, Taller de Robótica"
                                        value={attributesData.subjects}
                                        onChange={(e) => setAttributesData({ ...attributesData, subjects: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400 mt-1.5 ml-1">Escribe las asignaturas principales que imparte.</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                    >
                                        Guardar Atributos
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 md:p-6 border-b border-red-100 flex justify-between items-center bg-red-50">
                                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                    <div className="bg-red-100 p-1.5 rounded-full">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    </div>
                                    Zona de Peligro
                                </h3>
                                <button onClick={() => setIsResetModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-red-400" />
                                </button>
                            </div>

                            <div className="p-4 md:p-6 space-y-4">
                                <p className="text-slate-600 font-medium">
                                    Estás a punto de borrar todos los datos y restaurar la configuración de fábrica con los usuarios originales.
                                    <br /><br />
                                    <span className="font-bold text-red-600">¿Estás seguro?</span>
                                </p>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setIsResetModalOpen(false)}
                                        className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmReset}
                                        className="flex-1 px-4 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-xl shadow-red-200 hover:-translate-y-0.5 transition-all"
                                    >
                                        Confirmar Restauración
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal - Apple Style */}
            <AnimatePresence>
                {isDeleteModalOpen && userToDelete && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsDeleteModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-md max-w-[calc(100vw-2rem)] w-full overflow-hidden"
                        >
                            <div className="p-4 md:p-6 space-y-4">
                                {/* Icon + Title Section */}
                                <div className="flex items-start gap-4">
                                    {/* Alert Icon */}
                                    <div className="bg-red-50 p-4 rounded-full shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 pt-1">
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                                            ¿Eliminar a {userToDelete.name}?
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Esta acción eliminará permanentemente al usuario y revocará todos sus accesos. No se puede deshacer.
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Sí, Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

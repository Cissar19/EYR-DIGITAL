import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { db } from '../lib/firebase';
import {
    collection, query, where, orderBy, limit,
    startAfter, getDocs,
} from 'firebase/firestore';
import { MODULE_REGISTRY } from '../data/moduleRegistry';
import { resolvePermissions } from '../lib/permissionResolver';
import { User, Plus, Trash2, Mail, Shield, GraduationCap, X, Sparkles, Edit, Search, ChevronLeft, ChevronRight, IdCard, UserPlus, Pencil, ShieldCheck, Briefcase, AlertTriangle, BookOpen, Eye, EyeOff, Shuffle, Heart, ChevronDown, RotateCcw, KeyRound, Copy, Check, Loader2, Dices, ShieldAlert, HeartHandshake, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ModalContainer from './ModalContainer';

const PAGE_FETCH_SIZE = 100; // Firestore batch size — keeps queries fast and bounded

export default function AdminUsers() {
    const { user: currentUser, addUser, updateUser, deleteUser, resetPassword, setUserPassword } = useAuth();
    const { roleDefaults, customRoles, getRoleLabelDynamic } = usePermissions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isEditAttributesOpen, setIsEditAttributesOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'teacher', accessLevel: 'view' });
    const [attributesData, setAttributesData] = useState({ id: null, headTeacherOf: '', subjects: '' });
    const [editingUserId, setEditingUserId] = useState(null);
    const [permOverrides, setPermOverrides] = useState({});
    const [showPermissions, setShowPermissions] = useState(false);
    const [notification, setNotification] = useState(null);
    // Temp password modal state
    const [tempPasswordData, setTempPasswordData] = useState(null);
    const [copiedPassword, setCopiedPassword] = useState(false);
    // Admin reset password modal state
    const [resetTargetUser, setResetTargetUser] = useState(null);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        const array = new Uint8Array(12);
        crypto.getRandomValues(array);
        for (let i = 0; i < 12; i++) {
            password += chars[array[i] % chars.length];
        }
        return password;
    };

    // Local paginated users list — loaded directly from Firestore
    const [MOCK_USERS, setMockUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [lastCursor, setLastCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    // Search, Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const loadUsers = useCallback(async (cursor = null, append = false) => {
        setUsersLoading(true);
        try {
            const constraints = [orderBy('name'), limit(PAGE_FETCH_SIZE + 1)];
            if (roleFilter !== 'all') {
                constraints.unshift(where('role', '==', roleFilter));
            }
            if (cursor) {
                constraints.push(startAfter(cursor));
            }
            const snapshot = await getDocs(query(collection(db, 'users'), ...constraints));
            const docs = snapshot.docs;
            const fetched = docs.slice(0, PAGE_FETCH_SIZE).map(d => ({ id: d.id, ...d.data() }));
            setHasMore(docs.length > PAGE_FETCH_SIZE);
            setLastCursor(docs[PAGE_FETCH_SIZE - 1] ?? null);
            setMockUsers(prev => append ? [...prev, ...fetched] : fetched);
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        } finally {
            setUsersLoading(false);
        }
    }, [roleFilter]);

    // Reload when role filter changes
    useEffect(() => {
        setCurrentPage(1);
        setLastCursor(null);
        loadUsers(null, false);
    }, [loadUsers]);

    const openCreateModal = () => {
        setEditingUserId(null);
        setFormData({ name: '', email: '', role: 'teacher', accessLevel: 'view' });
        setPermOverrides({});
        setShowPermissions(false);
        setIsModalOpen(true);
    };

    const openEditModal = (userToEdit) => {
        setEditingUserId(userToEdit.id);
        setFormData({
            name: userToEdit.name,
            email: userToEdit.email,
            role: userToEdit.role,
            accessLevel: userToEdit.accessLevel || 'view'
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
            const submitData = { ...formData };
            // Admin/super_admin always have edit access
            if (submitData.role === 'admin' || submitData.role === 'super_admin') {
                submitData.accessLevel = 'edit';
            }

            if (editingUserId) {
                await updateUser(editingUserId, { ...submitData, permissionOverrides: permOverrides });
                setNotification('Usuario actualizado correctamente');
                loadUsers(null, false);
            } else {
                const result = await addUser(submitData);
                setTempPasswordData({ name: formData.name, email: formData.email, tempPassword: result.tempPassword });
                setCopiedPassword(false);
                loadUsers(null, false);
            }

            setIsModalOpen(false);
            setEditingUserId(null);
            setFormData({ name: '', email: '', role: 'teacher', accessLevel: 'view' });
            setPermOverrides({});
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            const msg = error.code === 'auth/email-already-in-use'
                ? 'Ya existe un usuario con ese correo'
                : error.message;
            toast.error(msg);
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
                toast.success('Usuario eliminado');
                loadUsers(null, false);
            } catch (error) {
                toast.error(error.message);
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
            case ROLES.CONVIVENCIA_HEAD:
                return {
                    bgColor: 'bg-fuchsia-100',
                    textColor: 'text-fuchsia-600',
                    label: 'Jefe Convivencia',
                    icon: ShieldAlert
                };
            case ROLES.CONVIVENCIA:
                return {
                    bgColor: 'bg-rose-100',
                    textColor: 'text-rose-600',
                    label: 'Convivencia Escolar',
                    icon: Heart
                };
            case ROLES.PIE:
                return {
                    bgColor: 'bg-cyan-100',
                    textColor: 'text-cyan-600',
                    label: 'PIE',
                    icon: HeartHandshake
                };
            default:
                return {
                    bgColor: 'bg-violet-100',
                    textColor: 'text-violet-600',
                    label: getRoleLabelDynamic(role),
                    icon: Tag
                };
        }
    };

    // Combine users from MOCK_USERS and filter out system roles
    const allUsers = MOCK_USERS.filter(user =>
        user.role !== ROLES.SUPER_ADMIN &&
        user.role !== ROLES.PRINTER
    );

    // Security Check: Only Admin/Super Admin can manage users
    const canManageUsers = currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.SUPER_ADMIN);

    // Sort users alphabetically by name for better readability
    const sortedUsers = [...allUsers].sort((a, b) => {
        return a.name.localeCompare(b.name);
    });


    // Available roles for filter (derived from actual users)
    const ROLE_FILTERS = [
        { value: 'all', label: 'Todos' },
        { value: ROLES.TEACHER, label: 'Docentes', icon: GraduationCap, color: 'blue' },
        { value: ROLES.STAFF, label: 'Asistentes', icon: Briefcase, color: 'teal' },
        { value: ROLES.ADMIN, label: 'Admin', icon: ShieldCheck, color: 'amber' },
        { value: ROLES.DIRECTOR, label: 'Director', icon: Shield, color: 'indigo' },
        { value: ROLES.UTP_HEAD, label: 'UTP', icon: BookOpen, color: 'purple' },
        { value: ROLES.INSPECTOR, label: 'Inspectoría', icon: Eye, color: 'orange' },
        { value: ROLES.CONVIVENCIA_HEAD, label: 'Jefe Conv.', icon: ShieldAlert, color: 'fuchsia' },
        { value: ROLES.CONVIVENCIA, label: 'Convivencia', icon: Heart, color: 'rose' },
        { value: ROLES.PIE, label: 'PIE', icon: HeartHandshake, color: 'cyan' },
    ];

    // Show all role filters — we no longer scan the full user list to derive available roles
    const availableRoleFilters = ROLE_FILTERS;

    // Filter Logic with accent-insensitive search + role filter
    const filteredUsers = sortedUsers.filter(u => {
        const matchesSearch = normalizeText(u.name).includes(normalizeText(searchTerm)) ||
            normalizeText(u.email).includes(normalizeText(searchTerm));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleRoleFilterChange = (role) => {
        setRoleFilter(role);
        setCurrentPage(1);
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                            Equipo EYR
                            <span className="ml-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                                {MOCK_USERS.length}{hasMore ? '+' : ''} Miembros
                            </span>
                        </h1>
                    </div>
                    <p className="text-slate-500 mt-1 text-base">Gestión de todo el personal de la escuela (Docentes y Asistentes).</p>
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
            <div className="mb-4 relative w-full md:max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/20 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm font-medium"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Role Filter */}
            <div className="mb-8 flex flex-wrap gap-2">
                {availableRoleFilters.map(rf => {
                    const isActive = roleFilter === rf.value;
                    const Icon = rf.icon;
                    const colorMap = {
                        blue: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                        teal: 'bg-teal-100 text-teal-700 border-teal-200',
                        amber: 'bg-amber-100 text-amber-700 border-amber-200',
                        indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                        purple: 'bg-purple-100 text-purple-700 border-purple-200',
                        orange: 'bg-orange-100 text-orange-700 border-orange-200',
                        fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
                        rose: 'bg-rose-100 text-rose-700 border-rose-200',
                        cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                    };
                    const activeClass = rf.value === 'all'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : colorMap[rf.color] || 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                        <button
                            key={rf.value}
                            onClick={() => handleRoleFilterChange(rf.value)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                isActive
                                    ? activeClass + ' shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                        >
                            {Icon && <Icon className="w-3.5 h-3.5" />}
                            {rf.label}
                            {isActive && rf.value !== 'all' && (
                                <span className="ml-1 bg-white/30 px-1.5 py-0.5 rounded-md text-[10px]">
                                    {filteredUsers.length}
                                </span>
                            )}
                        </button>
                    );
                })}
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
            {usersLoading && MOCK_USERS.length === 0 && (
                <div className="flex justify-center items-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            )}
            {!usersLoading && currentUsers.length > 0 ? (
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
                                            className="flex-1 md:flex-none flex justify-center items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn"
                                            title="Editar Usuario"
                                        >
                                            <Pencil className="w-5 h-5 md:w-4 md:h-4 text-gray-400 group-hover/btn:text-indigo-600 transition-colors" />
                                        </button>
                                        <button
                                            onClick={() => setResetTargetUser(u)}
                                            className="flex-1 md:flex-none flex justify-center items-center p-2 hover:bg-amber-50 rounded-lg transition-colors group/btn"
                                            title="Resetear Contraseña"
                                        >
                                            <KeyRound className="w-5 h-5 md:w-4 md:h-4 text-gray-400 group-hover/btn:text-amber-600 transition-colors" />
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

                                {/* Last Set Password */}
                                {canManageUsers && u.lastSetPassword && (
                                    <div className="flex items-center gap-3 text-sm bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Contraseña</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <code className="text-xs font-mono text-slate-700 truncate">{u.lastSetPassword}</code>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(u.lastSetPassword);
                                                        toast.success('Contraseña copiada');
                                                    }}
                                                    className="shrink-0 p-1 hover:bg-amber-100 rounded transition-colors"
                                                    title="Copiar contraseña"
                                                >
                                                    <Copy className="w-3 h-3 text-amber-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

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

                                {/* Profesor Jefe Toggle */}
                                {canManageUsers && (
                                    <button
                                        onClick={() => {
                                            const current = !!u.isHeadTeacher;
                                            updateUser(u.id, { isHeadTeacher: !current });
                                        }}
                                        className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all ${
                                            u.isHeadTeacher
                                                ? 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50'
                                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className={`w-3.5 h-3.5 ${
                                                u.isHeadTeacher ? 'text-indigo-600' : 'text-slate-400'
                                            }`} />
                                            <span className="text-xs font-semibold text-slate-600">Profesor Jefe</span>
                                        </div>
                                        <div className={`w-9 h-5 rounded-full transition-colors relative ${
                                            u.isHeadTeacher ? 'bg-indigo-500' : 'bg-slate-300'
                                        }`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                                u.isHeadTeacher ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                        </div>
                                    </button>
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

            {/* Load more from Firestore when there are more results */}
            {hasMore && !searchTerm && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => loadUsers(lastCursor, true)}
                        disabled={usersLoading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all disabled:opacity-50"
                    >
                        {usersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        Cargar más usuarios
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <ModalContainer onClose={() => setIsModalOpen(false)} maxWidth="max-w-md">
                        <div className="px-7 pt-6 pb-4 flex justify-between items-center">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface">
                                {editingUserId ? 'Editar Usuario' : 'Nuevo Miembro'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-eyr-surface-low rounded-full transition-colors">
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        <form id="createEditUserForm" onSubmit={handleSubmit} className="px-7 pb-0 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-eyr-surface-low border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-medium text-eyr-on-surface"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-eyr-surface-low border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-medium text-eyr-on-surface"
                                    placeholder="ejemplo@eduhuechuraba.cl"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1">Rol de Sistema</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'teacher' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'teacher'
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
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
                                            onClick={() => { setFormData({ ...formData, role: 'convivencia_head' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'convivencia_head'
                                                    ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-lg shadow-fuchsia-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                            Jefe Conv.
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
                                        <button
                                            type="button"
                                            onClick={() => { setFormData({ ...formData, role: 'pie' }); setPermOverrides({}); }}
                                            className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                        ${formData.role === 'pie'
                                                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <HeartHandshake className="w-4 h-4" />
                                            PIE
                                        </button>
                                        {/* Custom roles */}
                                        {customRoles.map(cr => (
                                            <button
                                                key={cr.key}
                                                type="button"
                                                onClick={() => { setFormData({ ...formData, role: cr.key }); setPermOverrides({}); }}
                                                className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                    ${formData.role === cr.key
                                                        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <Tag className="w-4 h-4" />
                                                {cr.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Access Level Toggle - hidden for admin/super_admin (they always edit) */}
                                {formData.role !== 'admin' && formData.role !== 'super_admin' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nivel de Acceso</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, accessLevel: 'view' })}
                                                className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                    ${formData.accessLevel === 'view'
                                                        ? 'bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <Eye className="w-4 h-4" />
                                                Puede Ver
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, accessLevel: 'edit' })}
                                                className={`px-3 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5
                                                    ${formData.accessLevel === 'edit'
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Puede Editar
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1.5 ml-1">Puede Editar permite crear, modificar y eliminar registros.</p>
                                    </div>
                                )}

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
                                                            const fakeUser = { role: formData.role, permissionOverrides: permOverrides };
                                                            const resolved = resolvePermissions(fakeUser, roleDefaults);
                                                            const value = resolved[mod.key]; // false | 'view' | 'edit'
                                                            const isOverride = permOverrides[mod.key] !== undefined;

                                                            // Role-level value (layers 1+2, no user overrides)
                                                            const roleValue = (() => {
                                                                let v = mod.defaultRoles === null ? 'edit' : (mod.defaultRoles.includes(formData.role) ? 'edit' : false);
                                                                const ro = roleDefaults[formData.role]?.modules?.[mod.key];
                                                                if (ro !== undefined) v = ro === true ? 'edit' : ro === false ? false : ro;
                                                                return v;
                                                            })();

                                                            const nextVal = (cur) => { if (!cur) return 'view'; if (cur === 'view') return 'edit'; return false; };

                                                            const pillStyles = {
                                                                false: 'bg-slate-100 text-slate-400',
                                                                view: 'bg-amber-50 text-amber-600 ring-1 ring-amber-300',
                                                                edit: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-400',
                                                            };
                                                            const pillLabel = { false: '—', view: 'Ver', edit: 'Editar' };

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
                                                                            const newVal = nextVal(value);
                                                                            const newOverrides = { ...permOverrides };
                                                                            if (newVal === roleValue) {
                                                                                delete newOverrides[mod.key];
                                                                            } else {
                                                                                newOverrides[mod.key] = newVal;
                                                                            }
                                                                            setPermOverrides(newOverrides);
                                                                        }}
                                                                        className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${pillStyles[value || false]}`}
                                                                    >
                                                                        {pillLabel[value || false]}
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

                        </form>
                        <div className="px-7 py-5 bg-eyr-surface-mid flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                form="createEditUserForm"
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                {editingUserId ? 'Guardar Cambios' : 'Crear'}
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* Edit Attributes Modal */}
            <AnimatePresence>
                {isEditAttributesOpen && (
                    <ModalContainer onClose={() => setIsEditAttributesOpen(false)} maxWidth="max-w-md">
                        <div className="px-7 pt-6 pb-4 flex justify-between items-center">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-eyr-primary" /> Atributos Académicos
                            </h3>
                            <button onClick={() => setIsEditAttributesOpen(false)} className="p-2 hover:bg-eyr-surface-low rounded-full transition-colors">
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        <form id="attributesForm" onSubmit={handleAttributesSubmit} className="px-7 pb-0 space-y-5 overflow-y-auto">
                            <div className="bg-eyr-surface-low p-4 rounded-2xl text-sm text-eyr-on-variant border border-eyr-outline-variant/30">
                                Configura la carga académica para este docente. Esto afectará cómo se muestra en los horarios y reportes.
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1">Profesor Jefe de:</label>
                                <select
                                    className="w-full px-5 py-4 rounded-2xl bg-eyr-surface-low border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-medium text-eyr-on-surface"
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
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1">Asignaturas (Separadas por comas)</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 rounded-2xl bg-eyr-surface-low border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-medium text-eyr-on-surface"
                                    placeholder="Ej: Matemáticas, Taller de Robótica"
                                    value={attributesData.subjects}
                                    onChange={(e) => setAttributesData({ ...attributesData, subjects: e.target.value })}
                                />
                                <p className="text-xs text-eyr-on-variant mt-1.5 ml-1">Escribe las asignaturas principales que imparte.</p>
                            </div>
                        </form>

                        <div className="px-7 py-5 bg-eyr-surface-mid flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsEditAttributesOpen(false)}
                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                form="attributesForm"
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                Guardar Atributos
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>
            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <ModalContainer onClose={() => setIsResetModalOpen(false)} maxWidth="max-w-md">
                        <div className="px-7 pt-6 pb-4 flex justify-between items-center">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface flex items-center gap-2">
                                <div className="bg-red-100 p-1.5 rounded-full">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                </div>
                                Zona de Peligro
                            </h3>
                            <button onClick={() => setIsResetModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        <div className="px-7 pb-0 overflow-y-auto">
                            <p className="text-eyr-on-variant font-medium">
                                Estás a punto de borrar todos los datos y restaurar la configuración de fábrica con los usuarios originales.
                                <br /><br />
                                <span className="font-bold text-red-600">¿Estás seguro?</span>
                            </p>
                        </div>

                        <div className="px-7 py-5 bg-eyr-surface-mid flex gap-3 shrink-0">
                            <button
                                onClick={() => setIsResetModalOpen(false)}
                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReset}
                                className="flex-1 px-4 py-3 rounded-2xl bg-red-600 text-white font-extrabold hover:bg-red-700 shadow-xl shadow-red-200 hover:-translate-y-0.5 transition-all"
                            >
                                Confirmar Restauración
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && userToDelete && (
                    <ModalContainer onClose={() => setIsDeleteModalOpen(false)} maxWidth="max-w-sm">
                        <div className="px-7 pt-6 pb-4 flex items-start gap-4">
                            <div className="bg-red-50 p-4 rounded-full shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1 pt-1">
                                <h3 className="text-lg font-headline font-extrabold text-eyr-on-surface mb-1">
                                    ¿Eliminar a {userToDelete.name}?
                                </h3>
                                <p className="text-sm text-eyr-on-variant leading-relaxed">
                                    Esta acción eliminará permanentemente al usuario y revocará todos sus accesos. No se puede deshacer.
                                </p>
                            </div>
                        </div>

                        <div className="px-7 py-5 bg-eyr-surface-mid flex gap-3 shrink-0">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-3 rounded-2xl bg-red-600 text-white font-extrabold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* Temp Password Modal */}
            <AnimatePresence>
                {tempPasswordData && (
                    <ModalContainer onClose={() => setTempPasswordData(null)} maxWidth="max-w-md">
                        <div className="px-7 pt-6 pb-4 flex justify-between items-center">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface flex items-center gap-2">
                                <div className="bg-emerald-100 p-1.5 rounded-full">
                                    <KeyRound className="w-4 h-4 text-emerald-600" />
                                </div>
                                Usuario Creado
                            </h3>
                            <button onClick={() => setTempPasswordData(null)} className="p-2 hover:bg-eyr-surface-low rounded-full transition-colors">
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        <div className="px-7 pb-0 space-y-4 overflow-y-auto">
                            <div className="text-sm text-eyr-on-variant">
                                <p className="font-medium">Se creó el usuario <span className="font-bold text-eyr-on-surface">{tempPasswordData.name}</span> con el correo:</p>
                                <p className="text-eyr-primary font-mono text-sm mt-1">{tempPasswordData.email}</p>
                            </div>

                            <div className="bg-eyr-surface-low border border-eyr-outline-variant/30 rounded-2xl p-4 space-y-2">
                                <label className="text-xs font-bold text-eyr-on-variant uppercase tracking-wider">Contraseña Temporal</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white border border-eyr-outline-variant/30 rounded-xl px-4 py-3 font-mono text-lg text-eyr-on-surface tracking-wider select-all">
                                        {tempPasswordData.tempPassword}
                                    </code>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(tempPasswordData.tempPassword);
                                                setCopiedPassword(true);
                                                setTimeout(() => setCopiedPassword(false), 2000);
                                            } catch {
                                                toast.error('No se pudo copiar. Selecciona y copia manualmente.');
                                            }
                                        }}
                                        className={`p-3 rounded-xl transition-all ${copiedPassword ? 'bg-emerald-100 text-emerald-600' : 'bg-eyr-surface-low hover:bg-eyr-surface-mid text-eyr-on-variant'}`}
                                        title="Copiar contraseña"
                                    >
                                        {copiedPassword ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700 font-medium">
                                    Esta contraseña solo se muestra una vez. Cópiala ahora y entrégala al usuario.
                                </p>
                            </div>
                        </div>

                        <div className="px-7 py-5 bg-eyr-surface-mid shrink-0">
                            <button
                                onClick={() => setTempPasswordData(null)}
                                className="w-full bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* Admin Set Password Modal */}
            <AnimatePresence>
                {resetTargetUser && (
                    <ModalContainer
                        onClose={() => !isResettingPassword && (() => { setResetTargetUser(null); setNewPasswordValue(''); setShowNewPassword(false); })()}
                        maxWidth="max-w-md"
                    >
                        <div className="px-7 pt-6 pb-4 flex justify-between items-center">
                            <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface flex items-center gap-2">
                                <div className="bg-amber-100 p-1.5 rounded-full">
                                    <KeyRound className="w-4 h-4 text-amber-600" />
                                </div>
                                Cambiar Contraseña
                            </h3>
                            <button
                                onClick={() => { setResetTargetUser(null); setNewPasswordValue(''); setShowNewPassword(false); }}
                                disabled={isResettingPassword}
                                className="p-2 hover:bg-eyr-surface-low rounded-full transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-eyr-on-variant" />
                            </button>
                        </div>

                        <div className="px-7 pb-0 space-y-4 overflow-y-auto">
                            <p className="text-sm text-eyr-on-variant">
                                Establece una nueva contraseña para <span className="font-semibold text-eyr-on-surface">{resetTargetUser.name}</span> ({resetTargetUser.email}).
                            </p>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1">Nueva Contraseña</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPasswordValue}
                                            onChange={(e) => setNewPasswordValue(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full px-5 py-4 pr-12 rounded-2xl bg-eyr-surface-low border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 outline-none transition-all font-mono text-sm text-eyr-on-surface"
                                            disabled={isResettingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-eyr-on-variant hover:text-eyr-on-surface transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setNewPasswordValue(generateRandomPassword()); setShowNewPassword(true); }}
                                        disabled={isResettingPassword}
                                        className="px-3 py-3 rounded-2xl bg-eyr-surface-low hover:bg-eyr-surface-mid border border-eyr-outline-variant/30 text-eyr-on-variant transition-colors disabled:opacity-50"
                                        title="Generar contraseña aleatoria"
                                    >
                                        <Dices className="w-5 h-5" />
                                    </button>
                                </div>
                                {newPasswordValue.length > 0 && newPasswordValue.length < 6 && (
                                    <p className="text-xs text-red-500 mt-1 ml-1">La contraseña debe tener al menos 6 caracteres</p>
                                )}
                            </div>

                            {/* Fallback: send email option */}
                            <div className="border-t border-eyr-outline-variant/30 pt-2">
                                <button
                                    onClick={async () => {
                                        setIsResettingPassword(true);
                                        try {
                                            await resetPassword(resetTargetUser.email, resetTargetUser.name);
                                            toast.success(`Correo de recuperación enviado a ${resetTargetUser.email}`);
                                            setResetTargetUser(null);
                                            setNewPasswordValue('');
                                            setShowNewPassword(false);
                                        } catch (error) {
                                            toast.error('Error al enviar correo: ' + error.message);
                                        } finally {
                                            setIsResettingPassword(false);
                                        }
                                    }}
                                    disabled={isResettingPassword}
                                    className="w-full text-center text-xs text-eyr-on-variant hover:text-eyr-on-surface font-medium py-2 transition-colors disabled:opacity-50"
                                >
                                    <Mail className="w-3.5 h-3.5 inline mr-1" />
                                    O enviar correo de recuperación
                                </button>
                            </div>
                        </div>

                        <div className="px-7 py-5 bg-eyr-surface-mid flex gap-3 shrink-0">
                            <button
                                onClick={() => { setResetTargetUser(null); setNewPasswordValue(''); setShowNewPassword(false); }}
                                disabled={isResettingPassword}
                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (newPasswordValue.length < 6) return;
                                    setIsResettingPassword(true);
                                    try {
                                        await setUserPassword(resetTargetUser.uid, newPasswordValue);
                                        toast.success(
                                            <div>
                                                <p className="font-semibold">Contraseña actualizada para {resetTargetUser.name}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{newPasswordValue}</code>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(newPasswordValue);
                                                            toast.success('Contraseña copiada');
                                                        }}
                                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>,
                                            { duration: 10000 }
                                        );
                                        setResetTargetUser(null);
                                        setNewPasswordValue('');
                                        setShowNewPassword(false);
                                    } catch (error) {
                                        toast.error('Error: ' + error.message);
                                    } finally {
                                        setIsResettingPassword(false);
                                    }
                                }}
                                disabled={isResettingPassword || newPasswordValue.length < 6}
                                className="flex-1 bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isResettingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Cambiar Contraseña'
                                )}
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Search, RotateCcw, X, Info, Eye, Pencil, Ban, Plus, Trash2, Tag } from 'lucide-react';
import { useAuth, getRoleLabel } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { MODULE_REGISTRY } from '../data/moduleRegistry';
import { resolvePermissions } from '../lib/permissionResolver';

const TABS = [
    { key: 'roles', label: 'Por Rol', icon: Shield },
    { key: 'users', label: 'Por Usuario', icon: Users },
];

// ── Cycle: false → 'view' → 'edit' → false ──
function nextLevel(current) {
    if (!current) return 'view';
    if (current === 'view') return 'edit';
    return false;
}

// ── Normalize stored value (backward compat) ──
function normalize(v) {
    if (v === true) return 'edit';
    if (!v) return false;
    return v;
}

// ── 3-state pill ──
function AccessPill({ value, onChange, disabled }) {
    const styles = {
        false: { label: '—', icon: Ban, cls: 'bg-slate-100 text-slate-400' },
        view:  { label: 'Ver', icon: Eye, cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-300' },
        edit:  { label: 'Editar', icon: Pencil, cls: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-400' },
    };
    const s = styles[value || false];
    const Icon = s.icon;
    return (
        <button
            onClick={() => !disabled && onChange(nextLevel(value))}
            disabled={disabled}
            title="Clic para cambiar"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all select-none ${s.cls} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
        >
            <Icon className="w-3 h-3" />
            {s.label}
        </button>
    );
}

// ── Tab 1: Role Matrix ──
function RoleMatrixTab({ roleDefaults, allConfigurableRoles, customRoles, getRoleLabelDynamic, updateRoleDefaults, createRole, deleteRole }) {
    const [saving, setSaving] = useState(null);
    const [newRoleLabel, setNewRoleLabel] = useState('');
    const [creating, setCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [deletingRole, setDeletingRole] = useState(null);

    const getEffectiveValue = (role, moduleKey) => {
        const mod = MODULE_REGISTRY.find(m => m.key === moduleKey);
        let value = mod.defaultRoles === null ? 'edit' : (mod.defaultRoles.includes(role) ? 'edit' : false);
        const override = roleDefaults[role]?.modules?.[moduleKey];
        if (override !== undefined) value = normalize(override);
        return value;
    };

    const isOverridden = (role, moduleKey) =>
        roleDefaults[role]?.modules?.[moduleKey] !== undefined;

    const handleChange = async (role, moduleKey, currentValue) => {
        const key = `${role}:${moduleKey}`;
        setSaving(key);
        try {
            const currentModules = roleDefaults[role]?.modules || {};
            await updateRoleDefaults(role, { ...currentModules, [moduleKey]: nextLevel(currentValue) });
        } catch (err) {
            console.error('Error actualizando rol:', err);
        }
        setSaving(null);
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleLabel.trim()) return;
        setCreating(true);
        try {
            await createRole(newRoleLabel.trim());
            setNewRoleLabel('');
            setShowCreateForm(false);
        } catch (err) {
            alert(err.message);
        }
        setCreating(false);
    };

    const handleDeleteRole = async (key) => {
        setDeletingRole(key);
        try {
            await deleteRole(key);
        } catch (err) {
            console.error('Error eliminando rol:', err);
        }
        setDeletingRole(null);
    };

    return (
        <div>
            {/* Create role button */}
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-slate-500">Configura qué módulos puede ver o editar cada rol. Clic en la píldora para cambiar el nivel.</p>
                <button
                    onClick={() => setShowCreateForm(v => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Rol
                </button>
            </div>

            {/* Create form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCreateRole}
                        className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3"
                    >
                        <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                        <input
                            type="text"
                            value={newRoleLabel}
                            onChange={e => setNewRoleLabel(e.target.value)}
                            placeholder="Nombre del nuevo rol (ej: Enfermera, Psicólogo)"
                            className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={creating || !newRoleLabel.trim()}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creando…' : 'Crear'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowCreateForm(false); setNewRoleLabel(''); }}
                            className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Matrix */}
            <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-100/50">
                                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 z-10 min-w-[180px] bg-slate-100/50 rounded-tl-xl">
                                    Módulo
                                </th>
                                {allConfigurableRoles.map(role => {
                                    const isCustom = customRoles.some(r => r.key === role);
                                    return (
                                        <th key={role} className="px-3 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center bg-slate-100/50 whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{getRoleLabelDynamic(role)}</span>
                                                {isCustom && (
                                                    <button
                                                        onClick={() => handleDeleteRole(role)}
                                                        disabled={deletingRole === role}
                                                        title="Eliminar rol personalizado"
                                                        className="text-rose-400 hover:text-rose-600 transition-colors disabled:opacity-40"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {MODULE_REGISTRY.map(mod => (
                                <tr key={mod.key} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/5">
                                    <td className="py-3 px-4 font-medium text-slate-700 sticky left-0 bg-white z-10">
                                        <div className="flex items-center gap-2">
                                            <mod.icon className="w-4 h-4 text-slate-400" />
                                            {mod.name}
                                        </div>
                                    </td>
                                    {allConfigurableRoles.map(role => {
                                        const value = getEffectiveValue(role, mod.key);
                                        const overridden = isOverridden(role, mod.key);
                                        const isSaving = saving === `${role}:${mod.key}`;
                                        return (
                                            <td key={role} className="py-2.5 px-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <AccessPill
                                                        value={value}
                                                        onChange={() => handleChange(role, mod.key, value)}
                                                        disabled={isSaving}
                                                    />
                                                    {overridden && (
                                                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">override</span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="font-semibold text-slate-400 uppercase tracking-wide">Leyenda:</span>
                <span className="flex items-center gap-1.5"><AccessPill value={false} onChange={() => {}} disabled /> Sin acceso</span>
                <span className="flex items-center gap-1.5"><AccessPill value="view" onChange={() => {}} disabled /> Solo puede ver</span>
                <span className="flex items-center gap-1.5"><AccessPill value="edit" onChange={() => {}} disabled /> Puede ver y editar</span>
            </div>

            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Los roles <strong>Admin Plataforma</strong> y <strong>Administradora</strong> siempre tienen acceso completo de edición.</span>
            </div>
        </div>
    );
}

// ── Tab 2: Per-User Editor ──
function UserPermissionsTab({ roleDefaults, getRoleLabelDynamic, updateUserPermissionOverrides }) {
    const { users } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);

    const normalizeText = (t) =>
        t?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const norm = normalizeText(searchTerm);
        return users
            .filter(u => u.role !== 'super_admin')
            .filter(u => normalizeText(u.name).includes(norm) || normalizeText(u.email).includes(norm))
            .slice(0, 10);
    }, [users, searchTerm]);

    const resolved = useMemo(() => {
        if (!selectedUser) return {};
        return resolvePermissions(selectedUser, roleDefaults);
    }, [selectedUser, roleDefaults]);

    const isFullAccess = selectedUser?.role === 'super_admin' || selectedUser?.role === 'admin';

    const getRoleValue = (moduleKey) => {
        if (!selectedUser) return false;
        const mod = MODULE_REGISTRY.find(m => m.key === moduleKey);
        let value = mod.defaultRoles === null ? 'edit' : (mod.defaultRoles.includes(selectedUser.role) ? 'edit' : false);
        const ro = roleDefaults[selectedUser.role]?.modules?.[moduleKey];
        if (ro !== undefined) value = normalize(ro);
        return value;
    };

    const handleChange = async (moduleKey) => {
        if (!selectedUser || isFullAccess || saving) return;
        setSaving(true);
        try {
            const newOverrides = { ...(selectedUser.permissionOverrides || {}) };
            const newValue = nextLevel(resolved[moduleKey]);
            if (newValue === getRoleValue(moduleKey)) {
                delete newOverrides[moduleKey];
            } else {
                newOverrides[moduleKey] = newValue;
            }
            await updateUserPermissionOverrides(selectedUser.id, newOverrides);
            setSelectedUser(prev => ({ ...prev, permissionOverrides: newOverrides }));
        } catch (err) {
            console.error('Error actualizando permisos:', err);
        }
        setSaving(false);
    };

    const handleResetAll = async () => {
        if (!selectedUser || isFullAccess) return;
        setSaving(true);
        try {
            await updateUserPermissionOverrides(selectedUser.id, {});
            setSelectedUser(prev => ({ ...prev, permissionOverrides: {} }));
        } catch (err) {
            console.error('Error reseteando permisos:', err);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/20 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm font-medium"
                    placeholder="Buscar usuario por nombre o correo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {filteredUsers.length > 0 && (
                    <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                        {filteredUsers.map(u => (
                            <button
                                key={u.id}
                                onClick={() => { setSelectedUser(u); setSearchTerm(''); }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
                            >
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                    {u.name?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800 truncate">{u.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{u.email} — {getRoleLabelDynamic(u.role)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedUser && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-100/5 shadow-sm overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {selectedUser.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                                <p className="text-sm text-slate-500">{getRoleLabelDynamic(selectedUser.role)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isFullAccess && Object.keys(selectedUser.permissionOverrides || {}).length > 0 && (
                                <button onClick={handleResetAll} disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restaurar del Rol
                                </button>
                            )}
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {isFullAccess && (
                        <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-700 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Este rol tiene acceso completo de edición siempre. Los permisos no se pueden modificar.
                        </div>
                    )}

                    {!isFullAccess && (
                        <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <span>Módulo</span>
                            <div className="flex items-center gap-6 pr-1">
                                <span>Acceso</span>
                                <span className="w-16 text-center">Origen</span>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-slate-100">
                        {MODULE_REGISTRY.map(mod => {
                            const value = resolved[mod.key];
                            const overridden = selectedUser?.permissionOverrides?.[mod.key] !== undefined;
                            return (
                                <div key={mod.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <mod.icon className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-700">{mod.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <AccessPill value={value} onChange={() => handleChange(mod.key)} disabled={isFullAccess || saving} />
                                        <span className={`w-16 text-center text-[10px] font-bold uppercase tracking-wide ${overridden ? 'text-indigo-500' : 'text-slate-300'}`}>
                                            {overridden ? 'override' : 'del rol'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {!selectedUser && (
                <div className="text-center py-16 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Busca y selecciona un usuario para ver o editar sus permisos</p>
                </div>
            )}
        </div>
    );
}

// ── Main ──
export default function PermissionsManager() {
    const [activeTab, setActiveTab] = useState('roles');
    const { roleDefaults, customRoles, allConfigurableRoles, getRoleLabelDynamic, updateRoleDefaults, updateUserPermissionOverrides, createRole, deleteRole } = usePermissions();

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Gestionar Permisos</h1>
                </div>
                <p className="text-slate-500 mt-2 text-lg">Controla qué módulos puede ver o editar cada rol o usuario individual.</p>
            </div>

            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100/5 shadow-sm p-6">
                {activeTab === 'roles' && (
                    <RoleMatrixTab
                        roleDefaults={roleDefaults}
                        allConfigurableRoles={allConfigurableRoles}
                        customRoles={customRoles}
                        getRoleLabelDynamic={getRoleLabelDynamic}
                        updateRoleDefaults={updateRoleDefaults}
                        createRole={createRole}
                        deleteRole={deleteRole}
                    />
                )}
                {activeTab === 'users' && (
                    <UserPermissionsTab
                        roleDefaults={roleDefaults}
                        getRoleLabelDynamic={getRoleLabelDynamic}
                        updateUserPermissionOverrides={updateUserPermissionOverrides}
                    />
                )}
            </div>
        </div>
    );
}

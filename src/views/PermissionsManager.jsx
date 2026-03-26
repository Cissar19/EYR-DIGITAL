import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Search, RotateCcw, Check, X, Info } from 'lucide-react';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { MODULE_REGISTRY, CONFIGURABLE_ROLES } from '../data/moduleRegistry';
import { resolvePermissions } from '../lib/permissionResolver';

const TABS = [
    { key: 'roles', label: 'Por Rol', icon: Shield },
    { key: 'users', label: 'Por Usuario', icon: Users },
];

// ── Tab 1: Role Matrix ──
function RoleMatrixTab({ roleDefaults, updateRoleDefaults }) {
    const [saving, setSaving] = useState(null); // "role:moduleKey"

    const handleToggle = async (role, moduleKey, currentValue) => {
        const key = `${role}:${moduleKey}`;
        setSaving(key);
        try {
            const currentModules = roleDefaults[role]?.modules || {};
            await updateRoleDefaults(role, { ...currentModules, [moduleKey]: !currentValue });
        } catch (err) {
            console.error('Error updating role defaults:', err);
        }
        setSaving(null);
    };

    // For each role+module, compute the effective value considering only layers 1+2
    const getEffectiveValue = (role, moduleKey) => {
        const mod = MODULE_REGISTRY.find(m => m.key === moduleKey);
        // Layer 1: hardcoded
        let value = mod.defaultRoles === null ? true : mod.defaultRoles.includes(role);
        // Layer 2: role override
        const override = roleDefaults[role]?.modules?.[moduleKey];
        if (override !== undefined) value = override;
        return value;
    };

    const isOverridden = (role, moduleKey) => {
        return roleDefaults[role]?.modules?.[moduleKey] !== undefined;
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[700px]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-100/50">
                            <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50 rounded-tl-xl sticky left-0 z-10 min-w-[180px]">Modulo</th>
                            {CONFIGURABLE_ROLES.map(role => (
                                <th key={role} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center bg-slate-100/50 whitespace-nowrap">
                                    {getRoleLabel(role)}
                                </th>
                            ))}
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
                                {CONFIGURABLE_ROLES.map(role => {
                                    const value = getEffectiveValue(role, mod.key);
                                    const overridden = isOverridden(role, mod.key);
                                    const isSaving = saving === `${role}:${mod.key}`;

                                    return (
                                        <td key={role} className="py-3 px-2 text-center">
                                            <button
                                                onClick={() => handleToggle(role, mod.key, value)}
                                                disabled={isSaving}
                                                className={`
                                                    w-10 h-6 rounded-full transition-colors relative inline-flex items-center
                                                    ${value ? 'bg-emerald-500' : 'bg-slate-300'}
                                                    ${overridden ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}
                                                    ${isSaving ? 'opacity-50' : 'hover:opacity-80'}
                                                `}
                                            >
                                                <span className={`
                                                    inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform
                                                    ${value ? 'translate-x-5' : 'translate-x-1'}
                                                `} />
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <span className="w-4 h-3 rounded-full bg-emerald-500 inline-block" /> Activado
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-3 rounded-full bg-slate-300 inline-block" /> Desactivado
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-3 rounded-full bg-slate-300 ring-2 ring-indigo-300 ring-offset-1 inline-block" /> Sobreescrito (distinto al default)
                </span>
            </div>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Los roles <strong>Admin Plataforma</strong> y <strong>Administradora</strong> siempre tienen acceso completo, sin importar esta configuracion.</span>
            </div>
        </div>
    );
}

// ── Tab 2: Per-User Editor ──
function UserPermissionsTab({ roleDefaults, updateUserPermissionOverrides }) {
    const { users } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);

    const normalizeText = (text) =>
        text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const norm = normalizeText(searchTerm);
        return users
            .filter(u => u.role !== 'super_admin')
            .filter(u =>
                normalizeText(u.name).includes(norm) ||
                normalizeText(u.email).includes(norm)
            )
            .slice(0, 10);
    }, [users, searchTerm]);

    const selectUser = (u) => {
        setSelectedUser(u);
        setSearchTerm('');
    };

    // Resolve permissions for selected user
    const resolved = useMemo(() => {
        if (!selectedUser) return {};
        return resolvePermissions(selectedUser, roleDefaults);
    }, [selectedUser, roleDefaults]);

    const isFullAccess = selectedUser?.role === 'super_admin' || selectedUser?.role === 'admin';

    // Get the "role-level" value (layers 1+2 only, no user overrides)
    const getRoleValue = (moduleKey) => {
        if (!selectedUser) return false;
        const mod = MODULE_REGISTRY.find(m => m.key === moduleKey);
        let value = mod.defaultRoles === null ? true : mod.defaultRoles.includes(selectedUser.role);
        const roleOverride = roleDefaults[selectedUser.role]?.modules?.[moduleKey];
        if (roleOverride !== undefined) value = roleOverride;
        return value;
    };

    const hasUserOverride = (moduleKey) => {
        return selectedUser?.permissionOverrides?.[moduleKey] !== undefined;
    };

    const handleToggle = async (moduleKey) => {
        if (!selectedUser || isFullAccess) return;
        setSaving(true);
        try {
            const currentOverrides = { ...(selectedUser.permissionOverrides || {}) };
            const currentResolved = resolved[moduleKey];
            const roleValue = getRoleValue(moduleKey);

            // Toggle: if there's an override, toggling sets to opposite of current resolved
            const newValue = !currentResolved;

            // If new value equals role value, remove the override (it's redundant)
            if (newValue === roleValue) {
                delete currentOverrides[moduleKey];
            } else {
                currentOverrides[moduleKey] = newValue;
            }

            await updateUserPermissionOverrides(selectedUser.id, currentOverrides);
            // Update local selected user
            setSelectedUser(prev => ({ ...prev, permissionOverrides: currentOverrides }));
        } catch (err) {
            console.error('Error updating user permissions:', err);
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
            console.error('Error resetting user permissions:', err);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/20 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm font-medium"
                    placeholder="Buscar usuario por nombre o correo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />

                {/* Search results dropdown */}
                {filteredUsers.length > 0 && (
                    <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                        {filteredUsers.map(u => (
                            <button
                                key={u.id}
                                onClick={() => selectUser(u)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
                            >
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                    {u.name?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800 truncate">{u.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{u.email} — {getRoleLabel(u.role)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected user card */}
            {selectedUser && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-100/5 shadow-sm overflow-hidden"
                >
                    {/* User header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {selectedUser.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                                <p className="text-sm text-slate-500">{getRoleLabel(selectedUser.role)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isFullAccess && Object.keys(selectedUser.permissionOverrides || {}).length > 0 && (
                                <button
                                    onClick={handleResetAll}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restaurar del Rol
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Full access notice */}
                    {isFullAccess && (
                        <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-700 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Este rol tiene acceso completo siempre. Los permisos no se pueden modificar.
                        </div>
                    )}

                    {/* Permissions list */}
                    <div className="divide-y divide-slate-100">
                        {MODULE_REGISTRY.map(mod => {
                            const value = resolved[mod.key];
                            const overridden = hasUserOverride(mod.key);
                            const roleValue = getRoleValue(mod.key);

                            return (
                                <div key={mod.key} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <mod.icon className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <span className="font-medium text-slate-700">{mod.name}</span>
                                            {overridden && (
                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                    override
                                                </span>
                                            )}
                                            {!overridden && (
                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    heredado del rol
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(mod.key)}
                                        disabled={isFullAccess || saving}
                                        className={`
                                            w-10 h-6 rounded-full transition-colors relative inline-flex items-center
                                            ${value ? 'bg-emerald-500' : 'bg-slate-300'}
                                            ${isFullAccess ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
                                        `}
                                    >
                                        <span className={`
                                            inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform
                                            ${value ? 'translate-x-5' : 'translate-x-1'}
                                        `} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {!selectedUser && (
                <div className="text-center py-16 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Busca y selecciona un usuario para editar sus permisos</p>
                </div>
            )}
        </div>
    );
}

// ── Main Component ──
export default function PermissionsManager() {
    const [activeTab, setActiveTab] = useState('roles');
    const { roleDefaults, updateRoleDefaults, updateUserPermissionOverrides } = usePermissions();

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Gestionar Permisos</h1>
                    </div>
                </div>
                <p className="text-slate-500 mt-2 text-lg">Controla que modulos puede ver cada rol o usuario individual.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all
                                ${isActive
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-3xl border border-slate-100/5 shadow-sm p-6">
                {activeTab === 'roles' && (
                    <RoleMatrixTab
                        roleDefaults={roleDefaults}
                        updateRoleDefaults={updateRoleDefaults}
                    />
                )}
                {activeTab === 'users' && (
                    <UserPermissionsTab
                        roleDefaults={roleDefaults}
                        updateUserPermissionOverrides={updateUserPermissionOverrides}
                    />
                )}
            </div>
        </div>
    );
}

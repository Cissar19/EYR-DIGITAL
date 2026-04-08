import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth, getRoleLabel } from './AuthContext';
import { resolvePermissions } from '../lib/permissionResolver';
import { MODULE_REGISTRY, CONFIGURABLE_ROLES } from '../data/moduleRegistry';

const PermissionsContext = createContext();

// snake_case key from a human label
export function generateRoleKey(label) {
    return label
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 40);
}

export const PermissionsProvider = ({ children }) => {
    const { user, updateUser } = useAuth();
    const [roleDefaults, setRoleDefaults] = useState({});
    const [customRoles, setCustomRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time subscription to permissions_role_defaults
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'permissions_role_defaults'),
            (snapshot) => {
                const defaults = {};
                snapshot.forEach((d) => { defaults[d.id] = d.data(); });
                setRoleDefaults(defaults);
                setLoading(false);
            },
            (error) => {
                console.error('Error suscribiendo permissions_role_defaults:', error);
                setLoading(false);
            }
        );
        return () => unsub();
    }, []);

    // Real-time subscription to custom roles collection
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'roles'),
            (snapshot) => {
                const roles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setCustomRoles(roles.sort((a, b) => a.label.localeCompare(b.label)));
            },
            (error) => {
                console.error('Error suscribiendo roles:', error);
            }
        );
        return () => unsub();
    }, []);

    // All configurable roles: hardcoded + custom
    const allConfigurableRoles = useMemo(
        () => [...CONFIGURABLE_ROLES, ...customRoles.map(r => r.key)],
        [customRoles]
    );

    // Dynamic label lookup: custom roles first, then hardcoded
    const getRoleLabelDynamic = useCallback((roleKey) => {
        const custom = customRoles.find(r => r.key === roleKey);
        if (custom) return custom.label;
        return getRoleLabel(roleKey);
    }, [customRoles]);

    // Resolved permissions for current user
    const permissions = useMemo(
        () => resolvePermissions(user, roleDefaults),
        [user, roleDefaults]
    );

    const canAccess = useCallback(
        (moduleKey) => !!permissions[moduleKey],
        [permissions]
    );

    const canEditInModule = useCallback(
        (moduleKey) => permissions[moduleKey] === 'edit',
        [permissions]
    );

    const resolveForUser = useCallback(
        (targetUser) => resolvePermissions(targetUser, roleDefaults),
        [roleDefaults]
    );

    // Update role defaults in Firestore
    const updateRoleDefaults = useCallback(async (role, modules) => {
        await setDoc(doc(db, 'permissions_role_defaults', role), { modules }, { merge: true });
    }, []);

    // Update permission overrides for a specific user
    const updateUserPermissionOverrides = useCallback(async (userId, overrides) => {
        await updateUser(userId, { permissionOverrides: overrides });
    }, [updateUser]);

    // Create a new custom role
    const createRole = useCallback(async (label) => {
        const key = generateRoleKey(label);
        if (!key) throw new Error('Nombre de rol inválido');

        // Check not already in hardcoded roles
        if (CONFIGURABLE_ROLES.includes(key)) {
            throw new Error(`El rol "${key}" ya existe como rol del sistema`);
        }
        if (customRoles.some(r => r.key === key)) {
            throw new Error(`Ya existe un rol personalizado con ese nombre`);
        }

        const roleDoc = {
            key,
            label: label.trim(),
            isCustom: true,
            createdAt: new Date().toISOString(),
        };

        // Save role metadata
        await setDoc(doc(db, 'roles', key), roleDoc);
        // Initialize empty permissions for the new role
        await setDoc(doc(db, 'permissions_role_defaults', key), { modules: {} });

        return key;
    }, [customRoles]);

    // Delete a custom role
    const deleteRole = useCallback(async (key) => {
        await deleteDoc(doc(db, 'roles', key));
        await deleteDoc(doc(db, 'permissions_role_defaults', key));
    }, []);

    const value = useMemo(() => ({
        permissions,
        roleDefaults,
        customRoles,
        allConfigurableRoles,
        getRoleLabelDynamic,
        loading,
        canAccess,
        canEditInModule,
        resolveForUser,
        updateRoleDefaults,
        updateUserPermissionOverrides,
        createRole,
        deleteRole,
    }), [
        permissions, roleDefaults, customRoles, allConfigurableRoles,
        getRoleLabelDynamic, loading, canAccess, canEditInModule,
        resolveForUser, updateRoleDefaults, updateUserPermissionOverrides,
        createRole, deleteRole,
    ]);

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);

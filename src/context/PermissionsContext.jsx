import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { resolvePermissions } from '../lib/permissionResolver';
import { MODULE_REGISTRY } from '../data/moduleRegistry';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const { user, updateUser } = useAuth();
    const [roleDefaults, setRoleDefaults] = useState({});
    const [loading, setLoading] = useState(true);

    // Real-time subscription to permissions_role_defaults collection
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'permissions_role_defaults'),
            (snapshot) => {
                const defaults = {};
                snapshot.forEach((doc) => {
                    defaults[doc.id] = doc.data();
                });
                setRoleDefaults(defaults);
                setLoading(false);
            },
            (error) => {
                console.error('Error subscribing to permissions_role_defaults:', error);
                // Fall back to hardcoded defaults
                setLoading(false);
            }
        );

        return () => unsub();
    }, []);

    // Resolved permissions for current user
    const permissions = useMemo(
        () => resolvePermissions(user, roleDefaults),
        [user, roleDefaults]
    );

    // Check if current user can access a module
    const canAccess = useCallback(
        (moduleKey) => permissions[moduleKey] === true,
        [permissions]
    );

    // Resolve permissions for any arbitrary user (used by PermissionsManager)
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

    const value = useMemo(() => ({
        permissions,
        roleDefaults,
        loading,
        canAccess,
        resolveForUser,
        updateRoleDefaults,
        updateUserPermissionOverrides,
    }), [permissions, roleDefaults, loading, canAccess, resolveForUser, updateRoleDefaults, updateUserPermissionOverrides]);

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);

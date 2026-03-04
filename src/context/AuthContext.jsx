import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const AuthContext = createContext();

// ============================================
// ROLE DEFINITIONS
// ============================================

/**
 * Role Hierarchy:
 * - super_admin: Platform Administrator (Full system access, DB reset, global config)
 * - admin: Administradora (User/course/schedule management, no system config)
 * - director: Director (Strategic dashboards, approval workflows)
 * - utp_head: Jefa UTP (Curriculum oversight, academic coordination)
 * - inspector: Inspectoria (Attendance, discipline, daily operations oversight)
 * - teacher: Docente (Reservations, prints, administrative days)
 * - staff: Funcionario (Basic access, attendance, simple requests)
 * - printer: Print Manager (Print request management only)
 */
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DIRECTOR: 'director',
    UTP_HEAD: 'utp_head',
    INSPECTOR: 'inspector',
    TEACHER: 'teacher',
    STAFF: 'staff',
    PRINTER: 'printer'
};

/**
 * Human-readable role labels for UI display
 */
export const ROLE_LABELS = {
    [ROLES.SUPER_ADMIN]: 'Admin Plataforma',
    [ROLES.ADMIN]: 'Administradora',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.UTP_HEAD]: 'Jefa UTP',
    [ROLES.INSPECTOR]: 'Inspectoria',
    [ROLES.TEACHER]: 'Docente',
    [ROLES.STAFF]: 'Funcionario',
    [ROLES.PRINTER]: 'Encargado Impresiones'
};

/**
 * Helper function to get role label
 */
export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

// ============================================
// PERMISSION HELPERS
// ============================================

export const hasRole = (user, role) => user?.role === role;
export const hasAnyRole = (user, roles) => roles.includes(user?.role);
export const isAdmin = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
export const isDirectorOrHigher = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR]);
export const isUtpHead = (user) => hasRole(user, ROLES.UTP_HEAD);
export const isInspector = (user) => hasRole(user, ROLES.INSPECTOR);
export const isManagement = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.UTP_HEAD, ROLES.INSPECTOR]);
export const isTeacher = (user) => hasRole(user, ROLES.TEACHER);
export const isStaff = (user) => hasRole(user, ROLES.STAFF);
export const isPrinter = (user) => hasRole(user, ROLES.PRINTER);
export const isSuperAdmin = (user) => hasRole(user, ROLES.SUPER_ADMIN);

// ============================================
// AUTH PROVIDER
// ============================================

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all users from Firestore
    const fetchUsers = React.useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(usersList);
            return usersList;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setLoading(true);
                try {
                    // Fetch user profile from Firestore
                    const q = query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const profileDoc = snapshot.docs[0];
                        const profile = { id: profileDoc.id, ...profileDoc.data() };
                        setUser(profile);
                    } else {
                        // User exists in Auth but not in Firestore — unusual
                        console.warn('Auth user has no Firestore profile:', firebaseUser.uid);
                        setUser(null);
                    }

                    // Fetch all users for admin views
                    await fetchUsers();
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUsers]);

    /**
     * Login with email and password
     */
    const login = React.useCallback(async (email, password) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle setting the user
        return credential.user;
    }, []);

    /**
     * Logout
     */
    const logout = React.useCallback(async () => {
        await signOut(auth);
        setUser(null);
        window.location.href = '/login';
    }, []);

    /**
     * Add new user — uses a secondary Firebase app to create auth user
     * without signing out the current admin
     */
    const addUser = React.useCallback(async (newUserData) => {
        // Create a secondary app instance to avoid signing out current user
        const secondaryApp = initializeApp(auth.app.options, 'secondary-' + Date.now());
        const secondaryAuth = getAuth(secondaryApp);

        try {
            // Create auth user
            const credential = await createUserWithEmailAndPassword(
                secondaryAuth,
                newUserData.email,
                '123456' // Default password
            );

            const uid = credential.user.uid;

            // Create Firestore profile
            const userDoc = {
                uid,
                name: newUserData.name,
                email: newUserData.email,
                role: newUserData.role,
                avatar: null,
                hoursUsed: 0,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', uid), userDoc);

            // Sign out from secondary app
            await signOut(secondaryAuth);

            // Refresh users list
            await fetchUsers();

            return { id: uid, ...userDoc };
        } catch (error) {
            // Clean up secondary app
            try { await signOut(secondaryAuth); } catch (_) {}
            throw error;
        }
    }, [fetchUsers]);

    /**
     * Update existing user in Firestore
     */
    const updateUser = React.useCallback(async (userId, updatedFields) => {
        try {
            await updateDoc(doc(db, 'users', userId), updatedFields);

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, ...updatedFields } : u
            ));

            // Update current session if updating self
            setUser(prev => {
                if (prev?.id === userId) {
                    return { ...prev, ...updatedFields };
                }
                return prev;
            });
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }, []);

    /**
     * Delete user from Firestore (auth user remains — admin SDK needed for full delete)
     */
    const deleteUser = React.useCallback(async (userId) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }, []);

    /**
     * Get all users
     */
    const getAllUsers = React.useCallback(() => users, [users]);

    /**
     * Get users by role
     */
    const getUsersByRole = React.useCallback((role) => {
        return users.filter(u => u.role === role);
    }, [users]);

    /**
     * Get role label for current user
     */
    const getUserRoleLabel = React.useCallback(() => {
        return user ? getRoleLabel(user.role) : '';
    }, [user]);

    const value = React.useMemo(() => ({
        user,
        login,
        logout,
        loading,
        users,
        MOCK_USERS: users, // Backward compatibility alias
        addUser,
        updateUser,
        deleteUser,
        getAllUsers,
        getUsersByRole,
        getUserRoleLabel,
        fetchUsers,
        // Permission helpers bound to current user
        hasRole: (role) => hasRole(user, role),
        hasAnyRole: (roles) => hasAnyRole(user, roles),
        isAdmin: () => isAdmin(user),
        isDirectorOrHigher: () => isDirectorOrHigher(user),
        isTeacher: () => isTeacher(user),
        isStaff: () => isStaff(user),
        isPrinter: () => isPrinter(user),
        isSuperAdmin: () => isSuperAdmin(user),
        isUtpHead: () => isUtpHead(user),
        isInspector: () => isInspector(user),
        isManagement: () => isManagement(user)
    }), [user, loading, users, addUser, updateUser, deleteUser, getAllUsers, getUsersByRole, getUserRoleLabel, fetchUsers, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
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
import { sendPasswordResetNotification } from '../lib/emailService';

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
 * - staff: Asistente (Basic access, attendance, simple requests)
 * - printer: Print Manager (Print request management only)
 */
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DIRECTOR: 'director',
    UTP_HEAD: 'utp_head',
    INSPECTOR: 'inspector',
    CONVIVENCIA: 'convivencia',
    TEACHER: 'teacher',
    STAFF: 'staff',
    PRINTER: 'printer'
};

/**
 * Human-readable role labels for UI display
 */
export const ROLE_LABELS = {
    [ROLES.SUPER_ADMIN]: 'Admin Plataforma',
    [ROLES.ADMIN]: 'Administradora EYR Huechuraba',
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.UTP_HEAD]: 'Jefa UTP',
    [ROLES.INSPECTOR]: 'Inspectoria',
    [ROLES.CONVIVENCIA]: 'Convivencia Escolar',
    [ROLES.TEACHER]: 'Docente',
    [ROLES.STAFF]: 'Asistente',
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
export const isConvivencia = (user) => hasRole(user, ROLES.CONVIVENCIA);
export const isManagement = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.UTP_HEAD, ROLES.INSPECTOR, ROLES.CONVIVENCIA]);
export const isTeacher = (user) => hasRole(user, ROLES.TEACHER);
export const isStaff = (user) => hasRole(user, ROLES.STAFF);
export const isPrinter = (user) => hasRole(user, ROLES.PRINTER);
export const isSuperAdmin = (user) => hasRole(user, ROLES.SUPER_ADMIN);
export const canEdit = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN]) || user?.accessLevel === 'edit';

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
     * Generate a random temporary password
     */
    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        const array = new Uint8Array(12);
        crypto.getRandomValues(array);
        for (let i = 0; i < 12; i++) {
            password += chars[array[i] % chars.length];
        }
        return password;
    };

    /**
     * Add new user — uses a secondary Firebase app to create auth user
     * without signing out the current admin.
     * Only admin/super_admin/director can create users.
     */
    const addUser = React.useCallback(async (newUserData) => {
        // Authorization check
        if (!user || !isAdmin(user) && !isDirectorOrHigher(user)) {
            throw new Error('No tienes permisos para crear usuarios');
        }

        // Role hierarchy: only super_admin can create admin/super_admin/director
        const protectedRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR];
        if (protectedRoles.includes(newUserData.role) && !isSuperAdmin(user)) {
            throw new Error('Solo super_admin puede crear roles administrativos');
        }

        // Validate role is a known role
        const validRoles = Object.values(ROLES);
        if (!validRoles.includes(newUserData.role)) {
            throw new Error('Rol invalido');
        }

        // Create a secondary app instance to avoid signing out current user
        const secondaryApp = initializeApp(auth.app.options, 'secondary-' + Date.now());
        const secondaryAuth = getAuth(secondaryApp);

        const tempPassword = generateTempPassword();

        try {
            // Create auth user with random password
            const credential = await createUserWithEmailAndPassword(
                secondaryAuth,
                newUserData.email,
                tempPassword
            );

            const uid = credential.user.uid;

            // Create Firestore profile
            const userDoc = {
                uid,
                name: newUserData.name?.trim().slice(0, 100) || '',
                email: newUserData.email,
                role: newUserData.role,
                accessLevel: newUserData.accessLevel || 'view',
                avatar: null,
                hoursUsed: 0,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', uid), userDoc);

            // Sign out from secondary app
            await signOut(secondaryAuth);

            // Refresh users list
            await fetchUsers();

            return { id: uid, ...userDoc, tempPassword };
        } catch (error) {
            // Clean up secondary app
            try { await signOut(secondaryAuth); } catch (_) { }
            throw error;
        }
    }, [fetchUsers, user]);

    /**
     * Update existing user in Firestore.
     * Only admins can update other users. Users can update their own profile (name, avatar only).
     */
    const updateUser = React.useCallback(async (userId, updatedFields) => {
        if (!user) throw new Error('No autenticado');

        const isSelf = user.id === userId;
        const userIsAdmin = isAdmin(user) || isDirectorOrHigher(user);

        // Non-admins can only update themselves
        if (!isSelf && !userIsAdmin) {
            throw new Error('No tienes permisos para modificar otros usuarios');
        }

        // Block role changes unless admin+
        if (updatedFields.role !== undefined && !isAdmin(user)) {
            throw new Error('Solo administradores pueden cambiar roles');
        }

        const safeFields = { ...updatedFields };
        delete safeFields.uid;
        delete safeFields.id;
        // Only admins can update email
        if (!isAdmin(user)) {
            delete safeFields.email;
        }

        // Sanitize name if provided
        if (safeFields.name) {
            safeFields.name = safeFields.name.trim().slice(0, 100);
        }

        try {
            await updateDoc(doc(db, 'users', userId), safeFields);

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, ...safeFields } : u
            ));

            // Update current session if updating self
            setUser(prev => {
                if (prev?.id === userId) {
                    return { ...prev, ...safeFields };
                }
                return prev;
            });
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }, [user]);

    /**
     * Delete user from Firestore (auth user remains — admin SDK needed for full delete).
     * Only admins can delete users. Cannot delete yourself.
     */
    const deleteUser = React.useCallback(async (userId) => {
        if (!user || (!isAdmin(user) && !isDirectorOrHigher(user))) {
            throw new Error('No tienes permisos para eliminar usuarios');
        }

        if (userId === user.id) {
            throw new Error('No puedes eliminar tu propia cuenta');
        }

        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }, [user]);

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

    /**
     * Send password reset email.
     * Tries branded email via Apps Script first, falls back to Firebase built-in.
     */
    const resetPassword = React.useCallback(async (email, userName) => {
        const sent = await sendPasswordResetNotification({ toEmail: email, toName: userName || '' });
        if (!sent) {
            await sendPasswordResetEmail(auth, email);
        }
    }, []);

    /**
     * Set password for another user (admin only, via serverless function)
     */
    const setUserPassword = React.useCallback(async (uid, newPassword) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('No hay sesión activa');

        const idToken = await firebaseUser.getIdToken();
        const res = await fetch('/api/set-user-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ uid, newPassword }),
        });

        let data;
        const text = await res.text();
        try {
            data = JSON.parse(text);
        } catch {
            console.error('Respuesta no-JSON del servidor:', text.slice(0, 200));
            throw new Error('El servidor devolvió una respuesta inválida. Verifica que las variables de entorno FIREBASE_ADMIN_* estén configuradas en Vercel.');
        }

        if (!res.ok) {
            throw new Error(data.error || 'Error al cambiar contraseña');
        }

        // Update local state with the new password info
        const now = new Date().toISOString();
        setUsers(prev => prev.map(u =>
            u.uid === uid ? { ...u, lastSetPassword: newPassword, passwordSetAt: now } : u
        ));

        return data;
    }, []);

    /**
     * Change password for current user (requires re-authentication)
     */
    const changePassword = React.useCallback(async (currentPassword, newPassword) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('No hay sesion activa');
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, newPassword);
    }, []);

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
        resetPassword,
        changePassword,
        setUserPassword,
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
        isConvivencia: () => isConvivencia(user),
        isManagement: () => isManagement(user),
        canEdit: () => canEdit(user)
    }), [user, loading, users, addUser, updateUser, deleteUser, getAllUsers, getUsersByRole, getUserRoleLabel, fetchUsers, resetPassword, changePassword, setUserPassword, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

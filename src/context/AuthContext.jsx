import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
    onSnapshot,
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
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
 * - convivencia_head: Jefe Convivencia (Convivencia management + block scheduling)
 * - convivencia: Convivencia Escolar (Basic convivencia access)
 * - teacher: Docente (Reservations, prints, administrative days)
 * - profesor_jefe: Profesor Jefe (Homeroom teacher, class administrative duties)
 * - staff: Asistente (Basic access, attendance, simple requests)
 * - asistente_aula: Asistente de Aula (Classroom support)
 * - printer: Print Manager (Print request management only)
 * - pie_head: Jefa PIE (PIE program coordination)
 * - pie: PIE (Special education support)
 */
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DIRECTOR: 'director',
    UTP_HEAD: 'utp_head',
    INSPECTOR: 'inspector',
    CONVIVENCIA_HEAD: 'convivencia_head',
    CONVIVENCIA: 'convivencia',
    TEACHER: 'teacher',
    PROFESOR_JEFE: 'profesor_jefe',
    STAFF: 'staff',
    ASISTENTE_AULA: 'asistente_aula',
    PRINTER: 'printer',
    PIE_HEAD: 'pie_head',
    PIE: 'pie'
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
    [ROLES.CONVIVENCIA_HEAD]: 'Jefe Convivencia',
    [ROLES.CONVIVENCIA]: 'Convivencia Escolar',
    [ROLES.TEACHER]: 'Docente',
    [ROLES.PROFESOR_JEFE]: 'Profesor Jefe',
    [ROLES.STAFF]: 'Asistente',
    [ROLES.ASISTENTE_AULA]: 'Asistente de Aula',
    [ROLES.PRINTER]: 'Encargado Impresiones',
    [ROLES.PIE_HEAD]: 'Jefa PIE',
    [ROLES.PIE]: 'PIE'
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
export const isConvivenciaHead = (user) => hasRole(user, ROLES.CONVIVENCIA_HEAD);
export const isConvivencia = (user) => hasAnyRole(user, [ROLES.CONVIVENCIA, ROLES.CONVIVENCIA_HEAD]);
export const isManagement = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTOR, ROLES.UTP_HEAD, ROLES.INSPECTOR, ROLES.CONVIVENCIA_HEAD, ROLES.CONVIVENCIA]);
export const isTeacher = (user) => hasRole(user, ROLES.TEACHER);
export const isStaff = (user) => hasRole(user, ROLES.STAFF);
export const isPrinter = (user) => hasRole(user, ROLES.PRINTER);
export const isPie = (user) => hasRole(user, ROLES.PIE);
export const isSuperAdmin = (user) => hasRole(user, ROLES.SUPER_ADMIN);
export const canEdit = (user) => hasAnyRole(user, [ROLES.SUPER_ADMIN, ROLES.ADMIN]) || user?.accessLevel === 'edit';

// ============================================
// AUTH PROVIDER
// ============================================

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ref to hold the users collection unsubscribe function
    const usersUnsub = useRef(null);

    /**
     * Start a real-time listener on the users collection.
     * Only called for management roles. Unsubscribes previous listener if any.
     */
    const subscribeUsers = React.useCallback(() => {
        // Cancel any existing subscription first
        if (usersUnsub.current) {
            usersUnsub.current();
            usersUnsub.current = null;
        }
        const unsub = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setUsers(usersList);
            },
            (error) => {
                console.error('Error en listener de usuarios:', error);
            }
        );
        usersUnsub.current = unsub;
    }, []);

    /**
     * One-time fetch — kept for backward compatibility and for callers that
     * need an immediate list (e.g. outside the subscription window).
     */
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
                    // Direct document read — uid is the Firestore doc id, no query needed
                    const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                    if (profileDoc.exists()) {
                        const profile = { id: profileDoc.id, ...profileDoc.data() };
                        setUser(profile);

                        // Only subscribe to the full user list for management roles —
                        // teacher/staff/printer don't need it and an extra onSnapshot
                        // per non-management login doesn't scale.
                        const managementRoles = [
                            'super_admin', 'admin', 'director', 'utp_head',
                            'inspector', 'convivencia_head', 'convivencia',
                        ];
                        if (managementRoles.includes(profile.role)) {
                            subscribeUsers();
                        }
                    } else {
                        // User exists in Auth but not in Firestore — unusual
                        console.warn('Auth user has no Firestore profile:', firebaseUser.uid);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    setUser(null);
                }
            } else {
                // Tear down the users listener on logout
                if (usersUnsub.current) {
                    usersUnsub.current();
                    usersUnsub.current = null;
                }
                setUser(null);
                setUsers([]);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (usersUnsub.current) {
                usersUnsub.current();
                usersUnsub.current = null;
            }
        };
    }, [subscribeUsers]);

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

            // Set custom claim so security rules don't need a Firestore read per operation
            try {
                const firebaseUser = auth.currentUser;
                if (firebaseUser) {
                    const idToken = await firebaseUser.getIdToken();
                    await fetch('/api/sync-role-claim', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({ uid, role: newUserData.role }),
                    });
                }
            } catch (claimErr) {
                console.warn('No se pudo sincronizar claim de rol (no crítico):', claimErr);
            }

            // Sign out and clean up secondary app
            await signOut(secondaryAuth);
            try { await deleteApp(secondaryApp); } catch (_) { }

            // No need to call fetchUsers — onSnapshot will update users state automatically

            return { id: uid, ...userDoc, tempPassword };
        } catch (error) {
            // Clean up secondary app
            try { await signOut(secondaryAuth); } catch (_) { }
            try { await deleteApp(secondaryApp); } catch (_) { }

            // Handle orphaned Auth user (exists in Auth but not in Firestore)
            // Also handles rate-limit case: try admin recovery so existing orphaned users
            // can still be created even when client Auth is rate-limited.
            if (error.code === 'auth/email-already-in-use' || error.code === 'auth/too-many-requests') {
                const existingInFirestore = await (async () => {
                    try {
                        const { getDocs: _getDocs, collection: _col, query: _q, where: _w } = await import('firebase/firestore');
                        const snap = await _getDocs(_q(_col(db, 'users'), _w('email', '==', newUserData.email)));
                        return !snap.empty;
                    } catch { return false; }
                })();

                if (existingInFirestore) {
                    throw new Error('Ya existe un usuario registrado con ese correo.');
                }

                // Orphaned: exists in Auth only → recover via admin API
                try {
                    const firebaseUser = auth.currentUser;
                    const idToken = await firebaseUser.getIdToken();
                    const resp = await fetch('/api/recover-orphaned-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                        body: JSON.stringify({ email: newUserData.email }),
                    });
                    const respText = await resp.text();
                    let respData;
                    try { respData = JSON.parse(respText); } catch {
                        throw new Error('Error del servidor al recuperar usuario. Verifica que las variables FIREBASE_ADMIN_* estén configuradas en Vercel.');
                    }
                    if (!resp.ok) throw new Error(respData.error || 'Error al recuperar usuario');
                    const { uid, tempPassword: recoveredPwd } = respData;

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

                    // Sync role claim
                    try {
                        await fetch('/api/sync-role-claim', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                            body: JSON.stringify({ uid, role: newUserData.role }),
                        });
                    } catch (_) { }

                    // onSnapshot will update users state automatically
                    return { id: uid, ...userDoc, tempPassword: recoveredPwd };
                } catch (recoverError) {
                    // If recovery fails and original error was rate-limit, surface the rate-limit message
                    if (error.code === 'auth/too-many-requests') {
                        throw new Error('Demasiadas solicitudes a Firebase. Intenta crear el usuario en unos minutos.');
                    }
                    throw recoverError;
                }
            }

            throw error;
        }
    }, [user]);

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
            // Always sync email to Firebase Auth when email field is present
            if (safeFields.email) {
                const targetUser = users.find(u => u.id === userId);
                if (targetUser) {
                    const firebaseUser = auth.currentUser;
                    if (firebaseUser) {
                        const idToken = await firebaseUser.getIdToken();
                        const res = await fetch('/api/update-user-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`,
                            },
                            body: JSON.stringify({ uid: targetUser.uid, newEmail: safeFields.email }),
                        });
                        let data;
                        const text = await res.text();
                        try { data = JSON.parse(text); } catch {
                            throw new Error('Error del servidor al actualizar correo en Authentication');
                        }
                        if (!res.ok) {
                            throw new Error(data.error || 'Error al actualizar correo en Authentication');
                        }
                    }
                }
            }

            // Sync role claim if role changed
            if (safeFields.role) {
                try {
                    const firebaseUser = auth.currentUser;
                    if (firebaseUser) {
                        const idToken = await firebaseUser.getIdToken();
                        await fetch('/api/sync-role-claim', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`,
                            },
                            body: JSON.stringify({ uid: userId, role: safeFields.role }),
                        });
                    }
                } catch (claimErr) {
                    console.warn('No se pudo sincronizar claim de rol (no crítico):', claimErr);
                }
            }

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
    }, [user, users]);

    /**
     * Delete user from both Firebase Auth and Firestore via Admin SDK.
     * Only admins can delete users. Cannot delete yourself.
     */
    const deleteUser = React.useCallback(async (userId) => {
        if (!user || !isAdmin(user)) {
            throw new Error('No tienes permisos para eliminar usuarios');
        }

        if (userId === user.id) {
            throw new Error('No puedes eliminar tu propia cuenta');
        }

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error('No hay sesión activa');

        const idToken = await firebaseUser.getIdToken();
        const res = await fetch('/api/delete-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ uid: userId }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Error al eliminar usuario');
        }

        setUsers(prev => prev.filter(u => u.id !== userId));
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

        // Clear admin-set password reference since user changed it themselves
        if (user?.id) {
            try {
                await updateDoc(doc(db, 'users', user.id), {
                    lastSetPassword: null,
                    passwordSetAt: null,
                    passwordSetBy: null,
                });
                setUsers(prev => prev.map(u =>
                    u.id === user.id ? { ...u, lastSetPassword: null, passwordSetAt: null, passwordSetBy: null } : u
                ));
            } catch (_) { /* non-critical */ }
        }
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
        isPie: () => isPie(user),
        isSuperAdmin: () => isSuperAdmin(user),
        isUtpHead: () => isUtpHead(user),
        isInspector: () => isInspector(user),
        isConvivenciaHead: () => isConvivenciaHead(user),
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

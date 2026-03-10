import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { createDocument, removeDocument } from '../lib/firestoreService';
import { useAuth } from './AuthContext';
import { validateDate, validateRequiredString, validateUserId, validatePositiveNumber, sanitizeText, sanitizeName } from '../lib/validation';

const MedicalLeavesContext = createContext();

const MANAGEMENT_ROLES = ['admin', 'super_admin', 'director', 'utp_head', 'inspector'];

export const useMedicalLeaves = () => useContext(MedicalLeavesContext);

export const MedicalLeavesProvider = ({ children }) => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time subscription to medical_leaves collection
    useEffect(() => {
        const q = query(collection(db, 'medical_leaves'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setLeaves(docs);
            setLoading(false);
        }, (error) => {
            console.error('Error subscribing to medical_leaves:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addLeave = React.useCallback(async (userId, userName, startDate, endDate, days, diagnosis, returnDate) => {
        if (!user || !MANAGEMENT_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para registrar licencias');
            return false;
        }

        validateUserId(userId);
        validateRequiredString(userName, 'nombre', 100);
        validateDate(startDate, 'fecha inicio');
        validateDate(endDate, 'fecha termino');
        validateRequiredString(diagnosis, 'diagnostico');

        if (endDate < startDate) {
            throw new Error('Fecha termino debe ser igual o posterior a fecha inicio');
        }

        const validDays = validatePositiveNumber(days, 'dias');
        if (validDays > 365) throw new Error('Dias no puede exceder 365');

        validateDate(returnDate, 'fecha reintegro');

        try {
            await createDocument('medical_leaves', {
                userId,
                userName: sanitizeName(userName),
                startDate,
                endDate,
                days: validDays,
                diagnosis: sanitizeText(diagnosis),
                returnDate
            });
            toast.success('Licencia registrada exitosamente');
            return true;
        } catch (error) {
            console.error('Error creating medical leave:', error);
            toast.error('Error al registrar la licencia');
            return false;
        }
    }, [user]);

    const deleteLeave = React.useCallback(async (id) => {
        if (!user || !MANAGEMENT_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para eliminar licencias');
            return;
        }

        if (!id || typeof id !== 'string') {
            throw new Error('ID de licencia invalido');
        }

        try {
            await removeDocument('medical_leaves', id);
            toast.success('Licencia eliminada');
        } catch (error) {
            console.error('Error deleting medical leave:', error);
            toast.error('Error al eliminar la licencia');
        }
    }, [user]);

    const getLeavesByUser = React.useCallback((userId) => {
        return leaves.filter(l => l.userId === userId).sort((a, b) => {
            const dateA = b.startDate || '';
            const dateB = a.startDate || '';
            return dateA.localeCompare(dateB);
        });
    }, [leaves]);

    const getAllLeaves = React.useCallback(() => {
        return [...leaves];
    }, [leaves]);

    const value = React.useMemo(() => ({
        leaves,
        loading,
        addLeave,
        deleteLeave,
        getLeavesByUser,
        getAllLeaves
    }), [leaves, loading, addLeave, deleteLeave, getLeavesByUser, getAllLeaves]);

    return (
        <MedicalLeavesContext.Provider value={value}>
            {children}
        </MedicalLeavesContext.Provider>
    );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { useAuth } from './AuthContext';
import { validateRequiredString, validateUserId, validatePositiveNumber, validateEnum, sanitizeText } from '../lib/validation';

const PrintContext = createContext();

export const usePrint = () => useContext(PrintContext);

const VALID_STATUSES = ['pending', 'reviewing', 'ready', 'completed', 'rejected'];

export const PrintProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time subscription to print_requests
    useEffect(() => {
        const q = query(collection(db, 'print_requests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setRequests(docs);
            setLoading(false);
        }, (error) => {
            console.error('Error subscribing to print_requests:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addRequest = React.useCallback(async (fileDetails) => {
        if (!user) throw new Error('No autenticado');

        validateUserId(fileDetails.userId);
        validateRequiredString(fileDetails.userName, 'nombre', 100);
        validateRequiredString(fileDetails.fileName, 'nombre de archivo', 200);
        const copies = validatePositiveNumber(fileDetails.copies || 1, 'copias');

        try {
            await createDocument('print_requests', {
                userId: fileDetails.userId,
                userName: sanitizeText(fileDetails.userName),
                fileName: sanitizeText(fileDetails.fileName),
                copies: Math.min(copies, 999),
                doubleSided: !!fileDetails.doubleSided,
                isColor: !!fileDetails.isColor,
                stapled: !!fileDetails.stapled,
                legalSize: !!fileDetails.legalSize,
                status: 'pending'
            });

            toast.success("Solicitud de impresion enviada");
            return true;
        } catch (error) {
            console.error('Error creating print request:', error);
            toast.error('Error al enviar solicitud');
            throw error;
        }
    }, [user]);

    const getRequestsByUser = React.useCallback((userId) => {
        return requests.filter(r => r.userId === userId);
    }, [requests]);

    const getPendingRequests = React.useCallback(() => {
        return requests.filter(r => r.status === 'pending');
    }, [requests]);

    const getAllRequests = React.useCallback(() => {
        return requests;
    }, [requests]);

    const updateRequestStatus = React.useCallback(async (requestId, newStatus) => {
        // Only printer role or admins can update print request status
        if (!user || (user.role !== 'printer' && user.role !== 'admin' && user.role !== 'super_admin')) {
            toast.error('No tienes permisos para actualizar solicitudes de impresion');
            return;
        }

        validateEnum(newStatus, VALID_STATUSES, 'estado');

        try {
            await updateDocument('print_requests', requestId, { status: newStatus });

            if (newStatus === 'completed') {
                toast.success("Solicitud marcada como lista");
            } else if (newStatus === 'rejected') {
                toast.error("Solicitud rechazada");
            } else if (newStatus === 'reviewing') {
                toast.info("Solicitud en revision");
            } else if (newStatus === 'ready') {
                toast.success("Tu pedido esta listo para retirar");
            }
        } catch (error) {
            console.error('Error updating print request:', error);
            toast.error('Error al actualizar solicitud');
            throw error;
        }
    }, [user]);

    const deleteRequest = React.useCallback(async (requestId) => {
        if (!user) throw new Error('No autenticado');

        // Only the owner or admin/printer can delete
        const request = requests.find(r => r.id === requestId);
        if (request && request.userId !== user.id && user.role !== 'printer' && user.role !== 'admin' && user.role !== 'super_admin') {
            toast.error('No tienes permisos para eliminar esta solicitud');
            return;
        }

        try {
            await removeDocument('print_requests', requestId);
            toast.info("Solicitud eliminada");
        } catch (error) {
            console.error('Error deleting print request:', error);
            toast.error('Error al eliminar solicitud');
            throw error;
        }
    }, [user, requests]);

    const value = React.useMemo(() => ({
        requests,
        loading,
        addRequest,
        getRequestsByUser,
        getPendingRequests,
        getAllRequests,
        updateRequestStatus,
        deleteRequest
    }), [requests, loading, addRequest, getRequestsByUser, getPendingRequests, getAllRequests, updateRequestStatus, deleteRequest]);

    return (
        <PrintContext.Provider value={value}>
            {children}
        </PrintContext.Provider>
    );
};

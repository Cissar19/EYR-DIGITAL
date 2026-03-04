import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { createDocument, updateDocument, removeDocument } from '../lib/firestoreService';

const PrintContext = createContext();

export const usePrint = () => useContext(PrintContext);

export const PrintProvider = ({ children }) => {
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
        try {
            await createDocument('print_requests', {
                userId: fileDetails.userId,
                userName: fileDetails.userName,
                fileName: fileDetails.fileName,
                copies: fileDetails.copies || 1,
                doubleSided: fileDetails.doubleSided || false,
                isColor: fileDetails.isColor || false,
                stapled: fileDetails.stapled || false,
                legalSize: fileDetails.legalSize || false,
                status: 'pending'
            });

            toast.success("Solicitud de impresion enviada");
            return true;
        } catch (error) {
            console.error('Error creating print request:', error);
            toast.error('Error al enviar solicitud');
            throw error;
        }
    }, []);

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
    }, []);

    const deleteRequest = React.useCallback(async (requestId) => {
        try {
            await removeDocument('print_requests', requestId);
            toast.info("Solicitud eliminada");
        } catch (error) {
            console.error('Error deleting print request:', error);
            toast.error('Error al eliminar solicitud');
            throw error;
        }
    }, []);

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

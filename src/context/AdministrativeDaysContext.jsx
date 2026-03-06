import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, setDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';

const AdministrativeDaysContext = createContext();

export const useAdministrativeDays = () => useContext(AdministrativeDaysContext);

export const AdministrativeDaysProvider = ({ children }) => {
    const [requests, setRequests] = useState([]);
    const [balances, setBalances] = useState({});
    const [hoursUsedState, setHoursUsedState] = useState({});
    const [discountDaysState, setDiscountDaysState] = useState({});

    // 1. Suscribirse a las solicitudes
    useEffect(() => {
        const unsubscribe = subscribeToCollection('admin_requests', (docs) => {
            // Sort by createdAt desc by default
            const sorted = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRequests(sorted);
        });
        return () => unsubscribe();
    }, []);

    // 2. Suscribirse a las metricas (balances, hours, discounts)
    useEffect(() => {
        const unsubscribe = subscribeToCollection('admin_metrics', (docs) => {
            const bal = {};
            const hrs = {};
            const disc = {};
            docs.forEach(d => {
                const uid = d.id;
                bal[uid] = d.balance !== undefined ? d.balance : 6;
                hrs[uid] = d.hoursUsed || 0;
                disc[uid] = d.discountDays || 0;
            });
            setBalances(bal);
            setHoursUsedState(hrs);
            setDiscountDaysState(disc);
        });
        return () => unsubscribe();
    }, []);

    // Helpers para metricas persistentes
    const updateMetrics = async (userId, updates) => {
        try {
            await setDocument('admin_metrics', userId, updates, { merge: true });
        } catch (error) {
            console.error('Error actualizando metricas', error);
        }
    };

    // --- Getters ---

    const getBalance = React.useCallback((userId) => {
        return balances[userId] !== undefined ? balances[userId] : 6;
    }, [balances]);

    const getHoursUsed = React.useCallback((userId) => {
        return hoursUsedState[userId] !== undefined ? hoursUsedState[userId] : 0;
    }, [hoursUsedState]);

    const getDiscountDays = React.useCallback((userId) => {
        return discountDaysState[userId] !== undefined ? discountDaysState[userId] : 0;
    }, [discountDaysState]);

    const getPendingRequests = React.useCallback(() => {
        return requests.filter(r => r.status === 'pending');
    }, [requests]);

    const getUserRequests = React.useCallback((userId) => {
        return requests.filter(r => r.userId === userId);
    }, [requests]);

    // --- Actions ---

    const adjustBalance = React.useCallback(async (userId, newAmount) => {
        // Optimistic
        setBalances(prev => ({ ...prev, [userId]: newAmount }));
        await updateMetrics(userId, { balance: newAmount });
    }, []);

    const addRequest = React.useCallback(async (userId, userName, date, reason) => {
        const newRequest = {
            userId,
            userName,
            date,
            reason,
            status: 'pending',
            // createdAt is handled by createDocument
        };

        try {
            await createDocument('admin_requests', newRequest);
            toast.success('Solicitud enviada correctamente');
            return true;
        } catch (error) {
            console.error('Error agregando solicitud:', error);
            toast.error('Error al enviar la solicitud');
            return false;
        }
    }, []);

    const approveRequestStable = React.useCallback(async (requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!request || request.status !== 'pending') return;

        try {
            // Update request
            await updateDocument('admin_requests', requestId, { status: 'approved' });

            // Decrement balance
            const currentBalance = balances[request.userId] !== undefined ? balances[request.userId] : 6;
            await updateMetrics(request.userId, { balance: currentBalance - 1 });

            toast.success('Solicitud aprobada');
        } catch (error) {
            console.error('Error approving request', error);
            toast.error('Error al aprobar solicitud');
        }
    }, [requests, balances]);

    const rejectRequestStable = React.useCallback(async (requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        try {
            await updateDocument('admin_requests', requestId, { status: 'rejected' });
            toast.success('Solicitud rechazada');
        } catch (error) {
            console.error('Error rejecting request', error);
            toast.error('Error al rechazar solicitud');
        }
    }, [requests]);

    const assignDayManual = React.useCallback(async (userId, userName, date, reason) => {
        const newRequest = {
            userId,
            userName,
            date,
            reason,
            status: 'approved',
        };

        try {
            await createDocument('admin_requests', newRequest);
            const currentBalance = balances[userId] !== undefined ? balances[userId] : 6;
            await updateMetrics(userId, { balance: currentBalance - 1 });
            toast.success('Día asignado exitosamente');
            return true;
        } catch (error) {
            console.error('Error', error);
            toast.error('Error al asignar');
            return false;
        }
    }, [balances]);

    const assignSpecialPermission = React.useCallback(async (userId, userName, date, reason) => {
        const newRequest = {
            userId,
            userName,
            date,
            reason: `[Excepción] ${reason}`,
            status: 'approved',
        };

        try {
            await createDocument('admin_requests', newRequest);
            toast.success('Permiso especial asignado');
            return true;
        } catch (error) {
            console.error('Error', error);
            toast.error('Error al asignar');
            return false;
        }
    }, []);

    const assignHoursManual = React.useCallback(async (userId, userName, date, startTime, endTime, minutesUsed, reason) => {
        const newRequest = {
            userId,
            userName,
            date,
            reason: `[Horas] ${startTime} - ${endTime} (${minutesUsed} min): ${reason}`,
            status: 'approved',
            type: 'hour_permission'
        };

        try {
            await createDocument('admin_requests', newRequest);
            const hoursToAdd = minutesUsed / 60;
            const currentUsage = hoursUsedState[userId] !== undefined ? hoursUsedState[userId] : 0;
            await updateMetrics(userId, { hoursUsed: currentUsage + hoursToAdd });
            toast.success('Horas asignadas exitosamente');
            return true;
        } catch (error) {
            console.error('Error', error);
            toast.error('Error al asignar horas');
            return false;
        }
    }, [hoursUsedState]);

    const returnHoursManual = React.useCallback(async (userId, userName, date, startTime, endTime, minutesReturned, reason) => {
        const newRequest = {
            userId,
            userName,
            date,
            reason: `[Devolución] ${startTime} - ${endTime} (${minutesReturned} min): ${reason}`,
            status: 'approved',
            type: 'hour_return'
        };

        try {
            await createDocument('admin_requests', newRequest);
            const hoursToSubtract = minutesReturned / 60;
            const currentUsage = hoursUsedState[userId] !== undefined ? hoursUsedState[userId] : 0;
            await updateMetrics(userId, { hoursUsed: currentUsage - hoursToSubtract });
            toast.success('Devolución de horas registrada');
            return true;
        } catch (error) {
            console.error('Error', error);
            toast.error('Error al registrar devolución');
            return false;
        }
    }, [hoursUsedState]);

    const assignDiscountDay = React.useCallback(async (userId, userName, date, reason, observation) => {
        const reasonText = observation
            ? `[Descuento] ${reason}: ${observation}`
            : `[Descuento] ${reason}`;

        const newRequest = {
            userId,
            userName,
            date,
            reason: reasonText,
            status: 'approved',
            type: 'discount'
        };

        try {
            await createDocument('admin_requests', newRequest);
            const currentCount = discountDaysState[userId] !== undefined ? discountDaysState[userId] : 0;
            await updateMetrics(userId, { discountDays: currentCount + 1 });
            toast.success('Día de descuento registrado');
            return true;
        } catch (error) {
            console.error('Error', error);
            toast.error('Error al registrar');
            return false;
        }
    }, [discountDaysState]);

    const value = React.useMemo(() => ({
        requests,
        balances,
        getBalance,
        adjustBalance,
        addRequest,
        approveRequest: approveRequestStable,
        rejectRequest: rejectRequestStable,
        assignDayManual,
        assignSpecialPermission,
        assignHoursManual,
        returnHoursManual,
        assignDiscountDay,
        getPendingRequests,
        getUserRequests,
        getHoursUsed,
        getDiscountDays
    }), [requests, balances, hoursUsedState, discountDaysState, getBalance, getHoursUsed, getDiscountDays, adjustBalance, addRequest, approveRequestStable, rejectRequestStable, assignDayManual, assignSpecialPermission, assignHoursManual, returnHoursManual, assignDiscountDay, getPendingRequests, getUserRequests]);

    return (
        <AdministrativeDaysContext.Provider value={value}>
            {children}
        </AdministrativeDaysContext.Provider>
    );
};


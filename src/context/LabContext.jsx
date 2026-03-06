import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { subscribeToCollection, createDocument, removeDocument, fetchCollection } from '../lib/firestoreService';

const LabContext = createContext();

export const TIME_BLOCKS = [
    { id: 'recepcion', start: '08:00', end: '08:10', type: 'class', label: 'Recepción' },
    { id: 'b1', start: '08:10', end: '08:55', type: 'class', label: 'Bloque 1' },
    { id: 'b2', start: '08:55', end: '09:40', type: 'class', label: 'Bloque 2' },
    { id: 'break1', start: '09:40', end: '09:55', type: 'break', label: 'RECREO' },
    { id: 'b3', start: '09:55', end: '10:40', type: 'class', label: 'Bloque 3' },
    { id: 'b4', start: '10:40', end: '11:25', type: 'class', label: 'Bloque 4' },
    { id: 'break2', start: '11:25', end: '11:40', type: 'break', label: 'RECREO' },
    { id: 'b5', start: '11:40', end: '12:25', type: 'class', label: 'Bloque 5' },
    { id: 'b6', start: '12:25', end: '13:10', type: 'class', label: 'Bloque 6' },
    { id: 'lunch', start: '13:10', end: '13:55', type: 'break', label: 'ALMUERZO' },
    { id: 'b7', start: '13:55', end: '14:40', type: 'class', label: 'Bloque 7' },
    { id: 'b8', start: '14:40', end: '15:25', type: 'class', label: 'Bloque 8' },
];

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function LabProvider({ children }) {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);

    // 1. Sincronización en tiempo real desde Firestore
    useEffect(() => {
        const unsubscribe = subscribeToCollection('lab_reservations', (docs) => {
            setReservations(docs);
        });
        return () => unsubscribe();
    }, []);

    // 2. Función addReservation con Validación de Seguridad
    const addReservation = async (blockId, date, subject, userNameOverride = null) => {
        if (!user) {
            toast.error("Debes iniciar sesión para reservar.");
            return false;
        }

        const userName = userNameOverride || user.name;

        try {
            // A. Leer la versión más reciente LITERALLY RIGHT NOW para evitar race conditions
            const currentData = await fetchCollection('lab_reservations');

            const isOccupied = currentData.some(r => r.date === date && r.blockId === blockId);

            if (isOccupied) {
                toast.error("¡Bloque ya reservado por otro usuario!");
                return false;
            }

            // C. Si está libre, agregamos
            const newReservation = {
                blockId,
                teacher: userName,
                subject,
                date,
                timestamp: Date.now(),
                userId: user.id
            };

            await createDocument('lab_reservations', newReservation);
            toast.success("Reserva confirmada.");
            return true;

        } catch (error) {
            console.error("Error en addReservation:", error);
            toast.error("Error al procesar la reserva.");
            return false;
        }
    };

    // 3. Función removeReservation con Permisos
    const removeReservation = async (reservationId) => {
        if (!user) return;

        try {
            const reservation = reservations.find(r => r.id === reservationId);

            if (!reservation) {
                toast.error("La reserva no existe.");
                return;
            }

            // Validar permisos
            const isOwner = reservation.userId === user.id;
            const isAdmin = user.role === 'director' || user.role === 'admin' || user.role === 'super_admin';

            if (!isOwner && !isAdmin) {
                toast.error("Solo el dueño o un admin pueden borrar esta reserva.");
                return;
            }

            await removeDocument('lab_reservations', reservationId);
            toast.success("Reserva eliminada.");

        } catch (error) {
            console.error("Error removing reservation:", error);
            toast.error("Error al eliminar la reserva.");
        }
    };

    // Helper para obtener reserva de un bloque específico
    const getReservation = (date, blockId) => {
        return reservations.find(r => r.date === date && r.blockId === blockId);
    };

    const value = React.useMemo(() => ({
        reservations,
        addReservation,
        removeReservation,
        getReservation
    }), [reservations, user]);

    return (
        <LabContext.Provider value={value}>
            {children}
        </LabContext.Provider>
    );
}

export function useLab() {
    return useContext(LabContext);
}

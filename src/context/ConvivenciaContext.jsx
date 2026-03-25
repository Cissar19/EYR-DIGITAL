import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, ROLES } from './AuthContext';
import { toast } from 'sonner';
import { subscribeToCollection, createDocument, removeDocument, fetchCollection } from '../lib/firestoreService';
import { validateDate, validateRequiredString, validateEnum, sanitizeText } from '../lib/validation';
import { sendConvivenciaEmail } from '../lib/emailService';

const ConvivenciaContext = createContext();
const ADMIN_ROLES = [ROLES.DIRECTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN];
const CAN_BLOCK_ROLES = [ROLES.CONVIVENCIA_HEAD, ROLES.ADMIN, ROLES.SUPER_ADMIN];

export const TIME_BLOCKS = [
    { id: 'recepcion', start: '08:00', end: '08:10', type: 'class', label: 'Recepcion' },
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
    { id: 'b9', start: '15:25', end: '16:10', type: 'class', label: 'Bloque 9' },
    { id: 'b10', start: '16:10', end: '17:00', type: 'class', label: 'Bloque 10' },
];

export const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

export function ConvivenciaProvider({ children }) {
    const { user, users } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);

    const resolveTeacherEmail = (teacherName) => {
        const found = users.find(u => u.name === teacherName);
        return found ? { email: found.email, name: found.name } : { email: '', name: teacherName };
    };

    const getConvivenciaAdmin = () => {
        const admin = users.find(u => u.role === ROLES.CONVIVENCIA);
        return admin ? { email: admin.email, name: admin.name } : null;
    };

    useEffect(() => {
        const unsubscribe = subscribeToCollection('convivencia_reservations', (docs) => {
            setReservations(docs);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('convivencia_blocks', (docs) => {
            setBlockedSlots(docs);
        });
        return () => unsubscribe();
    }, []);

    const VALID_BLOCK_IDS = TIME_BLOCKS.map(b => b.id);

    const getBlockedSlot = (date, blockId) => {
        return blockedSlots.find(b => b.date === date && b.blockId === blockId);
    };

    const blockSlot = async (blockId, date, reason) => {
        if (!user) {
            toast.error('Debes iniciar sesion.');
            return false;
        }
        if (!CAN_BLOCK_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para bloquear bloques.');
            return false;
        }

        validateEnum(blockId, VALID_BLOCK_IDS, 'bloque');
        validateDate(date, 'fecha');
        validateRequiredString(reason, 'motivo de bloqueo', 200);

        try {
            const existing = blockedSlots.find(b => b.date === date && b.blockId === blockId);
            if (existing) {
                toast.error('Este bloque ya esta bloqueado.');
                return false;
            }

            await createDocument('convivencia_blocks', {
                blockId,
                date,
                reason: sanitizeText(reason),
                blockedBy: user.id,
                blockedByName: user.name,
            });
            toast.success('Bloque bloqueado.');
            return true;
        } catch (error) {
            console.error('Error en blockSlot:', error);
            toast.error('Error al bloquear el bloque.');
            return false;
        }
    };

    const unblockSlot = async (blockedSlotId) => {
        if (!user) return;
        if (!CAN_BLOCK_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para desbloquear bloques.');
            return;
        }

        try {
            await removeDocument('convivencia_blocks', blockedSlotId);
            toast.success('Bloque desbloqueado.');
        } catch (error) {
            console.error('Error en unblockSlot:', error);
            toast.error('Error al desbloquear el bloque.');
        }
    };

    const addReservation = async (blockId, date, subject, teacher) => {
        if (!user) {
            toast.error("Debes iniciar sesion para reservar.");
            return false;
        }

        validateEnum(blockId, VALID_BLOCK_IDS, 'bloque');
        validateDate(date, 'fecha');
        validateRequiredString(subject, 'motivo', 200);
        validateRequiredString(teacher, 'profesor jefe', 100);

        try {
            const isBlocked = blockedSlots.some(b => b.date === date && b.blockId === blockId);
            if (isBlocked) {
                toast.error('Este bloque esta bloqueado y no se puede reservar.');
                return false;
            }

            const currentData = await fetchCollection('convivencia_reservations');
            const isOccupied = currentData.some(r => r.date === date && r.blockId === blockId);

            if (isOccupied) {
                toast.error("Bloque ya reservado por otro usuario!");
                return false;
            }

            const newReservation = {
                blockId,
                date,
                subject: sanitizeText(subject),
                teacher: sanitizeText(teacher),
                userId: user.id,
                timestamp: Date.now(),
            };

            await createDocument('convivencia_reservations', newReservation);
            toast.success("Reserva confirmada.");

            const block = TIME_BLOCKS.find(b => b.id === blockId);
            const teacherInfo = resolveTeacherEmail(teacher);
            const convAdmin = getConvivenciaAdmin();
            sendConvivenciaEmail({
                convivenciaAction: 'reservation_created',
                teacherEmail: teacherInfo.email,
                teacherName: teacherInfo.name,
                convivenciaEmail: convAdmin?.email || '',
                convivenciaName: convAdmin?.name || '',
                date,
                blockLabel: block?.label || blockId,
                blockStart: block?.start || '',
                blockEnd: block?.end || '',
                subject,
            });

            return true;

        } catch (error) {
            console.error("Error en addReservation (convivencia):", error);
            toast.error("Error al procesar la reserva.");
            return false;
        }
    };

    const removeReservation = async (reservationId) => {
        if (!user) return;

        try {
            const reservation = reservations.find(r => r.id === reservationId);

            if (!reservation) {
                toast.error("La reserva no existe.");
                return;
            }

            const isOwner = reservation.userId === user.id;
            const isAdmin = ADMIN_ROLES.includes(user.role);

            if (!isOwner && !isAdmin) {
                toast.error("Solo el dueno o un admin pueden borrar esta reserva.");
                return;
            }

            const block = TIME_BLOCKS.find(b => b.id === reservation.blockId);
            const teacherInfo = resolveTeacherEmail(reservation.teacher);
            const convAdmin = getConvivenciaAdmin();

            await removeDocument('convivencia_reservations', reservationId);
            toast.success("Reserva eliminada.");

            sendConvivenciaEmail({
                convivenciaAction: 'reservation_cancelled',
                teacherEmail: teacherInfo.email,
                teacherName: teacherInfo.name,
                convivenciaEmail: convAdmin?.email || '',
                convivenciaName: convAdmin?.name || '',
                date: reservation.date,
                blockLabel: block?.label || reservation.blockId,
                blockStart: block?.start || '',
                blockEnd: block?.end || '',
                subject: reservation.subject,
            });

        } catch (error) {
            console.error("Error removing convivencia reservation:", error);
            toast.error("Error al eliminar la reserva.");
        }
    };

    const getReservation = (date, blockId) => {
        return reservations.find(r => r.date === date && r.blockId === blockId);
    };

    const value = React.useMemo(() => ({
        reservations,
        addReservation,
        removeReservation,
        getReservation,
        blockedSlots,
        blockSlot,
        unblockSlot,
        getBlockedSlot
    }), [reservations, blockedSlots, user]);

    return (
        <ConvivenciaContext.Provider value={value}>
            {children}
        </ConvivenciaContext.Provider>
    );
}

export function useConvivencia() {
    return useContext(ConvivenciaContext);
}

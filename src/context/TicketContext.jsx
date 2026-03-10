import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { createDocument, updateDocument } from '../lib/firestoreService';
import { useAuth } from './AuthContext';
import { validateRequiredString, validateUserId, validateEnum, sanitizeText } from '../lib/validation';

const TicketContext = createContext();

// ============================================
// TICKET CATEGORIES
// ============================================
export const TICKET_CATEGORIES = [
    { id: 'hardware', label: 'Hardware', description: 'PC, Proyector, Mouse, Teclado', icon: '💻' },
    { id: 'software', label: 'Software/Plataforma', description: 'Aplicaciones, Accesos', icon: '⚙️' },
    { id: 'internet', label: 'Internet/WiFi', description: 'Problemas de conexion', icon: '📶' },
    { id: 'infrastructure', label: 'Electrico/Infraestructura', description: 'Enchufes, Luces, Pizarras', icon: '🔌' },
    { id: 'other', label: 'Otro', description: 'Otros problemas', icon: '📋' }
];

// ============================================
// PRIORITY LEVELS
// ============================================
export const PRIORITY_LEVELS = {
    LOW: { id: 'low', label: 'Baja', color: 'green', icon: '🟢' },
    MEDIUM: { id: 'medium', label: 'Media', color: 'yellow', icon: '🟡' },
    HIGH: { id: 'high', label: 'Alta', color: 'red', icon: '🔴' }
};

// ============================================
// TICKET STATUS
// ============================================
export const TICKET_STATUS = {
    OPEN: { id: 'open', label: 'Abierto', color: 'blue', icon: '🔵' },
    IN_PROGRESS: { id: 'in_progress', label: 'En Proceso', color: 'orange', icon: '🟠' },
    CLOSED: { id: 'closed', label: 'Resuelto', color: 'green', icon: '✅' }
};

// ============================================
// TICKET PROVIDER
// ============================================
const VALID_CATEGORIES = ['hardware', 'software', 'internet', 'infrastructure', 'other'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['open', 'in_progress', 'closed'];
const MANAGEMENT_ROLES = ['admin', 'super_admin', 'director', 'utp_head', 'inspector'];

export const TicketProvider = ({ children }) => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time subscription to tickets collection
    useEffect(() => {
        const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setTickets(docs);
            setLoading(false);
        }, (error) => {
            console.error('Error subscribing to tickets:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addTicket = React.useCallback(async (ticketData) => {
        if (!user) throw new Error('No autenticado');

        validateUserId(ticketData.userId);
        validateRequiredString(ticketData.userName, 'nombre', 100);
        validateEnum(ticketData.category, VALID_CATEGORIES, 'categoria');
        validateEnum(ticketData.priority, VALID_PRIORITIES, 'prioridad');
        validateRequiredString(ticketData.description, 'descripcion');

        try {
            const newTicket = await createDocument('tickets', {
                userId: ticketData.userId,
                userName: sanitizeText(ticketData.userName),
                category: ticketData.category,
                priority: ticketData.priority,
                location: sanitizeText(ticketData.location || ''),
                description: sanitizeText(ticketData.description),
                status: TICKET_STATUS.OPEN.id,
                updatedAt: new Date().toISOString()
            });

            toast.success('Ticket creado exitosamente', {
                description: `Se ha reportado el problema: ${TICKET_CATEGORIES.find(c => c.id === ticketData.category)?.label}`
            });

            return newTicket;
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Error al crear el ticket');
            throw error;
        }
    }, [user]);

    const getUserTickets = React.useCallback((userId) => {
        return tickets.filter(ticket => ticket.userId === userId);
    }, [tickets]);

    const getAllTickets = React.useCallback(() => {
        return tickets;
    }, [tickets]);

    const updateTicketStatus = React.useCallback(async (ticketId, newStatus) => {
        // Only management roles can update ticket status
        if (!user || !MANAGEMENT_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para actualizar tickets');
            return;
        }

        validateEnum(newStatus, VALID_STATUSES, 'estado');

        try {
            await updateDocument('tickets', ticketId, {
                status: newStatus
            });

            const statusInfo = Object.values(TICKET_STATUS).find(s => s.id === newStatus);
            toast.info(`Ticket actualizado a: ${statusInfo?.label}`);
        } catch (error) {
            console.error('Error updating ticket:', error);
            toast.error('Error al actualizar el ticket');
            throw error;
        }
    }, [user]);

    const getTicketById = React.useCallback((ticketId) => {
        return tickets.find(ticket => ticket.id === ticketId) || null;
    }, [tickets]);

    const getTicketStats = React.useCallback(() => {
        return {
            open: tickets.filter(t => t.status === TICKET_STATUS.OPEN.id).length,
            in_progress: tickets.filter(t => t.status === TICKET_STATUS.IN_PROGRESS.id).length,
            closed: tickets.filter(t => t.status === TICKET_STATUS.CLOSED.id).length,
            total: tickets.length
        };
    }, [tickets]);

    const value = React.useMemo(() => ({
        tickets,
        loading,
        addTicket,
        getUserTickets,
        getAllTickets,
        updateTicketStatus,
        getTicketById,
        getTicketStats
    }), [tickets, loading, addTicket, getUserTickets, getAllTickets, updateTicketStatus, getTicketById, getTicketStats]);

    return (
        <TicketContext.Provider value={value}>
            {children}
        </TicketContext.Provider>
    );
};

export const useTickets = () => useContext(TicketContext);

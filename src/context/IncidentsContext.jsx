import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { validateRequiredString, validateEnum, sanitizeText } from '../lib/validation';
import { orderBy } from 'firebase/firestore';

const IncidentsContext = createContext();
const COLLECTION = 'convivencia_incidents';

// ── Enums ──

export const CATEGORIES = [
    { value: 'conducta', label: 'Conducta', color: 'red' },
    { value: 'salud', label: 'Salud', color: 'emerald' },
    { value: 'asistencia', label: 'Asistencia', color: 'blue' },
    { value: 'familia', label: 'Familia', color: 'purple' },
    { value: 'otro', label: 'Otro', color: 'slate' },
];

export const SEVERITIES = [
    { value: 'leve', label: 'Leve', color: 'amber', border: 'border-l-amber-400' },
    { value: 'grave', label: 'Grave', color: 'orange', border: 'border-l-orange-500' },
    { value: 'muy_grave', label: 'Muy Grave', color: 'red', border: 'border-l-red-600' },
];

export const STATUSES = [
    { value: 'abierta', label: 'Abierta', color: 'amber' },
    { value: 'en_seguimiento', label: 'En Seguimiento', color: 'blue' },
    { value: 'resuelta', label: 'Resuelta', color: 'emerald' },
];

const CATEGORY_VALUES = CATEGORIES.map(c => c.value);
const SEVERITY_VALUES = SEVERITIES.map(s => s.value);
const STATUS_VALUES = STATUSES.map(s => s.value);

export function IncidentsProvider({ children }) {
    const { user } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToCollection(COLLECTION, (docs) => {
            setIncidents(docs);
            setLoading(false);
        }, orderBy('createdAt', 'desc'));
        return () => unsubscribe();
    }, []);

    const canWrite = useCallback(() => {
        return user && ['convivencia', 'admin', 'super_admin'].includes(user.role);
    }, [user]);

    const canDelete = useCallback(() => {
        return user && ['admin', 'super_admin'].includes(user.role);
    }, [user]);

    const createIncident = useCallback(async (data) => {
        if (!canWrite()) {
            toast.error('Sin permisos para crear incidencias');
            return null;
        }

        validateRequiredString(data.studentId, 'Alumno');
        validateRequiredString(data.description, 'Descripcion');
        validateEnum(data.category, CATEGORY_VALUES, 'Categoria');
        validateEnum(data.severity, SEVERITY_VALUES, 'Severidad');

        const incident = {
            studentId: data.studentId,
            studentName: sanitizeText(data.studentName || ''),
            studentRut: data.studentRut || '',
            studentCurso: data.studentCurso || '',
            date: data.date || new Date().toLocaleDateString('en-CA'),
            time: data.time || new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            description: sanitizeText(data.description),
            category: data.category,
            severity: data.severity,
            reportedBy: {
                id: user.id,
                name: user.name || '',
            },
            involvedStaff: data.involvedStaff || [],
            status: 'abierta',
            followUpDate: data.followUpDate || '',
            resolvedAt: null,
            notes: [],
        };

        const result = await createDocument(COLLECTION, incident);
        toast.success('Incidencia registrada');
        return result;
    }, [canWrite, user]);

    const updateIncident = useCallback(async (id, data) => {
        if (!canWrite()) {
            toast.error('Sin permisos para editar incidencias');
            return;
        }
        await updateDocument(COLLECTION, id, data);
    }, [canWrite]);

    const deleteIncident = useCallback(async (id) => {
        if (!canDelete()) {
            toast.error('Solo admin puede eliminar incidencias');
            return;
        }
        await removeDocument(COLLECTION, id);
        toast.success('Incidencia eliminada');
    }, [canDelete]);

    const addFollowUpNote = useCallback(async (incidentId, noteText) => {
        if (!canWrite()) {
            toast.error('Sin permisos');
            return;
        }

        validateRequiredString(noteText, 'Nota');

        const incident = incidents.find(i => i.id === incidentId);
        if (!incident) {
            toast.error('Incidencia no encontrada');
            return;
        }

        const note = {
            text: sanitizeText(noteText),
            author: user.name || '',
            authorId: user.id,
            timestamp: new Date().toISOString(),
        };

        const updatedNotes = [...(incident.notes || []), note];
        await updateDocument(COLLECTION, incidentId, { notes: updatedNotes });
        toast.success('Nota agregada');
    }, [canWrite, user, incidents]);

    const changeStatus = useCallback(async (incidentId, newStatus) => {
        if (!canWrite()) {
            toast.error('Sin permisos');
            return;
        }

        validateEnum(newStatus, STATUS_VALUES, 'Estado');

        const updates = { status: newStatus };
        if (newStatus === 'resuelta') {
            updates.resolvedAt = new Date().toISOString();
        }

        await updateDocument(COLLECTION, incidentId, updates);
        toast.success(`Estado cambiado a ${STATUSES.find(s => s.value === newStatus)?.label || newStatus}`);
    }, [canWrite]);

    const value = React.useMemo(() => ({
        incidents,
        loading,
        createIncident,
        updateIncident,
        deleteIncident,
        addFollowUpNote,
        changeStatus,
    }), [incidents, loading, createIncident, updateIncident, deleteIncident, addFollowUpNote, changeStatus]);

    return (
        <IncidentsContext.Provider value={value}>
            {children}
        </IncidentsContext.Provider>
    );
}

export function useIncidents() {
    return useContext(IncidentsContext);
}

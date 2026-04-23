import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';
import { validateRequiredString, sanitizeText } from '../lib/validation';
import { useAuth } from './AuthContext';

const WorkshopsContext = createContext();
export const useWorkshops = () => useContext(WorkshopsContext);

export const WorkshopsProvider = ({ children }) => {
    const [workshops, setWorkshops] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribe = subscribeToCollection('workshops', (docs) => {
            const sorted = docs.sort((a, b) =>
                new Date(b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || 0) -
                new Date(a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || 0)
            );
            setWorkshops(sorted);
        });
        return () => unsubscribe();
    }, []);

    const createWorkshop = React.useCallback(async (title) => {
        validateRequiredString(title, 'título', 100);
        const doc = {
            title: sanitizeText(title),
            createdBy: user.uid,
            createdByName: user.name || user.displayName || user.email,
            nodes: [],
            edges: [],
            acta: { fecha: '', participantes: [], temas: [] },
            compromisos: [],
            responsabilidades: { tareas: [], personas: [], celdas: {} },
        };
        try {
            const created = await createDocument('workshops', doc);
            toast.success('Diagrama creado');
            return created;
        } catch (error) {
            console.error('Error creando workshop:', error);
            toast.error('Error al crear diagrama');
            return null;
        }
    }, [user]);

    const saveWorkshop = React.useCallback(async (workshopId, nodes, edges) => {
        try {
            await updateDocument('workshops', workshopId, {
                nodes,
                edges,
                updatedAt: new Date(),
            });
        } catch (error) {
            console.error('Error guardando workshop:', error);
            toast.error('Error al guardar');
        }
    }, []);

    const saveActa = React.useCallback(async (workshopId, acta) => {
        try {
            await updateDocument('workshops', workshopId, { acta, updatedAt: new Date() });
        } catch (e) {
            console.error('Error guardando acta:', e);
            toast.error('Error al guardar acta');
        }
    }, []);

    const saveCompromisos = React.useCallback(async (workshopId, compromisos) => {
        try {
            await updateDocument('workshops', workshopId, { compromisos, updatedAt: new Date() });
        } catch (e) {
            console.error('Error guardando compromisos:', e);
            toast.error('Error al guardar compromisos');
        }
    }, []);

    const saveResponsabilidades = React.useCallback(async (workshopId, responsabilidades) => {
        try {
            await updateDocument('workshops', workshopId, { responsabilidades, updatedAt: new Date() });
        } catch (e) {
            console.error('Error guardando responsabilidades:', e);
            toast.error('Error al guardar tabla');
        }
    }, []);

    const renameWorkshop = React.useCallback(async (workshopId, title) => {
        validateRequiredString(title, 'título', 100);
        try {
            await updateDocument('workshops', workshopId, { title: sanitizeText(title) });
        } catch (error) {
            toast.error('Error al renombrar');
        }
    }, []);

    const deleteWorkshop = React.useCallback(async (workshopId) => {
        try {
            await removeDocument('workshops', workshopId);
            toast.success('Diagrama eliminado');
        } catch (error) {
            toast.error('Error al eliminar');
        }
    }, []);

    const value = React.useMemo(() => ({
        workshops, createWorkshop, saveWorkshop, renameWorkshop, deleteWorkshop,
        saveActa, saveCompromisos, saveResponsabilidades,
    }), [workshops, createWorkshop, saveWorkshop, renameWorkshop, deleteWorkshop, saveActa, saveCompromisos, saveResponsabilidades]);

    return <WorkshopsContext.Provider value={value}>{children}</WorkshopsContext.Provider>;
};

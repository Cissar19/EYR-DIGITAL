import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';
import { validateRequiredString, sanitizeText } from '../lib/validation';
import { useAuth } from './AuthContext';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const WorkshopsContext = createContext();
export const useWorkshops = () => useContext(WorkshopsContext);

const normalizeWorkshop = (w) => ({
    ...w,
    createdBy: w.created_by ?? w.createdBy,
    createdByName: w.created_by_name ?? w.createdByName,
    createdAt: w.created_at ?? w.createdAt,
    updatedAt: w.updated_at ?? w.updatedAt,
});

export const WorkshopsProvider = ({ children }) => {
    const [workshops, setWorkshops] = useState([]);
    const { user } = useAuth();

    const sortWorkshops = (list) => list.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(a.updatedAt || a.createdAt || 0);
        const bTime = b.updatedAt?.toDate?.() || new Date(b.updatedAt || b.createdAt || 0);
        return bTime - aTime;
    });

    useEffect(() => {
        if (FLAGS.USE_NEW_API_WORKSHOPS) {
            let cancelled = false;
            apiClient.get('/workshops').then(data => {
                if (!cancelled) setWorkshops(sortWorkshops(data.map(normalizeWorkshop)));
            }).catch(err => {
                console.error('Error cargando workshops:', err);
            });

            const socket = getSocket();
            const onCreated = (w) => setWorkshops(prev => sortWorkshops([...prev, normalizeWorkshop(w)]));
            const onUpdated = (w) => setWorkshops(prev => sortWorkshops(prev.map(x => x.id === w.id ? normalizeWorkshop(w) : x)));
            const onDeleted = ({ id }) => setWorkshops(prev => prev.filter(x => x.id !== id));

            socket?.on('workshops:created', onCreated);
            socket?.on('workshops:updated', onUpdated);
            socket?.on('workshops:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('workshops:created', onCreated);
                socket?.off('workshops:updated', onUpdated);
                socket?.off('workshops:deleted', onDeleted);
            };
        }

        // Firebase original
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
        try {
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                const created = await apiClient.post('/workshops', {
                    title: sanitizeText(title),
                });
                const data = await apiClient.get('/workshops');
                setWorkshops(sortWorkshops(data.map(normalizeWorkshop)));
                toast.success('Diagrama creado');
                return normalizeWorkshop(created);
            }

            // Firebase original
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
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                await apiClient.patch(`/workshops/${workshopId}`, { nodes, edges });
            } else {
                await updateDocument('workshops', workshopId, {
                    nodes,
                    edges,
                    updatedAt: new Date(),
                });
            }
        } catch (error) {
            console.error('Error guardando workshop:', error);
            toast.error('Error al guardar');
        }
    }, []);

    const saveActa = React.useCallback(async (workshopId, acta) => {
        try {
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                await apiClient.patch(`/workshops/${workshopId}`, { acta });
            } else {
                await updateDocument('workshops', workshopId, { acta, updatedAt: new Date() });
            }
        } catch (e) {
            console.error('Error guardando acta:', e);
            toast.error('Error al guardar acta');
        }
    }, []);

    const saveCompromisos = React.useCallback(async (workshopId, compromisos) => {
        try {
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                await apiClient.patch(`/workshops/${workshopId}`, { compromisos });
            } else {
                await updateDocument('workshops', workshopId, { compromisos, updatedAt: new Date() });
            }
        } catch (e) {
            console.error('Error guardando compromisos:', e);
            toast.error('Error al guardar compromisos');
        }
    }, []);

    const saveResponsabilidades = React.useCallback(async (workshopId, responsabilidades) => {
        try {
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                await apiClient.patch(`/workshops/${workshopId}`, { responsabilidades });
            } else {
                await updateDocument('workshops', workshopId, { responsabilidades, updatedAt: new Date() });
            }
        } catch (e) {
            console.error('Error guardando responsabilidades:', e);
            toast.error('Error al guardar tabla');
        }
    }, []);

    const renameWorkshop = React.useCallback(async (workshopId, title) => {
        validateRequiredString(title, 'título', 100);
        try {
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                await apiClient.patch(`/workshops/${workshopId}`, { title: sanitizeText(title) });
            } else {
                await updateDocument('workshops', workshopId, { title: sanitizeText(title) });
            }
        } catch (error) {
            toast.error('Error al renombrar');
        }
    }, []);

    const deleteWorkshop = React.useCallback(async (workshopId) => {
        try {
            if (FLAGS.USE_NEW_API_WORKSHOPS) {
                await apiClient.delete(`/workshops/${workshopId}`);
            } else {
                await removeDocument('workshops', workshopId);
            }
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

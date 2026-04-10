import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeToCollection, createDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';

const ReplacementLogsContext = createContext();

export const useReplacementLogs = () => useContext(ReplacementLogsContext);

export const ReplacementLogsProvider = ({ children }) => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('replacement_logs', (docs) => {
            const sorted = docs.sort((a, b) => {
                // Sort by date desc, then by startTime asc
                if (b.date !== a.date) return b.date > a.date ? 1 : -1;
                return (a.startTime || '').localeCompare(b.startTime || '');
            });
            setLogs(sorted);
        });
        return () => unsubscribe();
    }, []);

    const assignReplacement = useCallback(async (data) => {
        try {
            await createDocument('replacement_logs', {
                date: data.date,
                absentId: data.absentId,
                absentName: data.absentName,
                absenceType: data.absenceType,
                startTime: data.startTime,
                subject: data.subject || '',
                course: data.course || '',
                replacementId: data.replacementId,
                replacementName: data.replacementName,
                assignedBy: data.assignedBy,
                assignedByName: data.assignedByName,
                candidates: data.candidates || [],
            });
            toast.success('Reemplazo asignado correctamente');
            return true;
        } catch (error) {
            console.error('Error asignando reemplazo:', error);
            const msg = error?.code === 'permission-denied'
                ? 'Sin permisos para escribir. Verifica que estés autenticado como directivo.'
                : (error?.message || 'Error al asignar reemplazo');
            toast.error(msg);
            return false;
        }
    }, []);

    const deleteLog = useCallback(async (logId) => {
        try {
            await removeDocument('replacement_logs', logId);
            toast.success('Registro eliminado');
            return true;
        } catch (error) {
            console.error('Error eliminando registro:', error);
            toast.error('Error al eliminar registro');
            return false;
        }
    }, []);

    const value = useMemo(() => ({
        logs,
        assignReplacement,
        deleteLog,
    }), [logs, assignReplacement, deleteLog]);

    return (
        <ReplacementLogsContext.Provider value={value}>
            {children}
        </ReplacementLogsContext.Provider>
    );
};

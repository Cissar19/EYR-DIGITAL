import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';
import { validateDate, validateRequiredString, sanitizeText } from '../lib/validation';

const EvaluacionesContext = createContext();

export const useEvaluaciones = () => useContext(EvaluacionesContext);

const COLLECTION = 'evaluaciones';

export const EvaluacionesProvider = ({ children }) => {
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToCollection(COLLECTION, (docs) => {
            const sorted = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setEvaluaciones(sorted);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const addEvaluacion = useCallback(async (data) => {
        validateRequiredString(data.name, 'nombre');
        validateRequiredString(data.curso, 'curso');
        validateRequiredString(data.asignatura, 'asignatura');
        validateDate(data.date, 'fecha');

        const doc = {
            name: sanitizeText(data.name),
            curso: data.curso,
            asignatura: data.asignatura,
            date: data.date,
            totalQuestions: data.questions.length,
            questions: data.questions,
            results: {},
            driveLink: data.driveLink || '',
            createdBy: data.createdBy,
            createdAt: new Date().toISOString(),
            status: 'pending',
        };

        try {
            const created = await createDocument(COLLECTION, doc);
            toast.success('Evaluacion creada');
            return created.id;
        } catch (error) {
            console.error('Error creando evaluacion:', error);
            toast.error('Error al crear evaluacion');
            return null;
        }
    }, []);

    const updateEvaluacion = useCallback(async (id, data) => {
        try {
            const updates = {};
            if (data.name !== undefined) updates.name = sanitizeText(data.name);
            if (data.date !== undefined) { validateDate(data.date, 'fecha'); updates.date = data.date; }
            if (data.questions !== undefined) {
                updates.questions = data.questions;
                updates.totalQuestions = data.questions.length;
            }
            if (data.selectedIndicadores !== undefined) {
                updates.selectedIndicadores = data.selectedIndicadores;
            }
            if (data.driveLink !== undefined) {
                updates.driveLink = data.driveLink;
            }

            await updateDocument(COLLECTION, id, updates);
            toast.success('Evaluacion actualizada');
            return true;
        } catch (error) {
            console.error('Error actualizando evaluacion:', error);
            toast.error('Error al actualizar evaluacion');
            return false;
        }
    }, []);

    const deleteEvaluacion = useCallback(async (id) => {
        try {
            await removeDocument(COLLECTION, id);
            toast.success('Evaluacion eliminada');
            return true;
        } catch (error) {
            console.error('Error eliminando evaluacion:', error);
            toast.error('Error al eliminar evaluacion');
            return false;
        }
    }, []);

    const saveResults = useCallback(async (evalId, studentId, answers) => {
        try {
            await updateDocument(COLLECTION, evalId, {
                [`results.${studentId}`]: answers,
            });
            return true;
        } catch (error) {
            console.error('Error guardando resultados:', error);
            toast.error('Error al guardar resultados');
            return false;
        }
    }, []);

    const approveEvaluacion = useCallback(async (id, approverInfo) => {
        try {
            await updateDocument(COLLECTION, id, {
                status: 'approved',
                approvedBy: approverInfo,
                approvalDate: new Date().toISOString(),
                rejectionReason: null,
                rejectedBy: null,
            });
            toast.success('Evaluacion aprobada');
            return true;
        } catch (error) {
            console.error('Error aprobando evaluacion:', error);
            toast.error('Error al aprobar evaluacion');
            return false;
        }
    }, []);

    const rejectEvaluacion = useCallback(async (id, reason, approverInfo) => {
        try {
            await updateDocument(COLLECTION, id, {
                status: 'rejected',
                rejectionReason: sanitizeText(reason),
                rejectedBy: approverInfo,
            });
            toast.success('Evaluacion rechazada');
            return true;
        } catch (error) {
            console.error('Error rechazando evaluacion:', error);
            toast.error('Error al rechazar evaluacion');
            return false;
        }
    }, []);

    const resubmitEvaluacion = useCallback(async (id) => {
        try {
            await updateDocument(COLLECTION, id, {
                status: 'pending',
                rejectionReason: null,
                rejectedBy: null,
            });
            toast.success('Evaluacion reenviada para revision');
            return true;
        } catch (error) {
            console.error('Error reenviando evaluacion:', error);
            toast.error('Error al reenviar evaluacion');
            return false;
        }
    }, []);

    const value = React.useMemo(() => ({
        evaluaciones,
        loading,
        addEvaluacion,
        updateEvaluacion,
        deleteEvaluacion,
        saveResults,
        approveEvaluacion,
        rejectEvaluacion,
        resubmitEvaluacion,
    }), [evaluaciones, loading, addEvaluacion, updateEvaluacion, deleteEvaluacion, saveResults, approveEvaluacion, rejectEvaluacion, resubmitEvaluacion]);

    return (
        <EvaluacionesContext.Provider value={value}>
            {children}
        </EvaluacionesContext.Provider>
    );
};

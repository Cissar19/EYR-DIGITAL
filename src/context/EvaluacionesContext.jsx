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

        if (!data.questions || data.questions.length === 0) {
            throw new Error('Debe tener al menos una pregunta');
        }

        const doc = {
            name: sanitizeText(data.name),
            curso: data.curso,
            asignatura: data.asignatura,
            date: data.date,
            totalQuestions: data.questions.length,
            questions: data.questions,
            results: {},
            createdBy: data.createdBy,
            createdAt: new Date().toISOString(),
        };

        try {
            await createDocument(COLLECTION, doc);
            toast.success('Evaluacion creada');
            return true;
        } catch (error) {
            console.error('Error creando evaluacion:', error);
            toast.error('Error al crear evaluacion');
            return false;
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

    const value = React.useMemo(() => ({
        evaluaciones,
        loading,
        addEvaluacion,
        updateEvaluacion,
        deleteEvaluacion,
        saveResults,
    }), [evaluaciones, loading, addEvaluacion, updateEvaluacion, deleteEvaluacion, saveResults]);

    return (
        <EvaluacionesContext.Provider value={value}>
            {children}
        </EvaluacionesContext.Provider>
    );
};

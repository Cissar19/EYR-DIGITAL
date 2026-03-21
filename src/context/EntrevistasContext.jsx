import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';
import { validateDate, validateRequiredString, validateEnum, sanitizeText, sanitizeName } from '../lib/validation';

const EntrevistasContext = createContext();

export const useEntrevistas = () => useContext(EntrevistasContext);

const PARTICIPANTS = ['alumno', 'apoderado'];
const REASONS = ['conducta', 'asistencia', 'academico', 'otro'];

export const EntrevistasProvider = ({ children }) => {
    const [entrevistas, setEntrevistas] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('entrevistas', (docs) => {
            const sorted = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setEntrevistas(sorted);
        });
        return () => unsubscribe();
    }, []);

    const addEntrevista = React.useCallback(async (data) => {
        validateRequiredString(data.studentId, 'alumno');
        validateRequiredString(data.studentName, 'nombre alumno', 100);
        validateDate(data.date, 'fecha');
        validateEnum(data.participants, PARTICIPANTS, 'participantes');
        validateEnum(data.reason, REASONS, 'motivo');

        const doc = {
            studentId: data.studentId,
            studentName: sanitizeName(data.studentName),
            studentRut: data.studentRut || '',
            studentCurso: data.studentCurso || '',
            date: data.date,
            participants: data.participants,
            parentName: data.parentName ? sanitizeName(data.parentName) : '',
            reason: data.reason,
            reasonDetail: data.reasonDetail ? sanitizeText(data.reasonDetail) : '',
            summary: data.summary ? sanitizeText(data.summary) : '',
            commitments: data.commitments ? sanitizeText(data.commitments) : '',
            registeredBy: data.registeredBy,
            createdAt: new Date().toISOString(),
        };

        try {
            await createDocument('entrevistas', doc);
            toast.success('Entrevista registrada');
            return true;
        } catch (error) {
            console.error('Error creando entrevista:', error);
            toast.error('Error al registrar entrevista');
            return false;
        }
    }, []);

    const updateEntrevista = React.useCallback(async (id, data) => {
        try {
            const updates = {};
            if (data.date) { validateDate(data.date, 'fecha'); updates.date = data.date; }
            if (data.participants) { validateEnum(data.participants, PARTICIPANTS, 'participantes'); updates.participants = data.participants; }
            if (data.reason) { validateEnum(data.reason, REASONS, 'motivo'); updates.reason = data.reason; }
            if (data.parentName !== undefined) updates.parentName = sanitizeName(data.parentName);
            if (data.reasonDetail !== undefined) updates.reasonDetail = sanitizeText(data.reasonDetail);
            if (data.summary !== undefined) updates.summary = sanitizeText(data.summary);
            if (data.commitments !== undefined) updates.commitments = sanitizeText(data.commitments);
            if (data.studentId) {
                updates.studentId = data.studentId;
                updates.studentName = sanitizeName(data.studentName);
                updates.studentRut = data.studentRut || '';
                updates.studentCurso = data.studentCurso || '';
            }

            await updateDocument('entrevistas', id, updates);
            toast.success('Entrevista actualizada');
            return true;
        } catch (error) {
            console.error('Error actualizando entrevista:', error);
            toast.error('Error al actualizar entrevista');
            return false;
        }
    }, []);

    const deleteEntrevista = React.useCallback(async (id) => {
        try {
            await removeDocument('entrevistas', id);
            toast.success('Entrevista eliminada');
            return true;
        } catch (error) {
            console.error('Error eliminando entrevista:', error);
            toast.error('Error al eliminar entrevista');
            return false;
        }
    }, []);

    const value = React.useMemo(() => ({
        entrevistas,
        addEntrevista,
        updateEntrevista,
        deleteEntrevista,
    }), [entrevistas, addEntrevista, updateEntrevista, deleteEntrevista]);

    return (
        <EntrevistasContext.Provider value={value}>
            {children}
        </EntrevistasContext.Provider>
    );
};

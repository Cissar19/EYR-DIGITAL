import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';
import { validateDate, validateRequiredString, validateEnum, sanitizeText, sanitizeName } from '../lib/validation';

const JustificativesContext = createContext();

export const useJustificatives = () => useContext(JustificativesContext);

const TYPES = ['medico', 'otro'];

export const JustificativesProvider = ({ children }) => {
    const [justificatives, setJustificatives] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('justificatives', (docs) => {
            const sorted = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setJustificatives(sorted);
        });
        return () => unsubscribe();
    }, []);

    const addJustificative = React.useCallback(async (data) => {
        validateRequiredString(data.studentId, 'alumno');
        validateRequiredString(data.studentName, 'nombre alumno', 100);
        validateDate(data.date, 'fecha');
        validateEnum(data.type, TYPES, 'tipo');

        const doc = {
            studentId: data.studentId,
            studentName: sanitizeName(data.studentName),
            studentRut: data.studentRut || '',
            studentCurso: data.studentCurso || '',
            date: data.date,
            type: data.type,
            diagnosis: data.type === 'medico' && data.diagnosis ? sanitizeText(data.diagnosis) : '',
            attachmentNote: data.attachmentNote ? sanitizeText(data.attachmentNote) : '',
            registeredBy: data.registeredBy,
            createdAt: new Date().toISOString(),
        };

        try {
            await createDocument('justificatives', doc);
            toast.success('Justificativo registrado');
            return true;
        } catch (error) {
            console.error('Error creando justificativo:', error);
            toast.error('Error al registrar justificativo');
            return false;
        }
    }, []);

    const updateJustificative = React.useCallback(async (id, data) => {
        try {
            const updates = {};
            if (data.date) { validateDate(data.date, 'fecha'); updates.date = data.date; }
            if (data.type) { validateEnum(data.type, TYPES, 'tipo'); updates.type = data.type; }
            if (data.diagnosis !== undefined) { updates.diagnosis = sanitizeText(data.diagnosis); }
            if (data.attachmentNote !== undefined) { updates.attachmentNote = sanitizeText(data.attachmentNote); }
            if (data.studentId) {
                updates.studentId = data.studentId;
                updates.studentName = sanitizeName(data.studentName);
                updates.studentRut = data.studentRut || '';
                updates.studentCurso = data.studentCurso || '';
            }

            await updateDocument('justificatives', id, updates);
            toast.success('Justificativo actualizado');
            return true;
        } catch (error) {
            console.error('Error actualizando justificativo:', error);
            toast.error('Error al actualizar justificativo');
            return false;
        }
    }, []);

    const deleteJustificative = React.useCallback(async (id) => {
        try {
            await removeDocument('justificatives', id);
            toast.success('Justificativo eliminado');
            return true;
        } catch (error) {
            console.error('Error eliminando justificativo:', error);
            toast.error('Error al eliminar justificativo');
            return false;
        }
    }, []);

    const value = React.useMemo(() => ({
        justificatives,
        addJustificative,
        updateJustificative,
        deleteJustificative,
    }), [justificatives, addJustificative, updateJustificative, deleteJustificative]);

    return (
        <JustificativesContext.Provider value={value}>
            {children}
        </JustificativesContext.Provider>
    );
};

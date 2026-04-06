import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToCollection, createDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';

const QuestionBankContext = createContext();

export const useQuestionBank = () => useContext(QuestionBankContext);

const COLLECTION = 'question_bank';

export const QuestionBankProvider = ({ children }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = subscribeToCollection(COLLECTION, docs => {
            setQuestions(docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /**
     * Guarda una pregunta de evaluación en el banco.
     * @param {object} pregunta - Objeto de pregunta completo
     * @param {string} asignatura - Código de asignatura (ej: 'MA')
     * @param {string} curso - Nombre del curso (ej: '3° Básico')
     * @param {{ id, name }} userInfo - Usuario que guarda
     */
    const addQuestion = useCallback(async (pregunta, asignatura, curso, userInfo) => {
        // No guardar file objects ni previewUrl
        const imagenGuardada = pregunta.imagen?.url
            ? { url: pregunta.imagen.url, aspectRatio: pregunta.imagen.aspectRatio ?? 1 }
            : null;

        // Limpiar campos temporales del editor
        const { imagen, ...resto } = pregunta;

        const doc = {
            ...resto,
            imagen: imagenGuardada,
            asignatura,
            curso,
            createdBy: userInfo,
            createdAt: new Date().toISOString(),
            usedCount: 0,
        };

        // Eliminar campos undefined antes de enviar a Firestore
        Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);

        try {
            await createDocument(COLLECTION, doc);
            toast.success('Pregunta guardada en el banco');
            return true;
        } catch (err) {
            console.error('Error guardando en banco:', err);
            toast.error('Error al guardar en banco');
            return false;
        }
    }, []);

    const deleteQuestion = useCallback(async (id) => {
        try {
            await removeDocument(COLLECTION, id);
            toast.success('Pregunta eliminada del banco');
            return true;
        } catch {
            toast.error('Error al eliminar del banco');
            return false;
        }
    }, []);

    const value = React.useMemo(() => ({
        questions,
        loading,
        addQuestion,
        deleteQuestion,
    }), [questions, loading, addQuestion, deleteQuestion]);

    return (
        <QuestionBankContext.Provider value={value}>
            {children}
        </QuestionBankContext.Provider>
    );
};

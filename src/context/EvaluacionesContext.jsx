import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { toast } from 'sonner';
import { validateDate, validateRequiredString, sanitizeText } from '../lib/validation';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const EvaluacionesContext = createContext();

export const useEvaluaciones = () => useContext(EvaluacionesContext);

const COLLECTION = 'evaluaciones';

const CAMEL_TO_SNAKE = {
    approvedBy: 'approved_by',
    approvalDate: 'approval_date',
    rejectedBy: 'rejected_by',
    rejectionReason: 'rejection_reason',
    pendingChanges: 'pending_changes',
    totalQuestions: 'total_questions',
    totalPoints: 'total_points',
    driveLink: 'drive_link',
    oaCodes: 'oa_codes',
    selectedIndicadores: 'selected_indicadores',
    copiedFrom: 'copied_from',
    createdBy: 'created_by',
};

const toSnakeCase = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[CAMEL_TO_SNAKE[key] || key] = value;
    }
    return result;
};

const normalizeEval = (e) => ({
    ...e,
    ...(e.data || {}),
    // Top-level 'approved'/'rejected' tienen prioridad; 'draft' del backend = 'pending' del frontend
    status: (e.status && e.status !== 'draft') ? e.status : (e.data?.status ?? 'pending'),
    name: e.name ?? e.title ?? '',
    curso: e.curso ?? e.grade ?? '',
    asignatura: e.asignatura ?? e.subject ?? '',
    createdBy: e.created_by ?? e.createdBy ?? e.data?.createdBy,
    createdAt: e.created_at ?? e.createdAt,
    totalQuestions: e.total_questions ?? e.totalQuestions ?? e.data?.totalQuestions,
    totalPoints: e.total_points ?? e.totalPoints ?? e.data?.totalPoints,
    driveLink: e.drive_link ?? e.driveLink ?? e.data?.driveLink,
    oaCodes: e.oa_codes ?? e.oaCodes ?? e.data?.oaCodes,
    approvedBy: e.approved_by ?? e.approvedBy ?? e.data?.approved_by,
    approvalDate: e.approval_date ?? e.approvalDate ?? e.data?.approval_date,
    rejectionReason: e.rejection_reason ?? e.rejectionReason ?? e.data?.rejection_reason,
    rejectedBy: e.rejected_by ?? e.rejectedBy ?? e.data?.rejected_by,
    pendingChanges: e.pending_changes ?? e.pendingChanges ?? e.data?.pending_changes,
    selectedIndicadores: e.selected_indicadores ?? e.selectedIndicadores,
    copiedFrom: e.copied_from ?? e.copiedFrom,
});

export const EvaluacionesProvider = ({ children }) => {
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const sortEvals = (list) => list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    useEffect(() => {
        if (FLAGS.USE_NEW_API_EVALUACIONES) {
            let cancelled = false;
            apiClient.get('/evaluaciones').then(data => {
                if (!cancelled) {
                    console.log('=== DIAG EVAL LOAD ===');
                    data.forEach(e => console.log(`id=${e.id} top.status="${e.status}" data.status="${e.data?.status}" title="${e.title}"`));
                    const normalized = data.map(normalizeEval);
                    normalized.forEach(e => console.log(`NORM id=${e.id} status="${e.status}" name="${e.name}"`));
                    console.log('=== FIN DIAG ===');
                    setEvaluaciones(sortEvals(normalized));
                    setLoading(false);
                }
            }).catch(err => {
                console.error('Error cargando evaluaciones:', err);
                if (!cancelled) setLoading(false);
            });

            const socket = getSocket();
            const onCreated = (e) => setEvaluaciones(prev => sortEvals([...prev, normalizeEval(e)]));
            const onUpdated = (e) => setEvaluaciones(prev => sortEvals(prev.map(x => x.id === e.id ? normalizeEval(e) : x)));
            const onDeleted = ({ id }) => setEvaluaciones(prev => prev.filter(x => x.id !== id));

            socket?.on('evaluaciones:created', onCreated);
            socket?.on('evaluaciones:updated', onUpdated);
            socket?.on('evaluaciones:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('evaluaciones:created', onCreated);
                socket?.off('evaluaciones:updated', onUpdated);
                socket?.off('evaluaciones:deleted', onDeleted);
            };
        }

        // Firebase original
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
            oa: data.oa || '',
            oaCodes: data.oaCodes || [],
            slots: data.slots || null,
            totalQuestions: data.questions.length,
            totalPoints: data.questions.reduce((s, q) => s + (q.puntaje ?? 1), 0),
            questions: data.questions,
            results: {},
            driveLink: data.driveLink || '',
            createdBy: data.createdBy,
            createdAt: new Date().toISOString(),
            status: 'pending',
        };

        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                const payload = {
                    title: doc.name,
                    subject: doc.asignatura,
                    grade: doc.curso,
                    date: doc.date,
                    data: {
                        oa: doc.oa,
                        oaCodes: doc.oaCodes,
                        slots: doc.slots,
                        totalQuestions: doc.totalQuestions,
                        totalPoints: doc.totalPoints,
                        questions: doc.questions,
                        results: doc.results,
                        driveLink: doc.driveLink,
                        createdBy: doc.createdBy,
                        status: doc.status,
                    },
                };
                console.log('Enviando evaluacion:', JSON.stringify(payload));
                const created = await apiClient.post('/evaluaciones', payload);
                const all = await apiClient.get('/evaluaciones');
                setEvaluaciones(sortEvals(all.map(normalizeEval)));
                toast.success('Evaluacion creada');
                return created.id;
            }

            // Firebase original
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
                updates.totalPoints = data.questions.reduce((s, q) => s + (q.puntaje ?? 1), 0);
            }
            if (data.selectedIndicadores !== undefined) {
                updates.selectedIndicadores = data.selectedIndicadores;
            }
            if (data.driveLink !== undefined) {
                updates.driveLink = data.driveLink;
            }
            if (data.exigencia !== undefined) {
                updates.exigencia = data.exigencia;
            }
            if (data.oa !== undefined) updates.oa = data.oa;
            if (data.oaCodes !== undefined) updates.oaCodes = data.oaCodes;
            if (data.slots !== undefined) updates.slots = data.slots;

            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, toSnakeCase(updates));
            } else {
                await updateDocument(COLLECTION, id, updates);
            }
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
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.delete(`/evaluaciones/${id}`);
            } else {
                await removeDocument(COLLECTION, id);
            }
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
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${evalId}`, {
                    [`results.${studentId}`]: answers,
                });
            } else {
                await updateDocument(COLLECTION, evalId, {
                    [`results.${studentId}`]: answers,
                });
            }
            return true;
        } catch (error) {
            console.error('Error guardando resultados:', error);
            toast.error('Error al guardar resultados');
            return false;
        }
    }, []);

    const approveEvaluacion = useCallback(async (id, approverInfo) => {
        const updates = {
            status: 'approved',
            approvedBy: approverInfo,
            approvalDate: new Date().toISOString(),
            rejectionReason: null,
            rejectedBy: null,
        };
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, toSnakeCase(updates));
                const all = await apiClient.get('/evaluaciones');
                setEvaluaciones(sortEvals(all.map(normalizeEval)));
            } else {
                await updateDocument(COLLECTION, id, updates);
            }
            toast.success('Evaluacion aprobada');
            return true;
        } catch (error) {
            console.error('Error aprobando evaluacion:', error);
            toast.error('Error al aprobar evaluacion');
            return false;
        }
    }, []);

    const rejectEvaluacion = useCallback(async (id, reason, approverInfo) => {
        const updates = {
            status: 'rejected',
            rejectionReason: sanitizeText(reason),
            rejectedBy: approverInfo,
        };
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, toSnakeCase(updates));
                const all = await apiClient.get('/evaluaciones');
                setEvaluaciones(sortEvals(all.map(normalizeEval)));
            } else {
                await updateDocument(COLLECTION, id, updates);
            }
            toast.success('Evaluacion rechazada');
            return true;
        } catch (error) {
            console.error('Error rechazando evaluacion:', error);
            toast.error('Error al rechazar evaluacion');
            return false;
        }
    }, []);

    const duplicateEvaluacion = useCallback(async (id, userInfo) => {
        const original = evaluaciones.find(e => e.id === id);
        if (!original) return null;
        const doc = {
            name: `[Copia] ${original.name}`,
            curso: original.curso,
            asignatura: original.asignatura,
            date: '',
            totalQuestions: original.totalQuestions,
            totalPoints: original.totalPoints,
            questions: (original.questions || []).map(q => ({ ...q })),
            results: {},
            driveLink: '',
            createdBy: userInfo,
            createdAt: new Date().toISOString(),
            status: 'pending',
            copiedFrom: id,
            exigencia: original.exigencia ?? 60,
            oa: original.oa ?? '',
            selectedIndicadores: original.selectedIndicadores ?? {},
        };
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                const payload = {
                    title: doc.name,
                    subject: doc.asignatura,
                    grade: doc.curso,
                    date: doc.date,
                    data: {
                        oa: doc.oa,
                        oaCodes: doc.oaCodes,
                        totalQuestions: doc.totalQuestions,
                        totalPoints: doc.totalPoints,
                        questions: doc.questions,
                        results: doc.results,
                        driveLink: doc.driveLink,
                        createdBy: doc.createdBy,
                        status: doc.status,
                        copiedFrom: doc.copiedFrom,
                        exigencia: doc.exigencia,
                        selectedIndicadores: doc.selectedIndicadores,
                    },
                };
                const created = await apiClient.post('/evaluaciones', payload);
                const all = await apiClient.get('/evaluaciones');
                setEvaluaciones(sortEvals(all.map(normalizeEval)));
                toast.success('Evaluación duplicada');
                return created.id;
            }

            // Firebase original
            const created = await createDocument(COLLECTION, doc);
            toast.success('Evaluación duplicada');
            return created.id;
        } catch (error) {
            console.error('Error duplicando evaluacion:', error);
            toast.error('Error al duplicar evaluación');
            return null;
        }
    }, [evaluaciones]);

    const addComment = useCallback(async (evalId, comment) => {
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                const ev = evaluaciones.find(e => e.id === evalId);
                const updatedComments = [...(ev?.comments || []), comment];
                await apiClient.patch(`/evaluaciones/${evalId}`, { comments: updatedComments });
            } else {
                await updateDocument(COLLECTION, evalId, { comments: arrayUnion(comment) });
            }
            return true;
        } catch {
            toast.error('Error al guardar comentario');
            return false;
        }
    }, [evaluaciones]);

    const resubmitEvaluacion = useCallback(async (id) => {
        const updates = {
            status: 'pending',
            rejectionReason: null,
            rejectedBy: null,
        };
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, toSnakeCase(updates));
                const all = await apiClient.get('/evaluaciones');
                setEvaluaciones(sortEvals(all.map(normalizeEval)));
            } else {
                await updateDocument(COLLECTION, id, updates);
            }
            toast.success('Evaluacion reenviada para revision');
            return true;
        } catch (error) {
            console.error('Error reenviando evaluacion:', error);
            toast.error('Error al reenviar evaluacion');
            return false;
        }
    }, []);

    const submitTeacherEdit = useCallback(async (id, changes, submitter) => {
        const updates = {
            pendingChanges: {
                ...changes,
                submittedBy: submitter,
                submittedAt: new Date().toISOString(),
            },
        };
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, toSnakeCase(updates));
            } else {
                await updateDocument(COLLECTION, id, updates);
            }
            toast.success('Cambios enviados para aprobación');
            return true;
        } catch (error) {
            console.error('Error enviando cambios:', error);
            toast.error('Error al enviar cambios');
            return false;
        }
    }, []);

    const approvePendingChanges = useCallback(async (id, pending) => {
        try {
            const updates = { pendingChanges: null };
            if (pending.name !== undefined) updates.name = pending.name;
            if (pending.date !== undefined) updates.date = pending.date;
            if (pending.oa !== undefined) updates.oa = pending.oa;
            if (pending.oaCodes !== undefined) updates.oaCodes = pending.oaCodes;
            if (pending.slots !== undefined) updates.slots = pending.slots;

            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, toSnakeCase(updates));
            } else {
                await updateDocument(COLLECTION, id, updates);
            }
            toast.success('Cambios aprobados');
            return true;
        } catch (error) {
            console.error('Error aprobando cambios:', error);
            toast.error('Error al aprobar cambios');
            return false;
        }
    }, []);

    const rejectPendingChanges = useCallback(async (id) => {
        try {
            if (FLAGS.USE_NEW_API_EVALUACIONES) {
                await apiClient.patch(`/evaluaciones/${id}`, { pending_changes: null });
            } else {
                await updateDocument(COLLECTION, id, { pendingChanges: null });
            }
            toast.success('Cambios rechazados');
            return true;
        } catch (error) {
            console.error('Error rechazando cambios:', error);
            toast.error('Error al rechazar cambios');
            return false;
        }
    }, []);

    const value = React.useMemo(() => ({
        evaluaciones,
        loading,
        addEvaluacion,
        updateEvaluacion,
        deleteEvaluacion,
        duplicateEvaluacion,
        saveResults,
        approveEvaluacion,
        rejectEvaluacion,
        resubmitEvaluacion,
        addComment,
        submitTeacherEdit,
        approvePendingChanges,
        rejectPendingChanges,
    }), [evaluaciones, loading, addEvaluacion, updateEvaluacion, deleteEvaluacion, duplicateEvaluacion, saveResults, approveEvaluacion, rejectEvaluacion, resubmitEvaluacion, addComment, submitTeacherEdit, approvePendingChanges, rejectPendingChanges]);

    return (
        <EvaluacionesContext.Provider value={value}>
            {children}
        </EvaluacionesContext.Provider>
    );
};

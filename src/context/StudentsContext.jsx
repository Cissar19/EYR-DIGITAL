import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { validateRequiredString, sanitizeText, sanitizeName } from '../lib/validation';
import { parseCSV, validateRut, formatRut } from '../lib/csvParser';
import { orderBy } from 'firebase/firestore';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const StudentsContext = createContext();
const COLLECTION = 'students';

const normalizeStudent = (s) => ({
    ...s,
    fullName: s.full_name ?? s.fullName ?? '',
    firstName: s.first_name ?? s.firstName ?? '',
    paternalLastName: s.paternal_last_name ?? s.paternalLastName ?? '',
    maternalLastName: s.maternal_last_name ?? s.maternalLastName ?? '',
    birthDate: s.birth_date ?? s.birthDate ?? '',
    guardianName: s.guardian_name ?? s.guardianName ?? '',
    guardianPhone: s.guardian_phone ?? s.guardianPhone ?? '',
    guardianEmail: s.guardian_email ?? s.guardianEmail ?? '',
    importedFromSige: s.imported_from_sige ?? s.importedFromSige ?? false,
});

const toSnakeCase = (obj) => {
    const map = {
        fullName: 'full_name',
        firstName: 'first_name',
        paternalLastName: 'paternal_last_name',
        maternalLastName: 'maternal_last_name',
        birthDate: 'birth_date',
        guardianName: 'guardian_name',
        guardianPhone: 'guardian_phone',
        guardianEmail: 'guardian_email',
        importedFromSige: 'imported_from_sige',
    };
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[map[key] || key] = value;
    }
    return result;
};

export function StudentsProvider({ children }) {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (FLAGS.USE_NEW_API_STUDENTS) {
            let cancelled = false;
            apiClient.get('/students').then(data => {
                if (!cancelled) {
                    setStudents(data.map(normalizeStudent));
                    setLoading(false);
                }
            }).catch(err => {
                console.error('Error cargando students:', err);
                if (!cancelled) setLoading(false);
            });

            const socket = getSocket();
            const onCreated = (s) => setStudents(prev => [...prev, normalizeStudent(s)]);
            const onUpdated = (s) => setStudents(prev => prev.map(x => x.id === s.id ? normalizeStudent(s) : x));
            const onDeleted = ({ id }) => setStudents(prev => prev.filter(x => x.id !== id));

            socket?.on('students:created', onCreated);
            socket?.on('students:updated', onUpdated);
            socket?.on('students:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('students:created', onCreated);
                socket?.off('students:updated', onUpdated);
                socket?.off('students:deleted', onDeleted);
            };
        }

        // Firebase original
        const unsubscribe = subscribeToCollection(COLLECTION, (docs) => {
            setStudents(docs);
            setLoading(false);
        }, orderBy('fullName'));
        return () => unsubscribe();
    }, []);

    const canWrite = useCallback(() => {
        return user && ['convivencia', 'admin', 'super_admin'].includes(user.role);
    }, [user]);

    const addStudent = useCallback(async (data) => {
        if (!canWrite()) {
            toast.error('Sin permisos para agregar alumnos');
            return null;
        }

        validateRequiredString(data.rut, 'RUT');
        if (!validateRut(data.rut)) {
            throw new Error('RUT invalido');
        }

        validateRequiredString(data.firstName, 'Nombre');
        validateRequiredString(data.paternalLastName, 'Apellido paterno');

        // Check duplicate
        const rut = formatRut(data.rut);
        const existing = students.find(s => s.rut === rut);
        if (existing) {
            throw new Error(`Ya existe un alumno con RUT ${rut}`);
        }

        const fullName = [data.firstName, data.paternalLastName, data.maternalLastName]
            .filter(Boolean)
            .map(s => s.trim())
            .join(' ');

        const doc = {
            rut,
            firstName: sanitizeName(data.firstName),
            paternalLastName: sanitizeName(data.paternalLastName),
            maternalLastName: sanitizeName(data.maternalLastName || ''),
            fullName: sanitizeName(fullName),
            curso: sanitizeText(data.curso || ''),
            birthDate: data.birthDate || '',
            guardianName: sanitizeName(data.guardianName || ''),
            guardianPhone: sanitizeText(data.guardianPhone || ''),
            guardianEmail: sanitizeText(data.guardianEmail || ''),
            notes: '',
            importedFromSige: false,
        };

        try {
            if (FLAGS.USE_NEW_API_STUDENTS) {
                const created = await apiClient.post('/students', toSnakeCase(doc));
                const all = await apiClient.get('/students');
                setStudents(all.map(normalizeStudent));
                toast.success(`Alumno ${fullName} agregado`);
                return created;
            }

            // Firebase original
            const result = await createDocument(COLLECTION, doc);
            toast.success(`Alumno ${fullName} agregado`);
            return result;
        } catch (error) {
            console.error('Error agregando alumno:', error);
            toast.error('Error al agregar alumno');
            return null;
        }
    }, [canWrite, students]);

    const updateStudent = useCallback(async (id, data) => {
        if (!canWrite()) {
            toast.error('Sin permisos para editar alumnos');
            return;
        }

        const updates = {};
        if (data.firstName !== undefined) updates.firstName = sanitizeName(data.firstName);
        if (data.paternalLastName !== undefined) updates.paternalLastName = sanitizeName(data.paternalLastName);
        if (data.maternalLastName !== undefined) updates.maternalLastName = sanitizeName(data.maternalLastName);
        if (data.curso !== undefined) updates.curso = sanitizeText(data.curso);
        if (data.birthDate !== undefined) updates.birthDate = data.birthDate;
        if (data.guardianName !== undefined) updates.guardianName = sanitizeName(data.guardianName);
        if (data.guardianPhone !== undefined) updates.guardianPhone = sanitizeText(data.guardianPhone);
        if (data.guardianEmail !== undefined) updates.guardianEmail = sanitizeText(data.guardianEmail);
        if (data.notes !== undefined) updates.notes = sanitizeText(data.notes);

        // Rebuild fullName if name parts changed
        if (data.firstName !== undefined || data.paternalLastName !== undefined || data.maternalLastName !== undefined) {
            const current = students.find(s => s.id === id);
            const fn = data.firstName ?? current?.firstName ?? '';
            const pln = data.paternalLastName ?? current?.paternalLastName ?? '';
            const mln = data.maternalLastName ?? current?.maternalLastName ?? '';
            updates.fullName = [fn, pln, mln].filter(Boolean).map(s => s.trim()).join(' ');
        }

        if (FLAGS.USE_NEW_API_STUDENTS) {
            await apiClient.patch(`/students/${id}`, toSnakeCase(updates));
        } else {
            await updateDocument(COLLECTION, id, updates);
        }
        toast.success('Alumno actualizado');
    }, [canWrite, students]);

    const deleteStudent = useCallback(async (id) => {
        if (!canWrite()) {
            toast.error('Sin permisos para eliminar alumnos');
            return;
        }
        if (FLAGS.USE_NEW_API_STUDENTS) {
            await apiClient.delete(`/students/${id}`);
        } else {
            await removeDocument(COLLECTION, id);
        }
        toast.success('Alumno eliminado');
    }, [canWrite]);

    const importStudentsFromCSV = useCallback(async (csvText) => {
        if (!canWrite()) {
            toast.error('Sin permisos para importar alumnos');
            return { imported: 0, skipped: 0, errors: [] };
        }

        const { students: parsed, errors } = parseCSV(csvText);

        if (parsed.length === 0) {
            return { imported: 0, skipped: 0, errors: errors.length > 0 ? errors : ['No se encontraron alumnos validos'] };
        }

        // Detect duplicates by RUT
        const existingRuts = new Set(students.map(s => s.rut));
        const toImport = [];
        const skippedDuplicates = [];

        for (const s of parsed) {
            if (existingRuts.has(s.rut)) {
                skippedDuplicates.push(s.rut);
            } else {
                toImport.push(s);
                existingRuts.add(s.rut); // prevent duplicates within the import itself
            }
        }

        let imported = 0;
        const importErrors = [...errors];

        for (const s of toImport) {
            try {
                if (FLAGS.USE_NEW_API_STUDENTS) {
                    await apiClient.post('/students', toSnakeCase({
                        ...s,
                        notes: '',
                        importedFromSige: true,
                    }));
                } else {
                    await createDocument(COLLECTION, {
                        ...s,
                        notes: '',
                        importedFromSige: true,
                    });
                }
                imported++;
            } catch (err) {
                importErrors.push(`Error importando ${s.rut}: ${err.message}`);
            }
        }

        if (FLAGS.USE_NEW_API_STUDENTS && imported > 0) {
            const all = await apiClient.get('/students');
            setStudents(all.map(normalizeStudent));
        }

        if (imported > 0) {
            toast.success(`${imported} alumnos importados`);
        }

        return {
            imported,
            skipped: skippedDuplicates.length,
            errors: importErrors,
        };
    }, [canWrite, students]);

    const getStudentByRut = useCallback((rut) => {
        const formatted = formatRut(rut);
        return students.find(s => s.rut === formatted) || null;
    }, [students]);

    const value = React.useMemo(() => ({
        students,
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsFromCSV,
        getStudentByRut,
    }), [students, loading, addStudent, updateStudent, deleteStudent, importStudentsFromCSV, getStudentByRut]);

    return (
        <StudentsContext.Provider value={value}>
            {children}
        </StudentsContext.Provider>
    );
}

export function useStudents() {
    return useContext(StudentsContext);
}

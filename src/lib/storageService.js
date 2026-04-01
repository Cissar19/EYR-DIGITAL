import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { fetchDocument, setDocument } from './firestoreService';

/**
 * Sube una imagen de pregunta a Firebase Storage.
 * Ruta: evaluaciones/{evalId}/preguntas/q{qNum}.{ext}
 * @returns {{ url: string, storagePath: string }}
 */
export async function uploadPreguntaImagen(evaluacionId, questionNumber, file) {
    const raw = file.name.split('.').pop().toLowerCase();
    const ext = /^(jpg|jpeg|png|gif|webp)$/.test(raw) ? raw : 'jpg';
    const path = `evaluaciones/${evaluacionId}/preguntas/q${questionNumber}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, storagePath: path };
}

/**
 * Elimina una imagen de pregunta de Firebase Storage.
 * @param {string} storagePath
 */
export async function deletePreguntaImagen(storagePath) {
    try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
    } catch (e) {
        // Ignorar si el archivo ya no existe
        if (e.code !== 'storage/object-not-found') throw e;
    }
}

/**
 * Devuelve el aspect ratio (width/height) de una imagen dado su src (URL o dataURL).
 * @param {string} src
 * @returns {Promise<number>}
 */
export function getImageAspectRatio(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1);
        img.onerror = () => resolve(1);
        img.src = src;
    });
}

// ── Plantilla de prueba (guardada en Firestore como base64) ───────────────────
// Firebase Storage no está disponible en este proyecto, así que guardamos el
// .docx directamente en Firestore. Los archivos de plantilla son pequeños
// (~20-60 KB), dentro del límite de 1 MB por documento de Firestore.

const PLANTILLA_DOC = ['app_config', 'utp_plantilla_docx'];

/**
 * Convierte un File a string base64.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // quitar "data:...;base64,"
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Sube una plantilla .docx guardándola como base64 en Firestore.
 * Devuelve el string base64 (lo usamos directamente al exportar).
 * @param {File} file
 * @returns {Promise<string>} base64
 */
export async function uploadPlantilla(file) {
    const base64 = await fileToBase64(file);
    const sizeKB = Math.round((base64.length * 3) / 4 / 1024);
    if (sizeKB > 900) {
        throw new Error(`El archivo pesa ~${sizeKB} KB y supera el límite de 900 KB. Usa una plantilla más simple.`);
    }
    await setDocument(...PLANTILLA_DOC, { base64 }, { merge: false });
    return base64;
}

/**
 * Recupera el base64 de la plantilla activa, o null si no existe.
 * @returns {Promise<string|null>}
 */
export async function getPlantillaBase64() {
    try {
        const doc = await fetchDocument(...PLANTILLA_DOC);
        return doc?.base64 || null;
    } catch {
        return null;
    }
}

/**
 * Elimina la plantilla activa de Firestore.
 */
export async function deletePlantilla() {
    await setDocument(...PLANTILLA_DOC, { base64: null }, { merge: false });
}

import { fetchDocument, setDocument } from './firestoreService';

const MAX_IMG_WIDTH = 900;
const IMG_QUALITY   = 0.75;

/**
 * Redimensiona y comprime una imagen client-side, devuelve dataURL base64.
 * No usa Firebase Storage — la imagen se almacena directamente en Firestore.
 * @returns {{ url: string, storagePath: null, aspectRatio: number }}
 */
export function uploadPreguntaImagen(_evalId, _qNum, file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let w = img.naturalWidth, h = img.naturalHeight;
            if (w > MAX_IMG_WIDTH) { h = Math.round(h * MAX_IMG_WIDTH / w); w = MAX_IMG_WIDTH; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve({ url: canvas.toDataURL('image/jpeg', IMG_QUALITY), storagePath: null, aspectRatio: w / h });
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo leer la imagen')); };
        img.src = objectUrl;
    });
}

/**
 * No-op: las imágenes base64 no requieren borrado en Storage.
 */
// eslint-disable-next-line no-unused-vars
export async function deletePreguntaImagen(_storagePath) { /* noop — imágenes en base64 no requieren borrado */ }

/**
 * Devuelve el aspect ratio (width/height) de una imagen dado su src.
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

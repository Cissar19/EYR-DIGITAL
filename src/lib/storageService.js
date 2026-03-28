import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

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

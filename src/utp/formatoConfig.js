import { fetchDocument, setDocument } from '../lib/firestoreService';

export const FORMATO_DOC = ['app_config', 'utp_formato'];

export const DEFAULT_FORMATO = {
    instruccionesGenerales: 'Lee atentamente cada pregunta. Responde con letra clara y ordenada.',
    titulosPorTipo: {
        seleccion_multiple: 'SELECCIÓN MÚLTIPLE',
        desarrollo:         'DESARROLLO',
        verdadero_falso:    'VERDADERO O FALSO',
        unir:               'UNIR CON FLECHAS',
        completar:          'COMPLETAR',
    },
    instruccionesPorTipo: {
        seleccion_multiple: 'Marca con una X la alternativa correcta.',
        desarrollo:         'Responde con letra clara y ordenada.',
        verdadero_falso:    'Escribe V si es verdadero o F si es falso según corresponda.',
        unir:               'Une con una línea cada concepto de la columna A con su definición en la columna B.',
        completar:          'Completa los espacios en blanco con la palabra o frase correcta.',
    },
};

export function mergeWithDefaults(data) {
    return {
        instruccionesGenerales: data?.instruccionesGenerales ?? DEFAULT_FORMATO.instruccionesGenerales,
        titulosPorTipo:        { ...DEFAULT_FORMATO.titulosPorTipo,        ...(data?.titulosPorTipo        || {}) },
        instruccionesPorTipo:  { ...DEFAULT_FORMATO.instruccionesPorTipo,  ...(data?.instruccionesPorTipo  || {}) },
    };
}

export async function cargarFormato() {
    try {
        const data = await fetchDocument(...FORMATO_DOC);
        return mergeWithDefaults(data);
    } catch {
        return { ...DEFAULT_FORMATO };
    }
}

export async function guardarFormato(config, user) {
    await setDocument(...FORMATO_DOC, {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: { id: user?.uid, name: user?.displayName || user?.name || '' },
    }, { merge: false });
}

/**
 * Centralized input validation for Firestore writes.
 * All validation functions throw on invalid input.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TEXT_LENGTH = 500;
const MAX_NAME_LENGTH = 100;

export function validateDate(value, fieldName = 'fecha') {
    if (!value || typeof value !== 'string' || !DATE_REGEX.test(value)) {
        throw new Error(`${fieldName} invalida (formato YYYY-MM-DD)`);
    }
    const d = new Date(value + 'T12:00:00');
    if (isNaN(d.getTime())) {
        throw new Error(`${fieldName} invalida`);
    }
}

export function validateRequiredString(value, fieldName, maxLength = MAX_TEXT_LENGTH) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${fieldName} es requerido`);
    }
    if (value.length > maxLength) {
        throw new Error(`${fieldName} no puede exceder ${maxLength} caracteres`);
    }
}

export function validateUserId(value) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('userId es requerido');
    }
    if (value.length > 128) {
        throw new Error('userId invalido');
    }
}

export function validatePositiveNumber(value, fieldName) {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (typeof num !== 'number' || isNaN(num) || num < 0) {
        throw new Error(`${fieldName} debe ser un numero positivo`);
    }
    return num;
}

export function validateEnum(value, allowed, fieldName) {
    if (!allowed.includes(value)) {
        throw new Error(`${fieldName} invalido: ${value}`);
    }
}

export function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, MAX_TEXT_LENGTH);
}

export function sanitizeName(value) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, MAX_NAME_LENGTH);
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://10.10.56.33/api';

function getToken() {
    return localStorage.getItem('eyr_token');
}

async function request(method, path, body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (res.status === 401) {
        localStorage.removeItem('eyr_token');
        window.location.href = '/login';
        return;
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error en la solicitud');
    }

    return res.json();
}

export const apiClient = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
};
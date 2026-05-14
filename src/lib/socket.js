import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
    const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://10.10.56.33';

    socket = io(URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('Socket conectado'));
    socket.on('disconnect', () => console.log('Socket desconectado'));

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) socket.disconnect();
}

import admin from 'firebase-admin';

function initAdmin() {
    if (admin.apps.length) return;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Faltan variables de entorno FIREBASE_ADMIN_*');
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
    });
}

// Accept any snake_case role key (hardcoded + custom roles created by admins)
const ROLE_FORMAT = /^[a-z][a-z0-9_]{0,49}$/;

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        initAdmin();
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        return res.status(500).json({ error: error.message });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const { uid, role } = req.body || {};

    if (!uid || !role) {
        return res.status(400).json({ error: 'Faltan campos requeridos (uid, role)' });
    }

    if (!ROLE_FORMAT.test(role)) {
        return res.status(400).json({ error: `Formato de rol inválido: ${role}` });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);

        // Use custom claim if available, fall back to Firestore for users without claims yet
        let callerRole = decoded.role;
        if (!callerRole) {
            const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
            callerRole = callerDoc.exists ? callerDoc.data().role : null;
        }

        if (callerRole !== 'super_admin' && callerRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para modificar roles' });
        }

        await admin.auth().setCustomUserClaims(uid, { role });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error syncing role claim:', error);

        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'Usuario no encontrado en Authentication' });
        }
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}

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

export default async function handler(req, res) {
    // Always return JSON
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
    const { uid, newPassword } = req.body || {};

    if (!uid || !newPassword) {
        return res.status(400).json({ error: 'Faltan campos requeridos (uid, newPassword)' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // Verify the caller's ID token
        const decoded = await admin.auth().verifyIdToken(idToken);
        const callerUid = decoded.uid;

        // Always read role from Firestore (source of truth). Claims can be stale
        // for up to 1 hour after a role change, causing false permission denials.
        const callerDoc = await admin.firestore().doc(`users/${callerUid}`).get();
        if (!callerDoc.exists) {
            return res.status(403).json({ error: 'Usuario no encontrado en Firestore' });
        }
        const callerRole = callerDoc.data().role;

        if (callerRole !== 'super_admin' && callerRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para cambiar contraseñas' });
        }

        // Update the target user's password in Firebase Auth
        await admin.auth().updateUser(uid, { password: newPassword });

        // Save reference in Firestore on the target user's doc (direct read by uid)
        const targetRef = admin.firestore().doc(`users/${uid}`);
        const targetDoc = await targetRef.get();
        if (targetDoc.exists) {
            await targetRef.update({
                lastSetPassword: newPassword,
                passwordSetAt: new Date().toISOString(),
                passwordSetBy: callerUid,
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error setting user password:', error);

        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'Usuario no encontrado en Authentication' });
        }
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}

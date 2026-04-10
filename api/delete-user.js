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
    const { uid } = req.body || {};

    if (!uid) {
        return res.status(400).json({ error: 'Falta campo requerido (uid)' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const callerUid = decoded.uid;

        // Use custom claim if available, fall back to Firestore
        let callerRole = decoded.role;
        if (!callerRole) {
            const callerDoc = await admin.firestore().doc(`users/${callerUid}`).get();
            if (!callerDoc.exists) {
                return res.status(403).json({ error: 'Usuario no encontrado en Firestore' });
            }
            callerRole = callerDoc.data().role;
        }

        if (callerRole !== 'super_admin' && callerRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para eliminar usuarios' });
        }

        if (uid === callerUid) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // Delete from Firebase Auth
        try {
            await admin.auth().deleteUser(uid);
        } catch (authError) {
            if (authError.code !== 'auth/user-not-found') {
                throw authError;
            }
            // Auth user already gone — continue to delete Firestore doc
        }

        // Delete Firestore document
        await admin.firestore().doc(`users/${uid}`).delete();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);

        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}

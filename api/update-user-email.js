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
    const { uid, newEmail } = req.body || {};

    if (!uid || !newEmail) {
        return res.status(400).json({ error: 'Faltan campos requeridos (uid, newEmail)' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const callerUid = decoded.uid;

        // Check caller's role in Firestore
        const callerDoc = await admin.firestore()
            .collection('users')
            .where('uid', '==', callerUid)
            .limit(1)
            .get();

        if (callerDoc.empty) {
            return res.status(403).json({ error: 'Usuario no encontrado en Firestore' });
        }

        const callerRole = callerDoc.docs[0].data().role;
        if (callerRole !== 'super_admin' && callerRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para cambiar correos' });
        }

        // Update email in Firebase Auth
        await admin.auth().updateUser(uid, { email: newEmail });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating user email:', error);

        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'Usuario no encontrado en Authentication' });
        }
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: 'Ese correo ya está en uso por otro usuario' });
        }
        if (error.code === 'auth/invalid-email') {
            return res.status(400).json({ error: 'Correo inválido' });
        }

        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}

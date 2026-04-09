/**
 * Vercel serverless function: recupera un usuario que existe en Firebase Auth
 * pero no tiene documento en Firestore. Le asigna una nueva contraseña temporal
 * y retorna { uid, tempPassword } para que el admin pueda crear el doc de Firestore.
 *
 * POST /api/recover-orphaned-user
 * Body: { email }
 * Auth: Bearer <idToken> (debe ser admin o super_admin)
 */
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

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
function generateTempPassword() {
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += CHARS[Math.floor(Math.random() * CHARS.length)];
    return pwd;
}

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try { initAdmin(); } catch (e) {
        return res.status(500).json({ error: e.message });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token no proporcionado' });

    const idToken = authHeader.split('Bearer ')[1];
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Falta email' });

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        let callerRole = decoded.role;
        if (!callerRole) {
            const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
            callerRole = callerDoc.exists ? callerDoc.data().role : null;
        }
        if (callerRole !== 'super_admin' && callerRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        const authUser = await admin.auth().getUserByEmail(email);
        const tempPassword = generateTempPassword();
        await admin.auth().updateUser(authUser.uid, { password: tempPassword });

        return res.status(200).json({ uid: authUser.uid, tempPassword });
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'No existe ningún usuario con ese correo' });
        }
        return res.status(500).json({ error: error.message });
    }
}

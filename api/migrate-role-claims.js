/**
 * One-time migration: reads all users from Firestore and sets their
 * Firebase Auth custom claims with their role.
 *
 * Call once after deploying the custom-claims architecture.
 * Protected: only callable by super_admin (verified via Firestore since
 * no claims exist yet during migration).
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

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);

        // During migration, claims may not exist yet — use Firestore as source of truth
        const callerDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
        if (!callerDoc.exists || callerDoc.data().role !== 'super_admin') {
            return res.status(403).json({ error: 'Solo super_admin puede ejecutar la migración' });
        }

        // Read all users from Firestore in batches
        let migrated = 0;
        let failed = 0;
        const errors = [];

        const snapshot = await admin.firestore().collection('users').get();

        const tasks = snapshot.docs.map(async (doc) => {
            const { uid, role } = doc.data();
            if (!uid || !role) return;

            try {
                await admin.auth().setCustomUserClaims(uid, { role });
                migrated++;
            } catch (err) {
                failed++;
                errors.push({ uid, error: err.message });
            }
        });

        await Promise.all(tasks);

        console.log(`Migration complete: ${migrated} migrated, ${failed} failed`);

        return res.status(200).json({ success: true, migrated, failed, errors });
    } catch (error) {
        console.error('Error during migration:', error);

        if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}

import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const TEST_EMAIL = 'manuel.test@escuela.cl';
const TEST_PASSWORD = 'test1234';
const TEST_NAME = 'Manuel Profesor Test';
const TEST_ROLE = 'teacher';

// Admin credentials to write to Firestore (needs admin role for security rules)
const ADMIN_EMAIL = 'dev@plataforma.cl';
const ADMIN_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;

// Step 1: Create the Auth account for the test user
const tempApp = initializeApp(firebaseConfig, 'temp-create');
const tempAuth = getAuth(tempApp);

let uid;
try {
    const cred = await createUserWithEmailAndPassword(tempAuth, TEST_EMAIL, TEST_PASSWORD);
    uid = cred.user.uid;
    console.log('✅ Auth creado, uid:', uid);
} catch (e) {
    if (e.code === 'auth/email-already-in-use') {
        const cred = await signInWithEmailAndPassword(tempAuth, TEST_EMAIL, TEST_PASSWORD);
        uid = cred.user.uid;
        console.log('⚠️  Auth ya existía, uid:', uid);
    } else {
        console.error('❌ Error Auth:', e.message);
        process.exit(1);
    }
}
await deleteApp(tempApp);

// Step 2: Sign in as admin to write the Firestore profile
const adminApp = initializeApp(firebaseConfig, 'admin-session');
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

try {
    await signInWithEmailAndPassword(adminAuth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin autenticado');

    await setDoc(doc(adminDb, 'users', uid), {
        uid,
        name: TEST_NAME,
        email: TEST_EMAIL,
        role: TEST_ROLE,
        avatar: null,
        hoursUsed: 0,
        createdAt: new Date().toISOString()
    });

    console.log(`\n✅ Usuario profesor creado:`);
    console.log(`   📧 Email: ${TEST_EMAIL}`);
    console.log(`   🔑 Clave: ${TEST_PASSWORD}`);
    console.log(`   👤 Rol:   ${TEST_ROLE}`);
    console.log(`   🆔 UID:   ${uid}\n`);
} catch (err) {
    console.error('❌ Error Firestore:', err.message);
} finally {
    await deleteApp(adminApp);
    process.exit(0);
}

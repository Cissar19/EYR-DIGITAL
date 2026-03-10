import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, updateEmail, updatePassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
    try {
        console.log("1. Iniciando sesion con la cuenta antigua...");
        const credential = await signInWithEmailAndPassword(auth, "ccontrerasr@eduhuechuraba.cl", "123456");
        const user = credential.user;
        const uid = user.uid;

        console.log("2. Actualizando correo a adm.ernestoyanez@eduhuechuraba.cl...");
        await updateEmail(user, "adm.ernestoyanez@eduhuechuraba.cl");

        console.log("3. Actualizando contraseña a jota40C1. ...");
        await updatePassword(user, "jota40C1.");

        console.log("4. Sincronizando nuevo correo en Firestore...");
        await updateDoc(doc(db, "users", uid), {
            email: "adm.ernestoyanez@eduhuechuraba.cl"
        });

        console.log("✨ CREDENCIALES CAMBIADAS EXITOSAMENTE EN BASE DE DATOS.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main();

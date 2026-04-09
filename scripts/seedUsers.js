/**
 * Seed script: Creates users in Firebase Auth AND writes profiles to Firestore
 * Run with: node --env-file=.env scripts/seedUsers.js
 *
 * Requires in .env:
 *   SEED_DEFAULT_PASSWORD  — contraseña inicial para usuarios nuevos
 *   SEED_ADMIN_EMAIL       — email de super_admin ya existente en Firestore
 *   SEED_ADMIN_PASSWORD    — su contraseña (para autenticar Firestore writes)
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'SEED_DEFAULT_PASSWORD',
    'SEED_ADMIN_EMAIL',
    'SEED_ADMIN_PASSWORD',
];

const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
    console.error('   Ejecuta con: node --env-file=.env scripts/seedUsers.js');
    process.exit(1);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const USERS = [
    // --- Roles administrativos ---
    { name: "Soporte Plataforma", email: "dev@plataforma.cl", role: "super_admin" },
    { name: "Damaris Contreras", email: "adm.ernestoyanez@eduhuechuraba.cl", role: "super_admin" },
    { name: "Director General", email: "director@eduhuechuraba.cl", role: "director" },
    { name: "Jefa UTP", email: "utp@eduhuechuraba.cl", role: "utp_head" },
    { name: "Inspector General", email: "inspectoria@eduhuechuraba.cl", role: "inspector" },
    // --- Printer ---
    { name: "Encargado Impresiones (EYR)", email: "impresiones@eduhuechuraba.cl", role: "printer" },
    // --- Staff ---
    { name: "Claudia Marcela Araneda Núñez", email: "caranedan@eduhuechuraba.cl", role: "staff" },
    { name: "Valentina Patricia Araya Vega", email: "varayav@eduhuechuraba.cl", role: "staff" },
    { name: "Claudia Andrea Arriagada Arriagada", email: "carriagadaa@eduhuechuraba.cl", role: "staff" },
    { name: "Nicole Andrea Bernales Córdova", email: "nbernalesc@eduhuechuraba.cl", role: "staff" },
    { name: "Francisca Javiera Cano Arancibia", email: "fcanoa@eduhuechuraba.cl", role: "staff" },
    { name: "Natalia Cardona Ayala", email: "ncardonaa@eduhuechuraba.cl", role: "staff" },
    { name: "Paola Isabel Cerda Reyes", email: "pcerdar@eduhuechuraba.cl", role: "staff" },
    { name: "Patricia Andrea Contador Díaz", email: "pcontadord@eduhuechuraba.cl", role: "staff" },
    { name: "Pablo Vicente Contreras Romero", email: "pcontrerasr@eduhuechuraba.cl", role: "staff" },
    { name: "Javiera Belén Contreras Vergara", email: "jcontrerasv@eduhuechuraba.cl", role: "staff" },
    { name: "Jennifer Andrea Cortés Oyanedel", email: "jcorteso@eduhuechuraba.cl", role: "staff" },
    { name: "María Gabriela Denordenflycht Valdés", email: "mdenordenflychv@eduhuechuraba.cl", role: "staff" },
    { name: "Alejandra Del Carmen Estay Curín", email: "aestayc@eduhuechuraba.cl", role: "staff" },
    { name: "Amaro Joel Farías Araneda", email: "afariasa@eduhuechuraba.cl", role: "staff" },
    { name: "Nicolette Patricia Flores Norambuena", email: "nfloresn@eduhuechuraba.cl", role: "staff" },
    { name: "Jenny De Las Mercedes Fuentes Peralta", email: "jfuentesp@eduhuechuraba.cl", role: "staff" },
    { name: "Patricia Verónica Gomara Márquez", email: "pgomaram@eduhuechuraba.cl", role: "staff" },
    { name: "Lazy Valeska Guerrero Monardes", email: "lguerrerom@eduhuechuraba.cl", role: "staff" },
    { name: "Olivia Del Carmen Hermosilla Mesina", email: "ohermosillam@eduhuechuraba.cl", role: "staff" },
    { name: "Alejandra Paola Lagos González", email: "alagosg@eduhuechuraba.cl", role: "staff" },
    { name: "Segundo Gerónimo Levio Colimán", email: "slevioc@eduhuechuraba.cl", role: "staff" },
    { name: "Sandra Judith Lillo Parra", email: "slillop@eduhuechuraba.cl", role: "staff" },
    { name: "Francisca Isidora Navarrete Torres", email: "fnavarrett@eduhuechuraba.cl", role: "staff" },
    { name: "Sandra Del Carmen Maldonado Romo", email: "smaldonador@eduhuechuraba.cl", role: "staff" },
    { name: "Yasna Estrella Manzo Silva", email: "ymanzos@eduhuechuraba.cl", role: "staff" },
    { name: "Luis Alberto Moya Catrileo", email: "lmoyac@eduhuechuraba.cl", role: "staff" },
    { name: "María Valentina Orellana Torres", email: "morellanat@eduhuechuraba.cl", role: "staff" },
    { name: "Michelle Lorena Páez Olguín", email: "mpaezo@eduhuechuraba.cl", role: "staff" },
    { name: "Andrea Paz Páez Rojas", email: "apaezr@eduhuechuraba.cl", role: "staff" },
    { name: "Camila Alejandra Pérez Guardia", email: "cperezg@eduhuechuraba.cl", role: "staff" },
    { name: "Nicole Constanza Pizarro Ordoñez", email: "npizarroo@eduhuechuraba.cl", role: "staff" },
    { name: "Karla Francisca Reyes Guillén", email: "kreyesg@eduhuechuraba.cl", role: "staff" },
    { name: "María Alejandra Riquelme Lemus", email: "mriquelmel@eduhuechuraba.cl", role: "staff" },
    { name: "María Isabel Rivera Muñoz", email: "mriveram@eduhuechuraba.cl", role: "staff" },
    { name: "Andrea Del Pilar Ruiz Chaparro", email: "aruizc@eduhuechuraba.cl", role: "staff" },
    { name: "Ramón Exequiel Sánchez Sepúlveda", email: "rsanchezs@eduhuechuraba.cl", role: "staff" },
    { name: "Manuel René Sandoval González", email: "msandovalg@eduhuechuraba.cl", role: "staff" },
    { name: "Caterine Elizabeth Silva Sotelo", email: "csilvas@eduhuechuraba.cl", role: "staff" },
    { name: "Macarena Del Pilar Valdés Lielmil", email: "mvaldesl@eduhuechuraba.cl", role: "staff" },
    { name: "Carolina Vanessa Venegas Soto", email: "cvenegass@eduhuechuraba.cl", role: "staff" },
    { name: "Jacqueline Olga Vidal Escanilla", email: "jvidale@eduhuechuraba.cl", role: "staff" },
    { name: "Yarixa Yovana Villenas Lillo", email: "yvillenasl@eduhuechuraba.cl", role: "staff" },
    { name: "Polett Elizabeth Zenteno Tobar", email: "pzentenot@eduhuechuraba.cl", role: "staff" },
    // --- Docentes ---
    { name: "Daniela Paz Alvarado Vera", email: "dalvaradov@eduhuechuraba.cl", role: "teacher" },
    { name: "Claudia Jazmín Araya Bustos", email: "carayab@eduhuechuraba.cl", role: "teacher" },
    { name: "Manuel Alejandro Astudillo Figueroa", email: "mastudillof@eduhuechuraba.cl", role: "teacher" },
    { name: "Eduardo Alfonso Baeza González", email: "ebaezag@eduhuechuraba.cl", role: "teacher" },
    { name: "Jasmine Jesús Burgos Arce", email: "jburgosa@eduhuechuraba.cl", role: "teacher" },
    { name: "Corina del Pilar Camilo Torres", email: "ccamilot@eduhuechuraba.cl", role: "teacher" },
    { name: "Virna Deborah Caniupil Ortiz", email: "vcaniupilo@eduhuechuraba.cl", role: "teacher" },
    { name: "Melanie Aracelly Contreras Díaz", email: "mcontrerasd@eduhuechuraba.cl", role: "teacher" },
    { name: "Natalia Stephanie Díaz Pérez", email: "ndiazp@eduhuechuraba.cl", role: "teacher" },
    { name: "Juan Ricardo Figueroa Huinca", email: "jfigueroah@eduhuechuraba.cl", role: "teacher" },
    { name: "María Paz Flores Corvalán", email: "utp.ernestoyanez@eduhuechuraba.cl", role: "utp_head" },
    { name: "María Eugenia Fuentes Ávila", email: "mfuentesa@eduhuechuraba.cl", role: "teacher" },
    { name: "Álvaro Francisco Jara Barrientos", email: "ajarab@eduhuechuraba.cl", role: "teacher" },
    { name: "Belén Isabel Leal Moraga", email: "blealm@eduhuechuraba.cl", role: "teacher" },
    { name: "Marisol Camila Molina Vera", email: "mmolinav@eduhuechuraba.cl", role: "teacher" },
    { name: "Javiera Inés Morales Parra", email: "jmoralesp@eduhuechuraba.cl", role: "teacher" },
    { name: "Fernando Esteban Muñoz Orozco", email: "ernestoyanez@eduhuechuraba.cl", role: "teacher" },
    { name: "Pamela Andrea Olivero Figueroa", email: "poliverof@eduhuechuraba.cl", role: "teacher" },
    { name: "Carolina Angélica Parra Reyes", email: "cparrar@eduhuechuraba.cl", role: "teacher" },
    { name: "Francisco Javier Pérez Delgado", email: "fperezd@eduhuechuraba.cl", role: "teacher" },
    { name: "Claudia Alejandra Pincheira Galarce", email: "cpincheirag@eduhuechuraba.cl", role: "teacher" },
    { name: "Antonio Andrés Pinto Fuentes", email: "apintof@eduhuechuraba.cl", role: "teacher" },
    { name: "Karina Paulina Pozo Abaca", email: "pie.ernestoyanez@eduhuechuraba.cl", role: "teacher" },
    { name: "María José Silva Aránguiz", email: "msilvaa@eduhuechuraba.cl", role: "teacher" },
    { name: "Carla Francisca Torres Gumera", email: "ctorresg@eduhuechuraba.cl", role: "teacher" },
    { name: "Leslye Nathaly Valencia Ramos", email: "lvalenciar@eduhuechuraba.cl", role: "teacher" },
    { name: "Eva Constanza Vargas Retamal", email: "evargasr@eduhuechuraba.cl", role: "teacher" },
    { name: "Maximiliano Bahamondes", email: "mbahamondes@eduhuechuraba.cl", role: "teacher" },
    { name: "Filippa Leporati", email: "fleporati@eduhuechuraba.cl", role: "teacher" },
    { name: "Maria Elisa Venegas Bravo", email: "mvenegasb@eduhuechuraba.cl", role: "teacher" },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createUser(userData) {
    // Use a temporary app instance so Auth creates don't interfere with the admin session
    const tempApp = initializeApp(firebaseConfig, 'temp-' + Date.now() + '-' + Math.random());
    const tempAuth = getAuth(tempApp);

    try {
        let uid;
        let authCreated = false;

        try {
            const credential = await createUserWithEmailAndPassword(tempAuth, userData.email, DEFAULT_PASSWORD);
            uid = credential.user.uid;
            authCreated = true;
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                // User already exists in Auth — sign in with default password to get uid
                const credential = await signInWithEmailAndPassword(tempAuth, userData.email, DEFAULT_PASSWORD);
                uid = credential.user.uid;
            } else {
                throw authError;
            }
        }

        // Skip if Firestore profile already exists
        const existing = await getDoc(doc(db, 'users', uid));
        if (existing.exists()) {
            return { success: true, uid, authCreated: false, skipped: true };
        }

        // Write profile to Firestore authenticated as admin (primary app)
        await setDoc(doc(db, 'users', uid), {
            uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            avatar: null,
            hoursUsed: 0,
            createdAt: new Date().toISOString()
        });

        return { success: true, uid, authCreated };
    } catch (error) {
        return { success: false, reason: error.message };
    } finally {
        try { await deleteApp(tempApp); } catch (_) { }
    }
}

async function main() {
    console.log(`\n🚀 Creando ${USERS.length} usuarios en Auth + Firestore...\n`);
    console.log(`   Password por defecto: ${DEFAULT_PASSWORD}`);
    console.log(`   Admin: ${ADMIN_EMAIL}\n`);

    // Authenticate primary app as admin so Firestore writes are authorized
    try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log(`   ✅ Autenticado como ${ADMIN_EMAIL}\n`);
    } catch (err) {
        console.error(`   ❌ No se pudo autenticar como admin: ${err.message}`);
        process.exit(1);
    }

    let created = 0, skipped = 0, failed = 0;

    for (let i = 0; i < USERS.length; i++) {
        const u = USERS[i];
        const result = await createUser(u);

        if (result.success) {
            if (result.skipped) {
                console.log(`⏭️  [${i + 1}/${USERS.length}] ${u.name} — ya existe en Firestore`);
                skipped++;
            } else {
                const label = result.authCreated ? 'Auth+Firestore' : 'Firestore (Auth ya existía)';
                console.log(`✅ [${i + 1}/${USERS.length}] ${u.name} (${u.role}) — ${label} — uid: ${result.uid}`);
                created++;
            }
        } else {
            console.error(`❌ [${i + 1}/${USERS.length}] ${u.name}: ${result.reason}`);
            failed++;
        }
    }

    await signOut(auth);

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Creados/actualizados: ${created}`);
    console.log(`   ⏭️  Ya existían: ${skipped}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`\n✨ Seed completado!\n`);

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

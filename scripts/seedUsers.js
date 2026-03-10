/**
 * Seed script: Creates users in Firebase Auth AND writes profiles to Firestore
 * Run with: node scripts/seedUsers.js
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'SEED_DEFAULT_PASSWORD',
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

const USERS = [
    // --- Roles administrativos ---
    { name: "Soporte Plataforma", email: "dev@plataforma.cl", role: "super_admin" },
    { name: "Damaris Contreras", email: "adm.ernestoyanez@eduhuechuraba.cl", role: "super_admin" },
    { name: "Director General", email: "director@escuela.cl", role: "director" },
    { name: "Jefa UTP", email: "utp@escuela.cl", role: "utp_head" },
    { name: "Inspector General", email: "inspectoria@escuela.cl", role: "inspector" },
    // --- Printer ---
    { name: "Encargado Impresiones (EYR)", email: "impresiones@escuela.cl", role: "printer" },
    // --- Staff ---
    { name: "Claudia Marcela Araneda Núñez", email: "c.araneda@escuela.cl", role: "staff" },
    { name: "Valentina Patricia Araya Vega", email: "v.araya@escuela.cl", role: "staff" },
    { name: "Claudia Andrea Arriagada Arriagada", email: "c.arriagada@escuela.cl", role: "staff" },
    { name: "Nicole Andrea Bernales Córdova", email: "n.bernales@escuela.cl", role: "staff" },
    { name: "Francisca Javiera Cano Arancibia", email: "f.cano@escuela.cl", role: "staff" },
    { name: "Natalia Cardona Ayala", email: "n.cardona@escuela.cl", role: "staff" },
    { name: "Paola Isabel Cerda Reyes", email: "p.cerda@escuela.cl", role: "staff" },
    { name: "Patricia Andrea Contador Díaz", email: "p.contador@escuela.cl", role: "staff" },
    { name: "Pablo Vicente Contreras Romero", email: "p.contreras@escuela.cl", role: "staff" },
    { name: "Javiera Belén Contreras Vergara", email: "j.contreras@escuela.cl", role: "staff" },
    { name: "Jennifer Andrea Cortés Oyanedel", email: "j.cortes@escuela.cl", role: "staff" },
    { name: "María Gabriela Denordenflycht Valdés", email: "m.denordenflycht@escuela.cl", role: "staff" },
    { name: "Alejandra Del Carmen Estay Curín", email: "a.estay@escuela.cl", role: "staff" },
    { name: "Amaro Joel Farías Araneda", email: "a.farias@escuela.cl", role: "staff" },
    { name: "Nicolette Patricia Flores Norambuena", email: "n.flores@escuela.cl", role: "staff" },
    { name: "Jenny De Las Mercedes Fuentes Peralta", email: "j.fuentes@escuela.cl", role: "staff" },
    { name: "Patricia Verónica Gomara Márquez", email: "p.gomara@escuela.cl", role: "staff" },
    { name: "Lazy Valeska Guerrero Monardes", email: "l.guerrero@escuela.cl", role: "staff" },
    { name: "Olivia Del Carmen Hermosilla Mesina", email: "o.hermosilla@escuela.cl", role: "staff" },
    { name: "Alejandra Paola Lagos González", email: "a.lagos@escuela.cl", role: "staff" },
    { name: "Segundo Gerónimo Levio Colimán", email: "s.levio@escuela.cl", role: "staff" },
    { name: "Sandra Judith Lillo Parra", email: "s.lillo@escuela.cl", role: "staff" },
    { name: "Francisca Isidora Navarrete Torres", email: "f.navarrete@escuela.cl", role: "staff" },
    { name: "Sandra Del Carmen Maldonado Romo", email: "s.maldonado@escuela.cl", role: "staff" },
    { name: "Yasna Estrella Manzo Silva", email: "y.manzo@escuela.cl", role: "staff" },
    { name: "Luis Alberto Moya Catrileo", email: "l.moya@escuela.cl", role: "staff" },
    { name: "María Valentina Orellana Torres", email: "m.orellana@escuela.cl", role: "staff" },
    { name: "Michelle Lorena Páez Olguín", email: "m.paez@escuela.cl", role: "staff" },
    { name: "Andrea Paz Páez Rojas", email: "a.paez@escuela.cl", role: "staff" },
    { name: "Camila Alejandra Pérez Guardia", email: "c.perez@escuela.cl", role: "staff" },
    { name: "Nicole Constanza Pizarro Ordoñez", email: "n.pizarro@escuela.cl", role: "staff" },
    { name: "Karla Francisca Reyes Guillén", email: "k.reyes@escuela.cl", role: "staff" },
    { name: "María Alejandra Riquelme Lemus", email: "m.riquelme@escuela.cl", role: "staff" },
    { name: "María Isabel Rivera Muñoz", email: "m.rivera@escuela.cl", role: "staff" },
    { name: "Andrea Del Pilar Ruiz Chaparro", email: "a.ruiz@escuela.cl", role: "staff" },
    { name: "Ramón Exequiel Sánchez Sepúlveda", email: "r.sanchez@escuela.cl", role: "staff" },
    { name: "Manuel René Sandoval González", email: "m.sandoval@escuela.cl", role: "staff" },
    { name: "Caterine Elizabeth Silva Sotelo", email: "c.silva@escuela.cl", role: "staff" },
    { name: "Macarena Del Pilar Valdés Lielmil", email: "m.valdes@escuela.cl", role: "staff" },
    { name: "Carolina Vanessa Venegas Soto", email: "c.venegas@escuela.cl", role: "staff" },
    { name: "Jacqueline Olga Vidal Escanilla", email: "j.vidal@escuela.cl", role: "staff" },
    { name: "Yarixa Yovana Villenas Lillo", email: "y.villenas@escuela.cl", role: "staff" },
    { name: "Polett Elizabeth Zenteno Tobar", email: "p.zenteno@escuela.cl", role: "staff" },
    // --- Docentes ---
    { name: "Daniela Paz Alvarado Vera", email: "dalvaradov@eduhuechuraba.cl", role: "teacher" },
    { name: "Claudia Jazmín Araya Bustos", email: "cjarayab@eduhuechuraba.cl", role: "teacher" },
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
    { name: "Javiera Inés Morales Parra", email: "jmoralespa@eduhuechuraba.cl", role: "teacher" },
    { name: "Fernando Esteban Muñoz Orozco", email: "ernestoyanez@eduhuechuraba.cl", role: "teacher" },
    { name: "Pamela Andrea Olivero Figueroa", email: "poliverof@eduhuechuraba.cl", role: "teacher" },
    { name: "Carolina Angélica Parra Reyes", email: "cparra@eduhuechuraba.cl", role: "teacher" },
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
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createUser(userData) {
    // Use a temporary app instance to avoid signing out the previous user
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
                // User exists in Auth - sign in to get uid
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                const credential = await signInWithEmailAndPassword(tempAuth, userData.email, DEFAULT_PASSWORD);
                uid = credential.user.uid;
            } else {
                throw authError;
            }
        }

        // Write profile to Firestore (always, to ensure it exists)
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
        await deleteApp(tempApp);
    }
}

async function main() {
    console.log(`\n🚀 Creando ${USERS.length} usuarios en Auth + Firestore...\n`);
    console.log(`   Password por defecto: ${DEFAULT_PASSWORD}\n`);

    let created = 0, skipped = 0, failed = 0;

    for (let i = 0; i < USERS.length; i++) {
        const u = USERS[i];
        const result = await createUser(u);

        if (result.success) {
            const label = result.authCreated ? 'Auth+Firestore' : 'Firestore (Auth existia)';
            console.log(`✅ [${i + 1}/${USERS.length}] ${u.name} (${u.role}) - ${label} - uid: ${result.uid}`);
            created++;
        } else {
            console.error(`❌ [${i + 1}/${USERS.length}] ${u.name}: ${result.reason}`);
            failed++;
        }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`\n✨ Seed completado!\n`);

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

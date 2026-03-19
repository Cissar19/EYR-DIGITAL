import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
const snap = await getDocs(collection(db, 'teacher_hours'));

snap.forEach(doc => {
  const d = doc.data();
  if (d.name && d.name.toLowerCase().includes('jara')) {
    console.log('Nombre:', d.name);
    console.log('Schedule:', JSON.stringify(d.schedule, null, 2));
    console.log('---');
  }
});

await deleteApp(app);
process.exit(0);

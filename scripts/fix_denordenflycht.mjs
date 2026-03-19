import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
  const snap = await getDocs(collection(db, 'teacher_hours'));

  let found = false;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    if (d.name && d.name.toLowerCase().includes('denordenflycht')) {
      console.log(`Encontrado: "${d.name}" (id: ${docSnap.id})`);
      const newName = 'María Gabriela De Nordenflycht Valdés';
      await updateDoc(doc(db, 'teacher_hours', docSnap.id), { name: newName });
      console.log(`Actualizado a: "${newName}"`);
      found = true;
      break;
    }
  }

  if (!found) console.log('No se encontró registro con Denordenflycht');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await deleteApp(app);
  process.exit(0);
}

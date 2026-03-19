import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD9jMKGMctPNo2LYpQ9BS1W-MRMi8wTxYs',
  authDomain: 'eyr-digital.firebaseapp.com',
  projectId: 'eyr-digital',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, 'dev@plataforma.cl', process.env.SEED_DEFAULT_PASSWORD);
  const snap = await getDocs(collection(db, 'teacher_hours'));
  console.log(`teacher_hours tiene ${snap.size} registros:\n`);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`  - ${d.name}`);
  });
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await deleteApp(app);
  process.exit(0);
}

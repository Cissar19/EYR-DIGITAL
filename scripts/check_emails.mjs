import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD9jMKGMctPNo2LYpQ9BS1W-MRMi8wTxYs',
  authDomain: 'eyr-digital.firebaseapp.com',
  projectId: 'eyr-digital',
  storageBucket: 'eyr-digital.firebasestorage.app',
  messagingSenderId: '1079430330317',
  appId: '1:1079430330317:web:fc9c06702f8badd6de7684',
};

const ADMIN_EMAIL = 'dev@plataforma.cl';
const ADMIN_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  const snap = await getDocs(collection(db, 'users'));
  const noEdu = [];
  snap.forEach(doc => {
    const d = doc.data();
    const email = d.email || '';
    if (!email.endsWith('@eduhuechuraba.cl')) {
      noEdu.push({ name: d.name || '(sin nombre)', email: email || '(sin email)', role: d.role || '' });
    }
  });
  if (noEdu.length === 0) {
    console.log('Todos los usuarios tienen @eduhuechuraba.cl');
  } else {
    console.log(`Usuarios SIN @eduhuechuraba.cl (${noEdu.length}):\n`);
    noEdu.forEach(u => console.log(`  - ${u.name} | ${u.email} | ${u.role}`));
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await deleteApp(app);
  process.exit(0);
}

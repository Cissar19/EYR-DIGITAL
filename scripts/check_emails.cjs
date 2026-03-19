const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyD9jMKGMctPNo2LYpQ9BS1W-MRMi8wTxYs',
  authDomain: 'eyr-digital.firebaseapp.com',
  projectId: 'eyr-digital',
});
const db = getFirestore(app);

(async () => {
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
    console.log('Usuarios SIN @eduhuechuraba.cl (' + noEdu.length + '):');
    noEdu.forEach(u => console.log('  - ' + u.name + ' | ' + u.email + ' | ' + u.role));
  }
  process.exit(0);
})();

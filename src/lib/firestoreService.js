import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetch all documents from a collection
 * @param {string} collectionName
 * @param {Array} queryConstraints - optional orderBy, where, etc.
 * @returns {Promise<Array>}
 */
export async function fetchCollection(collectionName, ...queryConstraints) {
    const ref = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(ref, ...queryConstraints) : ref;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch a single document by ID
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<Object|null>}
 */
export async function fetchDocument(collectionName, docId) {
    const ref = doc(db, collectionName, docId);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/**
 * Create a new document (auto-generated ID)
 * @param {string} collectionName
 * @param {Object} data
 * @returns {Promise<Object>} - created doc with id
 */
export async function createDocument(collectionName, data) {
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
}

/**
 * Update an existing document
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 */
export async function updateDocument(collectionName, docId, data) {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    });
}

/**
 * Delete a document
 * @param {string} collectionName
 * @param {string} docId
 */
export async function removeDocument(collectionName, docId) {
    const ref = doc(db, collectionName, docId);
    await deleteDoc(ref);
}

/**
 * Set a document (create or overwrite) with a specific ID
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 * @param {Object} options - { merge: true } for partial updates
 */
export async function setDocument(collectionName, docId, data, options = {}) {
    const ref = doc(db, collectionName, docId);
    await setDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    }, options);
}

/**
 * Subscribe to a collection in real-time
 * @param {string} collectionName
 * @param {Function} callback - receives array of documents
 * @param {Array} queryConstraints - optional orderBy, where, etc.
 * @returns {Function} unsubscribe function
 */
export function subscribeToCollection(collectionName, callback, ...queryConstraints) {
    const ref = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(ref, ...queryConstraints) : ref;
    return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(docs);
    }, (error) => {
        console.error(`Error subscribing to ${collectionName}:`, error);
    });
}

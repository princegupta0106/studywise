import { db } from './config'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  onSnapshot,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore'

// New separate chat system collection: 'gcs' (group-chats)
// Each chat is represented by a single document at `gcs/{gcId}` with a `messages` array.
// This keeps reads to a single document (per subscription) instead of many message docs.

export async function createGcForCourse(courseId) {
  const col = collection(db, 'gcs')
  const docRef = await addDoc(col, {
    courseId: courseId || null,
    createdAt: serverTimestamp(),
    messages: []
  })
  return docRef.id
}

export async function createGcIfMissingForCourse(courseId) {
  // Look for existing gc with this courseId
  const col = collection(db, 'gcs')
  const q = query(col, where('courseId', '==', courseId), limit(1))
  const snap = await getDocs(q)
  if (!snap.empty) return snap.docs[0].id
  return await createGcForCourse(courseId)
}

export async function sendGcMessage(gcId, { email, name, text, createdAt }) {
  if (!gcId) throw new Error('gcId required')
  const chatRef = doc(db, 'gcs', gcId)
  
  // Simplified message structure: only email, name, text, and timestamp
  const message = {
    email: email || null,
    name: name || 'Anonymous',
    text: text || '',
    createdAt: createdAt || new Date().toISOString()
  }

  // Ensure the document exists; if not, create it with the initial message.
  const snap = await getDoc(chatRef)
  if (!snap.exists()) {
    await setDoc(chatRef, { 
      courseId: null, 
      createdAt: serverTimestamp(), 
      messages: [message], 
      lastUpdated: serverTimestamp() 
    })
    return true
  }

  // Append message and update lastUpdated server-side
  await updateDoc(chatRef, {
    messages: arrayUnion(message),
    lastUpdated: serverTimestamp()
  })

  return true
}

export function subscribeToGcMessages(gcId, callback) {
  if (!gcId) return () => {}
  const chatRef = doc(db, 'gcs', gcId)
  const unsub = onSnapshot(chatRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }
    const data = snapshot.data() || {}
    const messages = data.messages || []
    callback(messages)
  }, (err) => {
    console.error('subscribeToGcMessages error', err)
  })
  return unsub
}

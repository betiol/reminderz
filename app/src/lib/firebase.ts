import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getDatabase, ref, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const messaging = getMessaging(app)
const database = getDatabase(app)

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return userCredential.user
  } catch (error: any) {
    console.error('Erro ao fazer login:', error)
    throw error
  }
}

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    return userCredential.user
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error)
    throw error
  }
}

export const logoutUser = async () => {
  try {
    await signOut(auth)
    return true
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error)
    throw error
  }
}

export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export const getCurrentUserToken = async () => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Usuário não autenticado')
  }
  return await user.getIdToken()
}

export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      if (typeof messaging === 'undefined') {
        console.error('O objeto messaging não foi definido');
        return null;
      }
      
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      return token;
    } else {
      console.log('Permissão de notificação negada');
      return null;
    }
  } catch (error) {
    console.error('Erro ao solicitar permissão para notificações:', error);
  }
}

export const setupNotificationListener = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    callback(payload)
  })
}

export const listenToNotificationCount = (
  userId: string,
  callback: (count: number) => void
) => {
  const notificationCountRef = ref(
    database,
    `notifications/${userId}/unreadCount`
  )
  return onValue(notificationCountRef, (snapshot) => {
    const count = snapshot.val() || 0
    callback(count)
  })
}

export const listenToTaskCounters = (
  userId: string,
  callback: (data: any) => void
) => {
  const taskCountersRef = ref(database, `tasks/${userId}`)
  return onValue(taskCountersRef, (snapshot) => {
    const data = snapshot.val() || {
      todayCount: 0,
      todayCompleted: 0,
      overdueCount: 0
    }
    callback(data)
  })
}

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      )
      console.log('Service Worker registrado com sucesso:', registration)
      return registration
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error)
      throw error
    }
  } else {
    console.log('Service Worker não suportado neste navegador')
    return null
  }
}

export { auth, messaging, database }

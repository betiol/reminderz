
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


let firebaseApp = null;

export const initializeFirebase = () => {
  try {
    
    if (firebaseApp) {
      
      return firebaseApp;
    }
    
    
    let options = {};
    
    if (process.env.FIREBASE_DATABASE_URL) {
      options.databaseURL = process.env.FIREBASE_DATABASE_URL;
    }
    
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      path.join(__dirname, '../firebase-credentials.json'),
      path.join(__dirname, 'firebase-credentials.json'),
      path.join(process.cwd(), 'firebase-credentials.json'),
      path.join(process.cwd(), 'config/firebase-credentials.json')
    ].filter(Boolean); 
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      
      firebaseApp = admin.initializeApp(options);
      
      return firebaseApp;
    }
    
    
    for (const credPath of possiblePaths) {
      try {
        if (fs.existsSync(credPath)) {
          
          options.credential = admin.credential.cert(credPath);
          firebaseApp = admin.initializeApp(options);
          
          return firebaseApp;
        }
      } catch (err) {
        
      }
    }
    
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        options.credential = admin.credential.cert(serviceAccount);
        firebaseApp = admin.initializeApp(options);
        
        return firebaseApp;
      } catch (jsonError) {
        console.error('Erro ao analisar JSON da variável FIREBASE_SERVICE_ACCOUNT:', jsonError);
        
        throw jsonError;
      }
    }
    
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      
      try {
        firebaseApp = admin.initializeApp();
        
        return firebaseApp;
      } catch (defaultError) {
        console.error('Erro na inicialização padrão:', defaultError);
      }
    }
    
    throw new Error('Não foi possível inicializar o Firebase: nenhuma credencial válida encontrada');
    
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    
    if (process.env.NODE_ENV === 'development') {
      
      firebaseApp = { isMock: true };
      return firebaseApp;
    }
    throw error;
  }
};



export const auth = () => {
  if (!firebaseApp) {
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Erro ao inicializar Firebase para auth():', error);
      if (process.env.NODE_ENV === 'development') {
        return createMockAuth();
      }
      throw error;
    }
  }
  
  if (firebaseApp.isMock) {
    return createMockAuth();
  }
  
  return admin.auth();
};

export const realtimeDB = () => {
  if (!firebaseApp) {
    try {
      initializeFirebase();
    } catch (error) {
      console.error('Erro ao inicializar Firebase para realtimeDB():', error);
      if (process.env.NODE_ENV === 'development') {
        return createMockDatabase();
      }
      throw error;
    }
  }
  
  if (firebaseApp.isMock) {
    return createMockDatabase();
  }
  
  return admin.database();
};

export const messaging = () => {
  if (!firebaseApp) {
    try {
      initializeFirebase();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return createMockMessaging();
      }
      throw error;
    }
  }
  
  if (firebaseApp.isMock) {
    return createMockMessaging();
  }
  
  return admin.messaging();
};


function createMockAuth() {
  return {
    verifyIdToken: () => Promise.resolve({ uid: 'mock-uid', email: 'mock@example.com' }),
    createUser: () => Promise.resolve({ uid: 'new-mock-uid' }),
    getUser: () => Promise.resolve({ uid: 'mock-uid', email: 'mock@example.com' })
  };
}

function createMockDatabase() {
  return {
    ref: (path) => ({
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      push: () => Promise.resolve({ key: 'mock-key' }),
      on: () => {},
      off: () => {},
      once: () => Promise.resolve({ val: () => ({}) })
    })
  };
}

function createMockMessaging() {
  return {
    send: () => Promise.resolve('mock-message-id'),
    sendMulticast: () => Promise.resolve({ 
      successCount: 1, 
      failureCount: 0,
      responses: [{ success: true }]
    })
  };
}

export default {
  initializeFirebase,
  auth,
  realtimeDB,
  messaging
};
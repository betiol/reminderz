



importScripts(
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js'
)



firebase.initializeApp({
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  databaseURL: '',
})

const messaging = firebase.messaging()


messaging.onBackgroundMessage((payload) => {
  console.log('Recebida mensagem em segundo plano:', payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png', 
    badge: '/icons/badge-96x96.png', 
    tag: payload.data?.notificationId || 'default', 
    data: payload.data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})


self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event)

  
  event.notification.close()

  
  const notificationData = event.notification.data

  
  let urlToOpen = '/'

  if (notificationData) {
    if (notificationData.type === 'task_reminder' && notificationData.taskId) {
      
      urlToOpen = `/tasks/${notificationData.taskId}`
    } else {
      
      urlToOpen = '/notifications'
    }
  }

  
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }

        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

# reminderz - Task Management Application

reminderz is a complete task and reminder management application that uses modern technologies to provide a real-time, efficient, and user-friendly experience.

## Features

- **Task Management**: Organize your tasks by categories, dates, and priorities
- **Automatic Reminders**: Receive notifications before task deadlines
- **Responsive UI**: Intuitive interface that works on any device
- **Real-time Notifications**: Instant updates via Firebase
- **Secure Authentication**: Simple and secure login with Firebase Auth
- **Offline Mode**: Access your tasks even without connection (in development)

## Technologies Used

### Frontend

- **React**: Library for building interfaces
- **Vite**: Fast build tool for development
- **TypeScript**: Static typing for JavaScript
- **Tailwind CSS**: Utility CSS framework
- **shadcn/ui**: Reusable UI components
- **Firebase Client SDK**: Authentication and real-time data

### Backend

- **Node.js**: JavaScript runtime environment
- **Express**: Minimalist web framework
- **MongoDB**: NoSQL database
- **Firebase Admin SDK**: Authentication and push notifications
- **Google Cloud Pub/Sub**: Messaging for asynchronous processing
- **Google Cloud Scheduler**: Task scheduling

## Architecture

```
                       ┌───────────────────┐
                       │  React Frontend   │
                       │   (Vite + React)  │
                       └─────────┬─────────┘
                                 │
                                 ▼
┌────────────────┐      ┌─────────────────┐      ┌───────────────┐
│  Firebase Auth  │◄────►│  Node.js API    │◄────►│   MongoDB     │
└────────────────┘      │  (Express)      │      │  (Atlas)      │
         ▲              └────────┬────────┘      └───────────────┘
         │                       │
         │                       ▼
┌────────┴───────┐      ┌─────────────────┐      ┌───────────────┐
│ FCM / Firebase  │◄────►│  Google Pub/Sub │◄────►│ Cloud Scheduler│
│ Realtime DB     │      │                 │      │               │
└────────────────┘      └─────────────────┘      └───────────────┘
```

## How to Run

### Prerequisites

- Node.js 18+ installed
- MongoDB installed locally or access to a remote instance
- Firebase project configured (Auth, Realtime Database, Cloud Messaging)
- Google Cloud project configured (PubSub, Cloud Scheduler)

### Backend Setup

1. Clone the repository

   ```
   git clone https://github.com/your-username/reminder-app.git
   cd reminder-app/backend
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Configure the `.env` file in the backend root directory

   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/reminder_app
   GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project
   GOOGLE_CLOUD_LOCATION=us-central1
   TASK_QUEUE_NAME=tasks-reminders
   API_BASE_URL=http://localhost:5000
   INTERNAL_API_KEY=secret-key-for-internal-endpoints
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   ```

4. Add Firebase Admin credentials file

   - Download credentials from Firebase Console (Project Settings > Service Accounts > Generate New Private Key)
   - Save as `firebase-credentials.json` in the `config/` folder

5. Add Google Cloud credentials file

   - Create a service account in Google Cloud Console with appropriate permissions
   - Download the JSON key and save as `google-credentials.json` in the `config/` folder
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to this file

6. Start the backend server
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory

   ```
   cd ../frontend
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Configure the `.env.local` file in the frontend root directory

   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   VITE_FIREBASE_VAPID_KEY=your-vapid-key
   ```

4. Start the development server

   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

## Project Structure

### Backend

```
backend/
├── config/            # Configurations (DB, Firebase, PubSub)
├── controllers/       # REST controllers
├── middleware/        # Middlewares (auth, errors, etc.)
├── models/            # Mongoose models
├── routes/            # API routes
├── services/          # Business services
└── utils/             # Utility functions
```

### Frontend

```
frontend/
├── public/            # Static files
├── src/
│   ├── assets/        # Images and resources
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Libraries (Firebase, etc.)
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── types/         # Type definitions
│   └── utils/         # Utility functions
└── ...
```

## API Endpoints

### Authentication

- `POST /api/auth/session` - Create/update session after Firebase authentication
- `POST /api/auth/register-fcm-token` - Register token for push notifications
- `DELETE /api/auth/fcm-token` - Remove FCM token (logout)
- `PUT /api/auth/notification-preferences` - Update notification preferences

### Tasks

- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle-complete` - Toggle completion status
- `GET /api/tasks/stats` - Get task statistics

### Notifications

- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Good Practices Implemented

### Security

- Robust Firebase authentication
- Protection against common attacks (XSS, NoSQL Injection)
- Rate Limiting to prevent brute force attacks
- Data sanitization
- HTTPS (in production)

### Performance

- Response compression
- Pagination for large data sets
- Optimized MongoDB indexes
- Asynchronous processing with Pub/Sub
- Lazy loading of React components

### Scalability

- Modular architecture
- Stateless backend
- Messaging for decoupling
- NoSQL database for high availability
- Cloud Scheduler for distributed processing

## Contributions

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT license - see the LICENSE file for details.

## Contact

Nikollas - [nikollas@email.com](mailto:nikollas@email.com)

Project Link: [https://github.com/your-username/reminder-app](https://github.com/your-username/reminder-app)

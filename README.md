# Reminderz

A task management application with reminders and notifications.

## Project Structure

The project is organized as a monorepo with the following packages:

- `api`: Backend API service built with Node.js and Express
- `app`: Frontend application built with React and TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account (for authentication and notifications)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/betiol/reminderz.git
cd reminderz
```

2. Install dependencies for all packages:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `api` and `app` directories
   - Fill in the required environment variables

### Development

#### Backend (API)
```bash
cd api
npm run dev
```

#### Frontend (App)
```bash
cd app
npm run dev
```

## Features

- Task management with due dates and priorities
- Email and push notifications for task reminders
- User authentication with Firebase
- Responsive web interface
- RESTful API

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- Firebase Admin SDK
- Google Cloud Scheduler

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Firebase SDK

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
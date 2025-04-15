# Reservix - Progressive Web Application (PWA)

Reservix is a modern Progressive Web Application (PWA) designed for managing reservations. It provides a seamless user experience with features like user authentication, reservation management, and admin functionalities. Built using React, Firebase, and TailwindCSS, Reservix is optimized for both desktop and mobile devices.

---

## 🚀 Features

- **User Authentication**: Secure login and registration with email/password and Google authentication.
- **Reservation Management**: Create, edit, and cancel reservations with real-time validation.
- **Admin Panel**: Manage categories, products, and user roles with ease.
- **Interactive Map**: View product locations and routes using Leaflet and OpenStreetMap.
- **Responsive Design**: Optimized for all screen sizes.
- **Offline Support**: Leverages service workers for offline functionality.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Mapping**: Leaflet, Leaflet Routing Machine
- **PWA**: Service Workers, Manifest

---

## 📂 Project Structure

```
PSM-PWA/
├── pwa/
│   ├── public/                # Static assets and service worker
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   ├── contexts/          # Context API for state management
│   │   ├── firebase/          # Firebase configuration and utilities
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.tsx            # Main application entry point
│   │   ├── index.tsx          # React DOM rendering
│   └── tailwind.config.js     # TailwindCSS configuration
└── package.json               # Project dependencies and scripts
```

---

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/PSM-PWA.git
   cd PSM-PWA/pwa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project.
   - Add your Firebase configuration to `.env`:
     ```
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     ```

4. Start the development server:
   ```bash
   npm start
   ```

---

## 🖥️ Usage

- **User**:
  - Register or log in to access the app.
  - Create, view, and manage reservations.
  - View product locations and route on an interactive map.
  - View reservation history

- **Admin**:
  - Manage categories and products.
  - Assign roles to users.

---
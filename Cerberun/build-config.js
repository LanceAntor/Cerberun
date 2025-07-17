// Build-time configuration script for Vercel deployment
// This script generates the config.js file using environment variables

const fs = require('fs');
const path = require('path');

const configTemplate = `// Firebase Configuration - Generated at build time
const firebaseConfig = {
    apiKey: "${process.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY'}",
    authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN'}",
    projectId: "${process.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID'}",
    storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET'}",
    messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID'}",
    appId: "${process.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID'}",
    measurementId: "${process.env.VITE_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID'}"
};

// Debug: Log Firebase initialization
console.log('Initializing Firebase with project:', firebaseConfig.projectId);

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

// Initialize Firestore and make it globally available
try {
    const db = firebase.firestore();
    window.db = db; // Make db globally available
    console.log('Firestore initialized successfully');
} catch (error) {
    console.error('Firestore initialization failed:', error);
}
`;

// Write the config file
const configPath = path.join(__dirname, 'src', 'config.js');
fs.writeFileSync(configPath, configTemplate);

console.log('✅ Config file generated successfully');

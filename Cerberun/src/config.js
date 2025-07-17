// Firebase Configuration - Using Firebase public keys (safe for client-side)
// These are public configuration values, not secret keys
// Security is handled by Firestore security rules
const firebaseConfig = {
    apiKey: "AIzaSyCYazXoZnMeNYFwOydpqpOVIF1CS4eHgz4", // This is a public identifier, not a secret
    authDomain: "cerberun-leaderboard.firebaseapp.com",
    projectId: "cerberun-leaderboard",
    storageBucket: "cerberun-leaderboard.firebasestorage.app",
    messagingSenderId: "377867420913",
    appId: "1:377867420913:web:eb982b90fcc2cb835cd550",
    measurementId: "G-3Y1Y88EKZP"
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

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

// Global flag to track Firebase initialization
window.firebaseInitialized = false;
window.firebaseInitPromise = null;

// Debug: Log Firebase initialization
console.log('Initializing Firebase with project:', firebaseConfig.projectId);

// Function to initialize Firebase
function initializeFirebase() {
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase is already initialized
            if (window.firebaseInitialized) {
                resolve(window.db);
                return;
            }

            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized successfully');

            // Initialize Firestore
            const db = firebase.firestore();
            
            // Enable network for Firestore (important for Vercel)
            db.enableNetwork().then(() => {
                console.log('Firestore network enabled');
                window.db = db;
                window.firebaseInitialized = true;
                resolve(db);
            }).catch((error) => {
                console.error('Failed to enable Firestore network:', error);
                window.db = db; // Still set db even if network enable fails
                window.firebaseInitialized = true;
                resolve(db);
            });

        } catch (error) {
            console.error('Firebase initialization failed:', error);
            reject(error);
        }
    });
}

// Initialize Firebase immediately
window.firebaseInitPromise = initializeFirebase();

// Also expose db globally for immediate access
window.firebaseInitPromise.then((db) => {
    window.db = db;
    console.log('Firebase setup complete');
}).catch((error) => {
    console.error('Firebase setup failed:', error);
});

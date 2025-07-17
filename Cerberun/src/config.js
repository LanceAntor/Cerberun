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

// Debug: Log environment info
console.log('Environment:', {
    hostname: window.location.hostname,
    isProduction: window.location.hostname !== 'localhost',
    userAgent: navigator.userAgent.substring(0, 50)
});

// Debug: Log Firebase initialization
console.log('Starting Firebase initialization with project:', firebaseConfig.projectId);

// Function to initialize Firebase
function initializeFirebase() {
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase libraries are loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase library not loaded');
            }

            // Check if Firebase is already initialized
            if (window.firebaseInitialized) {
                console.log('Firebase already initialized');
                resolve(window.db);
                return;
            }

            console.log('Initializing Firebase app...');
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase app initialized successfully');

            console.log('Initializing Firestore...');
            // Initialize Firestore
            const db = firebase.firestore();
            
            // Set Firestore settings for better performance
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
            
            console.log('Firestore initialized, enabling network...');
            // Enable network for Firestore (important for Vercel)
            db.enableNetwork().then(() => {
                console.log('✅ Firestore network enabled successfully');
                window.db = db;
                window.firebaseInitialized = true;
                
                // Test connection with a simple read
                return db.collection('leaderboard').limit(1).get();
            }).then(() => {
                console.log('✅ Firebase connection test successful');
                resolve(db);
            }).catch((networkError) => {
                console.warn('⚠️ Firestore network enable failed, but continuing:', networkError);
                window.db = db; // Still set db even if network enable fails
                window.firebaseInitialized = true;
                resolve(db);
            });

        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            reject(error);
        }
    });
}

// Initialize Firebase when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing Firebase...');
        window.firebaseInitPromise = initializeFirebase();
    });
} else {
    console.log('DOM already loaded, initializing Firebase...');
    window.firebaseInitPromise = initializeFirebase();
}

// Also expose db globally for immediate access
if (window.firebaseInitPromise) {
    window.firebaseInitPromise.then((db) => {
        window.db = db;
        console.log('🚀 Firebase setup complete and ready');
        
        // Dispatch custom event to notify other scripts
        window.dispatchEvent(new CustomEvent('firebaseReady', { detail: { db } }));
    }).catch((error) => {
        console.error('💥 Firebase setup failed:', error);
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('firebaseError', { detail: { error } }));
    });
}

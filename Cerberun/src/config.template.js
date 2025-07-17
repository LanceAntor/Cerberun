// Firebase Configuration Template
// Copy this file to config.js and replace with your actual Firebase configuration
// These are public configuration values, not secret keys
// Security is handled by Firestore security rules

// FOR CERBERUN PROJECT: Replace with these actual values in your config.js:
// apiKey: "AIzaSyCYazXoZnMeNYFwOydpqpOVIF1CS4eHgz4"
// authDomain: "cerberun-leaderboard.firebaseapp.com"
// projectId: "cerberun-leaderboard"
// storageBucket: "cerberun-leaderboard.firebasestorage.app"
// messagingSenderId: "377867420913"
// appId: "1:377867420913:web:eb982b90fcc2cb835cd550"
// measurementId: "G-3Y1Y88EKZP"

export const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY", // Replace with your Firebase API key
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Function to initialize Firebase
export function initializeFirebase() {
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase libraries are loaded with timeout
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds maximum wait
            
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined') {
                    // Firebase is available, proceed with initialization
                    proceedWithFirebaseInit(resolve, reject);
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error('Firebase library failed to load after 10 seconds'));
                        return;
                    }
                    // Wait 100ms and try again
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
            
        } catch (error) {
            reject(error);
        }
    });
}

function proceedWithFirebaseInit(resolve, reject) {
    try {
        // Check if Firebase is already initialized
        if (window.firebaseInitialized) {
            resolve(window.db);
            return;
        }

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Initialize Firestore
        const db = firebase.firestore();
        
        // Set Firestore settings for better performance
        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
        
        // Enable network for Firestore (important for Vercel)
        db.enableNetwork().then(() => {
            window.db = db;
            window.firebaseInitialized = true;
            
            // Test connection with a simple read
            return db.collection('leaderboard').limit(1).get();
        }).then(() => {
            resolve(db);
        }).catch((networkError) => {
            window.db = db; // Still set db even if network enable fails
            window.firebaseInitialized = true;
            resolve(db);
        });

    } catch (error) {
        reject(error);
    }
}

// Export Firebase initialization and setup functions
export function setupFirebase() {
    // Global flag to track Firebase initialization
    window.firebaseInitialized = false;
    window.firebaseInitPromise = null;

    // Function to handle Firebase promise result
    function handleFirebasePromise(promise) {
        promise.then((db) => {
            window.db = db;
            window.firebaseInitialized = true;
            
            // Dispatch custom event to notify other scripts
            window.dispatchEvent(new CustomEvent('firebaseReady', { detail: { db } }));
        }).catch((error) => {
            // Try once more after a delay
            setTimeout(() => {
                const retryPromise = initializeFirebase();
                window.firebaseInitPromise = retryPromise;
                
                retryPromise.then((db) => {
                    window.db = db;
                    window.firebaseInitialized = true;
                    window.dispatchEvent(new CustomEvent('firebaseReady', { detail: { db } }));
                }).catch((retryError) => {
                    window.dispatchEvent(new CustomEvent('firebaseError', { detail: { error: retryError } }));
                });
            }, 2000);
            
            // Dispatch error event for original failure
            window.dispatchEvent(new CustomEvent('firebaseError', { detail: { error } }));
        });
    }

    // Initialize Firebase
    window.firebaseInitPromise = initializeFirebase();
    handleFirebasePromise(window.firebaseInitPromise);

    // Global function to ensure Firebase is ready for external scripts
    window.ensureFirebaseReady = function() {
        return new Promise((resolve, reject) => {
            if (window.firebaseInitialized && window.db) {
                resolve(window.db);
                return;
            }
            
            if (window.firebaseInitPromise) {
                window.firebaseInitPromise.then(resolve).catch(reject);
            } else {
                // If no promise exists, create one
                window.firebaseInitPromise = initializeFirebase();
                handleFirebasePromise(window.firebaseInitPromise);
                window.firebaseInitPromise.then(resolve).catch(reject);
            }
        });
    };
} // Make db globally available

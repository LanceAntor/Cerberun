// Firebase Configuration - Using Firebase public keys (safe for client-side)
// These are public configuration values, not secret keys
// Security is handled by Firestore security rules
export const firebaseConfig = {
    apiKey: "AIzaSyCYazXoZnMeNYFwOydpqpOVIF1CS4eHgz4", // This is a public identifier, not a secret
    authDomain: "cerberun-leaderboard.firebaseapp.com",
    projectId: "cerberun-leaderboard",
    storageBucket: "cerberun-leaderboard.firebasestorage.app",
    messagingSenderId: "377867420913",
    appId: "1:377867420913:web:eb982b90fcc2cb835cd550",
    measurementId: "G-3Y1Y88EKZP"
};

// Function to initialize Firebase
export function initializeFirebase() {
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase libraries are loaded with timeout
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds maximum wait
            
            const checkFirebase = () => {
                console.log(`Firebase check attempt ${attempts + 1}/${maxAttempts}`);
                if (typeof firebase !== 'undefined') {
                    console.log('Firebase library detected, proceeding with initialization...');
                    // Firebase is available, proceed with initialization
                    proceedWithFirebaseInit(resolve, reject);
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        console.error('Firebase library failed to load after 10 seconds');
                        reject(new Error('Firebase library failed to load after 10 seconds'));
                        return;
                    }
                    // Wait 100ms and try again
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            reject(error);
        }
    });
}

function proceedWithFirebaseInit(resolve, reject) {
    try {
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
}

// Export Firebase initialization and setup functions
export function setupFirebase() {
    console.log('Setting up Firebase...');
    
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

    // Function to handle Firebase promise result
    function handleFirebasePromise(promise) {
        promise.then((db) => {
            window.db = db;
            window.firebaseInitialized = true;
            console.log('🚀 Firebase setup complete and ready');
            
            // Dispatch custom event to notify other scripts
            window.dispatchEvent(new CustomEvent('firebaseReady', { detail: { db } }));
        }).catch((error) => {
            console.error('💥 Firebase setup failed:', error);
            
            // Try once more after a delay
            setTimeout(() => {
                console.log('🔄 Retrying Firebase initialization...');
                const retryPromise = initializeFirebase();
                window.firebaseInitPromise = retryPromise;
                
                retryPromise.then((db) => {
                    window.db = db;
                    window.firebaseInitialized = true;
                    console.log('🚀 Firebase setup complete on retry');
                    window.dispatchEvent(new CustomEvent('firebaseReady', { detail: { db } }));
                }).catch((retryError) => {
                    console.error('💥 Firebase retry failed:', retryError);
                    window.dispatchEvent(new CustomEvent('firebaseError', { detail: { error: retryError } }));
                });
            }, 2000);
            
            // Dispatch error event for original failure
            window.dispatchEvent(new CustomEvent('firebaseError', { detail: { error } }));
        });
    }

    // Initialize Firebase
    console.log('Starting Firebase initialization...');
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
}

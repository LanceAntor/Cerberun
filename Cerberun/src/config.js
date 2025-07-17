// Firebase Configuration - Safe placeholder values for GitHub
// Real values will be injected by build script on Vercel using environment variables
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-ABCDEF123"
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

# Firebase Setup Instructions for Cerberun Leaderboard

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "cerberun-leaderboard")
4. You can disable Google Analytics for this project (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode"
   - For test mode: Rules allow read/write for 30 days
   - For production mode: You'll need to configure security rules
4. Choose a location for your database (pick the closest to your users)
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Cerberun Web")
5. You'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 4: Set up Firebase Configuration

1. Copy the template file: 
   ```bash
   cp src/config.template.js src/config.js
   ```

2. Open `src/config.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-actual-project.firebaseapp.com", 
    projectId: "your-actual-project-id",
    storageBucket: "your-actual-project.firebasestorage.app",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id",
    measurementId: "your-actual-measurement-id"
};
```

**⚠️ IMPORTANT: Never commit the `src/config.js` file to version control as it contains sensitive API keys!**

## Step 5: Configure Firestore Security Rules (Optional but Recommended)

1. In Firebase Console, go to "Firestore Database" → "Rules"
2. For a public leaderboard, you can use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to leaderboard for everyone
    match /leaderboard/{document} {
      allow read: if true;
      allow write: if request.auth == null && 
        request.resource.data.keys().hasAll(['username', 'score', 'timestamp']) &&
        request.resource.data.username is string &&
        request.resource.data.username.size() <= 15 &&
        request.resource.data.score is number &&
        request.resource.data.score >= 0;
    }
  }
}
```

These rules allow:
- Anyone to read the leaderboard
- Anyone to write scores with proper validation
- Username must be a string ≤ 15 characters
- Score must be a positive number

## Step 6: Test Your Setup

1. Save your changes and refresh your game
2. Play a game and finish it
3. Check the browser console for any Firebase errors
4. Go to Firebase Console → Firestore Database to see if scores are being saved

## Features Included

✅ **Global Leaderboard**: Scores shared across all devices and players
✅ **Offline Support**: Falls back to localStorage when offline
✅ **Loading States**: Shows loading indicator while fetching scores
✅ **Error Handling**: Graceful fallback if Firebase is unavailable
✅ **Auto Cleanup**: Removes old entries to keep only top 10 scores
✅ **Real-time**: Leaderboard updates immediately when new scores are added

## Troubleshooting

**Firebase not defined error:**
- Make sure Firebase scripts are loaded before your main.js
- Check browser console for script loading errors

**Permission denied:**
- Check Firestore security rules
- Make sure your project ID is correct

**Scores not saving:**
- Check browser console for errors
- Verify your Firebase configuration
- Check internet connection

**Offline indicator showing:**
- This is normal when internet is unavailable
- Scores will sync when connection is restored

## Security Notes

- The current setup allows anonymous writes to prevent spam
- Consider adding rate limiting in production
- Monitor usage in Firebase Console to prevent abuse
- You can add user authentication later if needed

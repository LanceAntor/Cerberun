import { Player } from './player.js';
import { InputHandler } from './input.js';
import { Background } from './background.js';
import { FlyingEnemy, GroundEnemy, ClimbingEnemy, SmallSpiderEnemy, ZombieEnemy, SmallEnemyZombie} from './enemies.js';
import { UI } from './UI.js';
import { CollectibleManager, Clock, Heart } from './collectibles.js';
import { inject } from "@vercel/analytics";
import { setupFirebase } from './config.js';

// Initialize Firebase as soon as possible
setupFirebase();

// Firestore Leaderboard System
class LeaderboardManager {
    constructor() {
        this.collectionName = 'leaderboard';
        this.maxEntries = 10; // Increased for global leaderboard
        this.isOnline = navigator.onLine;
        this.firebaseReady = false;
        
        // Listen for Firebase ready event
        window.addEventListener('firebaseReady', () => {
            console.log('📡 LeaderboardManager: Firebase ready event received');
            this.firebaseReady = true;
        });
        
        window.addEventListener('firebaseError', (event) => {
            console.error('📡 LeaderboardManager: Firebase error event received', event.detail.error);
            this.firebaseReady = false;
        });
        
        // Check if Firebase is available immediately
        this.checkFirebaseConnection();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('📡 Network: Online');
            this.isOnline = true;
            this.checkFirebaseConnection();
        });
        window.addEventListener('offline', () => {
            console.log('📡 Network: Offline');
            this.isOnline = false;
        });
    }
    
    async checkFirebaseConnection() {
        try {
            // Wait for Firebase to be initialized with multiple retries
            let attempts = 0;
            const maxAttempts = 30; // 15 seconds maximum wait
            
            while ((!window.firebaseInitialized || !window.db) && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            if (!window.firebaseInitialized || !window.db) {
                this.firebaseReady = false;
                return;
            }
            
            // Try a simple read operation to test connection
            await window.db.collection(this.collectionName).limit(1).get();
            this.firebaseReady = true;
        } catch (error) {
            this.firebaseReady = false;
        }
    }
    
    async getLeaderboard() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            const snapshot = await window.db.collection(this.collectionName)
                .orderBy('score', 'desc')
                .limit(this.maxEntries)
                .get();
            
            const leaderboard = [];
            snapshot.forEach(doc => {
                leaderboard.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return leaderboard;
        } catch (error) {
            // Fallback to localStorage if Firestore fails
            return this.getLocalLeaderboard();
        }
    }
    
    async waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 60; // 30 seconds maximum wait
        
        while ((!window.firebaseInitialized || !window.db) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!window.firebaseInitialized || !window.db) {
            throw new Error('Firebase not ready after 30 seconds');
        }
    }
    
    getLocalLeaderboard() {
        try {
            const stored = localStorage.getItem('cerberun_leaderboard_backup');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading local leaderboard:', error);
            return [];
        }
    }
    
    saveLocalLeaderboard(leaderboard) {
        try {
            localStorage.setItem('cerberun_leaderboard_backup', JSON.stringify(leaderboard));
        } catch (error) {
            console.error('Error saving local leaderboard:', error);
        }
    }
    
    async addScore(username, score) {
        if (!username || username.trim() === '') {
            username = 'Anonymous';
        }
        
        const newEntry = {
            username: username.trim().substring(0, 15),
            score: score,
            timestamp: null, // Will be set after Firebase is ready
            date: new Date().toISOString()
        };
        
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Set the timestamp after Firebase is confirmed ready
            newEntry.timestamp = firebase.firestore.FieldValue.serverTimestamp();

            // Add to Firestore
            const docRef = await window.db.collection(this.collectionName).add(newEntry);
            
            // Get updated leaderboard to find rank
            const leaderboard = await this.getLeaderboard();
            
            // Also save to local storage as backup
            this.saveLocalLeaderboard(leaderboard);
            
            // Find rank
            const rank = leaderboard.findIndex(entry => entry.id === docRef.id) + 1;
            
            // Clean up old entries (keep only top entries)
            this.cleanupOldEntries();
            
            return rank > 0 ? rank : null;
            
        } catch (error) {
            // Fallback to local storage
            return this.addScoreLocal(username.trim().substring(0, 15), score);
        }
    }
    
    addScoreLocal(username, score) {
        const leaderboard = this.getLocalLeaderboard();
        const newEntry = {
            username: username,
            score: score,
            date: new Date().toISOString(),
            isLocal: true
        };
        
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
        const trimmed = leaderboard.slice(0, this.maxEntries);
        this.saveLocalLeaderboard(trimmed);
        
        const rank = trimmed.findIndex(entry => 
            entry.username === newEntry.username && 
            entry.score === newEntry.score &&
            entry.date === newEntry.date
        ) + 1;
        
        return rank > 0 ? rank : null;
    }
    
    async cleanupOldEntries() {
        try {
            // Get all entries ordered by score
            const snapshot = await window.db.collection(this.collectionName)
                .orderBy('score', 'desc')
                .get();
            
            // If we have more than maxEntries, delete the excess
            if (snapshot.size > this.maxEntries) {
                const batch = window.db.batch();
                const docs = snapshot.docs;
                
                // Delete entries beyond maxEntries (keep only top entries)
                for (let i = this.maxEntries; i < docs.length; i++) {
                    batch.delete(docs[i].ref);
                }
                
                await batch.commit();
            }
        } catch (error) {
            console.error('Error cleaning up old entries:', error);
        }
    }
    
    async isHighScore(score) {
        try {
            const leaderboard = await this.getLeaderboard();
            if (leaderboard.length < this.maxEntries) {
                return true;
            }
            return score > leaderboard[leaderboard.length - 1].score;
        } catch (error) {
            console.error('Error checking high score:', error);
            return true; // Assume it's a high score if we can't check
        }
    }
    
    async clearLeaderboard() {
        try {
            const batch = window.db.batch();
            const snapshot = await window.db.collection(this.collectionName).get();
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            localStorage.removeItem('cerberun_leaderboard_backup');
        } catch (error) {
            console.error('Error clearing leaderboard:', error);
        }
    }
}

// Comprehensive zoom prevention and console access blocking
document.addEventListener('DOMContentLoaded', function() {
    // Prevent zoom with keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Block zoom shortcuts
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
            e.preventDefault();
            return false;
        }
        
        // Block developer tools shortcuts
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') || // Chrome DevTools
            (e.ctrlKey && e.shiftKey && e.key === 'J') || // Chrome Console
            (e.ctrlKey && e.shiftKey && e.key === 'C') || // Chrome Element Inspector
            (e.ctrlKey && e.key === 'U') || // View Source
            (e.ctrlKey && e.shiftKey && e.key === 'K') || // Firefox Console
            (e.key === 'F7')) { // Caret browsing
            e.preventDefault();
            return false;
        }
    });

    // Prevent zoom with mouse wheel + ctrl/cmd
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });

    // Prevent pinch zoom on touch devices
    let lastTouchEnd = 0;
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Prevent drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });

    // Prevent selection of text
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });

    // Additional console blocking methods
    setInterval(function() {
        // Detect if developer tools are open
        let devtools = {
            open: false,
            orientation: null
        };
        
        let threshold = 160;
        setInterval(function() {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                devtools.open = true;
                // Redirect or close tab when dev tools detected
                window.location.href = 'about:blank';
            }
        }, 500);
    }, 1000);

    // Block common console access attempts
    Object.defineProperty(window, 'console', {
        value: Object.freeze({
            log: function() {},
            warn: function() {},
            error: function() {},
            info: function() {},
            debug: function() {},
            clear: function() {},
            dir: function() {},
            dirxml: function() {},
            table: function() {},
            trace: function() {},
            group: function() {},
            groupCollapsed: function() {},
            groupEnd: function() {},
            time: function() {},
            timeLog: function() {},
            timeEnd: function() {},
            profile: function() {},
            profileEnd: function() {},
            count: function() {},
            countReset: function() {},
            assert: function() {}
        }),
        writable: false,
        configurable: false
    });
});


window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    const startModal = document.getElementById('startModal');
    const startButton = document.getElementById('startButton');
    const gameOverModal = document.getElementById('gameOverModal');
    const playAgainButton = document.getElementById('playAgainButton');
    const settingsModal = document.getElementById('settingsModal');
    const continueButton = document.getElementById('continueButton');
    const restartButton = document.getElementById('restartButton');
    const musicToggle = document.getElementById('musicToggle');
    const soundToggle = document.getElementById('soundToggle');
    const finalScore = document.getElementById('finalScore');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.getElementById('loadingProgress');
    
    // Leaderboard elements
    const leaderboardModal = document.getElementById('leaderboardModal');
    const leaderboardButton = document.getElementById('leaderboardButton');
    const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
    const leaderboardList = document.getElementById('leaderboardList');
    const usernameInput = document.getElementById('usernameInput');
    const gameOverLeaderboardButton = document.getElementById('gameOverLeaderboardButton');
    
    // Button sound elements
    const buttonClickSound = document.getElementById('buttonClickSound');
    const buttonHoverSound = document.getElementById('buttonHoverSound');
    
    // Stage sound elements
    const stage1Sound = document.getElementById('stage1Sound');
    const stage2Sound = document.getElementById('stage2Sound');
    const stage3Sound = document.getElementById('stage3Sound');
    const stage4Sound = document.getElementById('stage4Sound');
    const stage5Sound = document.getElementById('stage5Sound');
    
    // Initialize leaderboard manager
    const leaderboardManager = new LeaderboardManager();
    
    // Give Firebase plenty of time to initialize before checking connection
    setTimeout(() => {
        leaderboardManager.checkFirebaseConnection();
    }, 5000); // Increased to 5 seconds
    
    // Track where leaderboard was opened from
    let leaderboardOpenedFrom = 'start'; 
    
    // Button Sound Functions
    function playButtonHoverSound() {
        if (soundEnabled && buttonHoverSound) {
            try {
                buttonHoverSound.currentTime = 0; // Reset to start
                buttonHoverSound.volume = 0.8;
                const playPromise = buttonHoverSound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            } catch (error) {
                // Silent error handling
            }
        }
    }
    
    function playButtonClickSound() {
        if (soundEnabled && buttonClickSound) {
            try {
                buttonClickSound.currentTime = 0; // Reset to start
                buttonClickSound.volume = 0.8;
                const playPromise = buttonClickSound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            } catch (error) {
                // Silent error handling
            }
        }
    }
    
    // Function to add sound effects to buttons
    function addButtonSounds(button) {
        if (button) {
            button.addEventListener('mouseenter', playButtonHoverSound);
            button.addEventListener('click', playButtonClickSound);
        }
    }
    
    // Function to add sound effects to toggle switches
    function addToggleSounds(toggle) {
        if (toggle) {
            toggle.addEventListener('mouseenter', playButtonHoverSound);
            toggle.addEventListener('click', playButtonClickSound);
        }
    } 
    
    // Loading Screen Logic
    function startLoadingSequence() {
        inject(); 
        let progress = 0;
        const loadingDuration = 5000; 
        const updateInterval = 50; 
        const progressIncrement = (100 / (loadingDuration / updateInterval));
        
        const loadingInterval = setInterval(() => {
            progress += progressIncrement;
            loadingProgress.style.width = Math.min(progress, 100) + '%';
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    // Fade out loading screen
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        startModal.classList.remove('hidden');
                        initializeAudio();
                    }, 500); 
                }, 500); 
            }
        }, updateInterval);
    }
    
    // Initialize loading screen
    startModal.classList.add('hidden'); // Hide start modal initially
    startLoadingSequence();
    
    let gameStarted = false;
    let gamePaused = false;
    let audioInitialized = false;
    let musicEnabled = true;
    let soundEnabled = true;
    
    function initializeAudio() {
        if (!audioInitialized) {
            backgroundMusic.volume = 0.5;
            if (musicEnabled) {
                startBackgroundMusic();
            }
            audioInitialized = true;
        }
    }
    
    function startBackgroundMusic() {
        if (!musicEnabled) return;
        backgroundMusic.currentTime = 0; 
        backgroundMusic.volume = 0.5; 
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                // Silent error handling for autoplay prevention
            });
        }
    }
    
    function stopBackgroundMusic() {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Settings Modal Functions
    function openSettingsModal() {
        if (gameStarted && !gamePaused) {
            gamePaused = true;
            settingsModal.classList.remove('hidden');
            updateToggleStates();
        }
    }
    
    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
        gamePaused = false;
    }
    
    function updateToggleStates() {
        musicToggle.classList.toggle('active', musicEnabled);
        soundToggle.classList.toggle('active', soundEnabled);
    }
    
    // Settings Event Listeners
    continueButton.addEventListener('click', closeSettingsModal);
    
    restartButton.addEventListener('click', function() {
        // Close settings modal and restart the game
        closeSettingsModal();
        restartGame();
        // Reset and restart background music
        startBackgroundMusic();
    });
    
    musicToggle.addEventListener('click', function() {
        musicEnabled = !musicEnabled;
        updateToggleStates();
        
        if (musicEnabled && audioInitialized) {
            startBackgroundMusic();
        } else {
            stopBackgroundMusic();
        }
    });
    
    soundToggle.addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        updateToggleStates();
    });
    
    // Add click event listeners to initialize audio on first user interaction
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('keydown', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    
    // Don't start music during loading - it will start after loading completes
    
    // Initialize toggle states
    updateToggleStates();
    
    // Modal functionality
    startButton.addEventListener('click', function() {
        // Validate username
        const username = usernameInput.value.trim();
        if (!username) {
            usernameInput.style.borderColor = '#e74c3c';
            usernameInput.placeholder = 'Please enter a username!';
            usernameInput.focus();
            return;
        }
        
        // Reset input styling
        usernameInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        
        // Ensure audio is initialized on user interaction
        initializeAudio();
        
        startModal.classList.add('hidden');
        // Reset and restart background music
        startBackgroundMusic();
        // Reset game state for fresh start
        game.enemies = [];
        game.particles = [];
        game.collisions = [];
        game.floatingMessages = [];
        game.collectibleManager.reset(); // Reset collectibles
        game.score = 0;
        game.time = game.startingTime; // Reset to starting time
        game.lives = 5;
        game.energy = 100; // Reset energy
        game.gameOver = false;
        game.gameStarted = true; // Set game started flag
        game.enemyTimer = 0;
        
        // Reset stage system
        game.currentStage = 1;
        game.stageTimer = 0;
        game.stageDisplayTime = 0;
        game.showingStage = false;
        
        game.player.x = 0;
        game.player.y = game.height - game.player.height - game.groundMargin;
        game.player.currentState = game.player.states[1]; // Set to running state
        game.player.currentState.enter();
        gameStarted = true;
        
        setTimeout(() => {
            if (gameStarted && !game.gameOver) {
                game.showStageDisplay();
            }
        }, 1000); 
    });
    
    playAgainButton.addEventListener('click', function() {
        gameOverModal.classList.add('hidden');
        // Reset and restart background music
        startBackgroundMusic();
        restartGame();
    });
    
    // Leaderboard Event Listeners
    leaderboardButton.addEventListener('click', function() {
        leaderboardOpenedFrom = 'start';
        openLeaderboard();
    });
    
    closeLeaderboardButton.addEventListener('click', function() {
        closeLeaderboard();
    });
    
    // Game Over Leaderboard Button
    gameOverLeaderboardButton.addEventListener('click', function() {
        leaderboardOpenedFrom = 'gameOver';
        gameOverModal.classList.add('hidden');
        openLeaderboard();
    });
    
    // Username input validation
    usernameInput.addEventListener('input', function() {
        // Limit to 15 characters and remove special characters except spaces, letters, and numbers
        this.value = this.value.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 15);
    });
    
    // Save username to localStorage for persistence
    usernameInput.addEventListener('change', function() {
        if (this.value.trim()) {
            localStorage.setItem('cerberun_username', this.value.trim());
        }
    });
    
    // Load saved username on page load
    const savedUsername = localStorage.getItem('cerberun_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
    
    // Apply button sound effects to all buttons and toggles
    function initializeButtonSounds() {
        addButtonSounds(startButton);
        addButtonSounds(playAgainButton);
        addButtonSounds(leaderboardButton);
        addButtonSounds(gameOverLeaderboardButton);
        addButtonSounds(closeLeaderboardButton);
        addButtonSounds(continueButton);
        addButtonSounds(restartButton);
        
        // Add sound effects to toggle switches
        addToggleSounds(musicToggle);
        addToggleSounds(soundToggle);
        
        // Add sound effect to username input focus
        if (usernameInput) {
            usernameInput.addEventListener('focus', function() {
                playButtonHoverSound();
            });
        }
    }
    
    // Initialize button sounds after a short delay to ensure audio elements are loaded
    setTimeout(initializeButtonSounds, 100);
    
    function restartGame() {
        if (game) {
            game.gameOver = false;
            game.gameStarted = true; // Set game started flag
            game.score = 0;
            game.time = game.startingTime; // Reset to starting time
            game.lives = 5;
            game.energy = 100; // Reset energy
            game.enemies = [];
            game.particles = [];
            game.collisions = [];
            game.floatingMessages = [];
            game.collectibleManager.reset(); // Reset collectibles
            
            // Reset stage system
            game.currentStage = 1;
            game.stageTimer = 0;
            game.stageDisplayTime = 0;
            game.showingStage = false;
            
            game.player.x = 0;
            game.player.y = game.height - game.player.height - game.groundMargin;
            game.player.currentState = game.player.states[1]; // Set to running state
            game.player.currentState.enter();
            gameOverShown = false;
            gameStarted = true;
            
            // Show Stage 1 after 3 seconds
            setTimeout(() => {
                if (gameStarted && !game.gameOver) {
                    game.showStageDisplay();
                }
            }, 1500);
        }
    }
    
    // Leaderboard Functions
    async function displayLeaderboard() {
        const currentUsername = usernameInput.value.trim() || 'Anonymous';
        
        // Show loading state
        leaderboardList.innerHTML = '<div class="loading-leaderboard">Loading leaderboard...</div>';
        
        try {
            const leaderboard = await leaderboardManager.getLeaderboard();
            
            if (leaderboard.length === 0) {
                leaderboardList.innerHTML = '<div class="empty-leaderboard">No scores yet. Be the first to play!</div>';
                return;
            }
            
            leaderboardList.innerHTML = '';
            
            leaderboard.forEach((entry, index) => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'leaderboard-entry';
                
                // Highlight current user's entry
                if (entry.username === currentUsername) {
                    entryDiv.classList.add('current-user');
                }
                
                // Add local indicator if offline score
                if (entry.isLocal) {
                    entryDiv.classList.add('local-entry');
                }
                
                const rank = index + 1;
                let rankDisplay = rank;
                
                // Add medals for top 3
                if (rank === 1) rankDisplay = '🥇 1';
                else if (rank === 2) rankDisplay = '🥈 2';
                else if (rank === 3) rankDisplay = '🥉 3';
                
                const localIndicator = entry.isLocal ? ' <span class="local-badge">(Offline)</span>' : '';
                
                entryDiv.innerHTML = `
                    <div class="rank">${rankDisplay}</div>
                    <div class="username">${entry.username}${localIndicator}</div>
                    <div class="score">${entry.score}</div>
                `;
                
                leaderboardList.appendChild(entryDiv);
            });
        } catch (error) {
            leaderboardList.innerHTML = '<div class="error-leaderboard">Failed to load leaderboard. Check your connection.</div>';
        }
    }
    
    function openLeaderboard() {
        displayLeaderboard();
        leaderboardModal.classList.remove('hidden');
    }
    
    function closeLeaderboard() {
        leaderboardModal.classList.add('hidden');
        
        // Return to appropriate modal based on where leaderboard was opened from
        if (leaderboardOpenedFrom === 'gameOver') {
            gameOverModal.classList.remove('hidden');
            leaderboardOpenedFrom = 'start'; // Reset for next time
        }
    }
    
    async function handleGameOver() {
        const finalGameScore = game.score;
        const username = usernameInput.value.trim() || 'Anonymous';
        
        // Show game over modal first
        finalScore.textContent = finalGameScore;
        gameOverModal.classList.remove('hidden');
        
        try {
            // Add score to leaderboard (async)
            const rank = await leaderboardManager.addScore(username, finalGameScore);
            
            // Add high score notification if applicable
            if (rank && rank <= leaderboardManager.maxEntries) {
                const highScoreMsg = document.createElement('div');
                highScoreMsg.className = 'high-score-notification';
                highScoreMsg.innerHTML = `NEW HIGH SCORE!<br>Global Rank #${rank}`;
                highScoreMsg.style.cssText = `
                    color: #ffd700;
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-top: 15px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    animation: pulse 1s infinite alternate;
                `;
                
                // Add CSS animation if not exists
                if (!document.querySelector('#highScoreAnimation')) {
                    const style = document.createElement('style');
                    style.id = 'highScoreAnimation';
                    style.textContent = `
                        @keyframes pulse {
                            from { opacity: 0.8; transform: scale(1); }
                            to { opacity: 1; transform: scale(1.05); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                const scoreDisplay = document.querySelector('.score-display');
                // Remove any existing high score notification
                const existingNotification = scoreDisplay.querySelector('.high-score-notification');
                if (existingNotification) {
                    existingNotification.remove();
                }
                scoreDisplay.appendChild(highScoreMsg);
            }
        } catch (error) {
            console.error('Error handling game over:', error);
            // The modal is already shown, so the game can continue
        }
    }
    
    function showGameOverModal() {
        handleGameOver();
    }
    
    // Restart functionality and ESC key for settings
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (gameStarted && !gamePaused && !game.gameOver) {
                openSettingsModal();
            } else if (gamePaused) {
                closeSettingsModal();
            }
        } else if (e.key === 'r' || e.key === 'R') {
            if (game && game.gameOver) {
                gameOverModal.classList.add('hidden');
                restartGame();
            }
        }
    });
    
    // Make canvas fullscreen
    let game; // Declare game variable
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Update game dimensions
        if (game) {
            game.resize(canvas.width, canvas.height);
        }
    }
    
    // Initial resize
    resizeCanvas();
    
    // Resize canvas when window is resized
    window.addEventListener('resize', resizeCanvas);
    
    class Game{
        constructor(width,height){
            this.width = width;
            this.height = height;
            this.groundMargin = Math.max(80, height * 0.2); 
            this.background = new Background(this);
            this.speed = 0;
            this.maxSpeed = 3;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.UI = new UI(this);
            this.enemies = [];
            this.particles = [];
            this.collisions = [];
            this.floatingMessages = [];
            this.maxParticles = 50;
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.debug = false;
            this.score = 0;
            this.fontColor = 'black';
            this.startingTime = 40000; // 40 seconds in milliseconds
            this.time = this.startingTime; // Start with full time
            this.winningScore = 40; 
            this.gameOver = false;
            this.gameStarted = false; // Add gameStarted property
            this.lives = 5;
            this.energy = 100; // Add energy system
            this.maxEnergy = 100;
            this.energyRegenRate = 15; // Energy regenerated per second
            this.rollEnergyCost = 10; // Energy cost for roll attack
            this.rollEnergyDrainRate = 30; // Energy drained per second while rolling
            
            // Collectibles System
            this.collectibleManager = new CollectibleManager(this);
            
            // Stage System
            this.currentStage = 1;
            this.stageTargets = [0, 80, 150, 250, 350, 500]; // Index 0 unused, stages 1-5
            this.stageTimer = 0;
            this.stageDisplayTime = 0;
            this.showingStage = false;
            this.stageCheckInterval = 10000; // Check stage every 10 seconds
            
            this.player.currentState = this.player.states[1]; 
            this.player.currentState.enter();
        }
        
        // Method to check if sound effects are enabled
        isSoundEnabled() {
            return soundEnabled;
        }
        
        // Energy system methods
        canUseRollAttack() {
            return this.energy > 0;
        }
        
        canStartRollAttack() {
            return this.energy >= this.rollEnergyCost;
        }
        
        drainEnergyForRoll(deltaTime) {
            if (this.energy > 0) {
                this.energy -= (this.rollEnergyDrainRate * deltaTime) / 1000;
                if (this.energy < 0) {
                    this.energy = 0;
                    return false; // No more energy
                }
                return true; // Still has energy
            }
            return false; // No energy
        }
        
        regenerateEnergy(deltaTime) {
            if (this.energy < this.maxEnergy) {
                this.energy += (this.energyRegenRate * deltaTime) / 1000;
                if (this.energy > this.maxEnergy) {
                    this.energy = this.maxEnergy;
                }
            }
        }
        
        // Stage System Methods
        checkStageProgress(deltaTime) {
            this.stageTimer += deltaTime;
            
            // Check stage progression every 10 seconds
            if (this.stageTimer >= this.stageCheckInterval) {
                this.stageTimer = 0;
                // The timed check is now just for resetting the timer
                // Actual stage advancement happens immediately when score is reached
            }
        }
        
        // Immediate stage advancement check (called when score changes)
        checkForStageAdvancement() {
            if (this.currentStage <= 5) {
                const targetScore = this.stageTargets[this.currentStage];
                
                if (this.score >= targetScore) {
                    // Player reached target, advance to next stage
                    this.currentStage++;
                    if (this.currentStage <= 5) {
                        this.showStageDisplay();
                        // Reset the stage timer when advancing
                        this.stageTimer = 0;
                    }
                }
            }
        }
        
        showStageDisplay() {
            this.showingStage = true;
            this.stageDisplayTime = 0;
            
            // Play stage sound when stage is displayed
            if (soundEnabled) {
                let stageSound = null;
                
                switch(this.currentStage) {
                    case 1:
                        stageSound = stage1Sound;
                        break;
                    case 2:
                        stageSound = stage2Sound;
                        break;
                    case 3:
                        stageSound = stage3Sound;
                        break;
                    case 4:
                        stageSound = stage4Sound;
                        break;
                    case 5:
                        stageSound = stage5Sound;
                        break;
                }
                
                if (stageSound) {
                    try {
                        stageSound.currentTime = 0;
                        stageSound.volume = 0.8;
                        const playPromise = stageSound.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(e => {
                                // Silent error handling
                            });
                        }
                    } catch (error) {
                        // Silent error handling
                    }
                }
            }
        }
        
        updateStageDisplay(deltaTime) {
            if (this.showingStage) {
                this.stageDisplayTime += deltaTime;
                if (this.stageDisplayTime >= 3000) { // Show for 3 seconds
                    this.showingStage = false;
                }
            }
        }
        
        getCurrentStageTarget() {
            return this.stageTargets[this.currentStage] || 0;
        }
        
        // Add method to resize game when window resizes
        resize(width, height) {
            this.width = width;
            this.height = height;
            this.groundMargin = Math.max(80, height * 0.16);
            // Update player position to stay on ground
            this.player.y = this.height - this.player.height - this.groundMargin;
            // Update background size
            this.background.resize();
        }
        update(deltaTime){
            this.time -= deltaTime; // Decrease time instead of increase
            if(this.time <= 0) {
                this.time = 0; // Ensure time doesn't go negative
                this.gameOver = true;
            }
            this.background.update();
            this.player.update(this.input.keys, deltaTime);
            
            // Stage system updates
            this.checkStageProgress(deltaTime);
            this.updateStageDisplay(deltaTime);
            
            // Update collectibles
            this.collectibleManager.update(deltaTime);
            
            // Regenerate energy over time
            this.regenerateEnergy(deltaTime);
            
            // handleEnemies
            if(this.enemyTimer > this.enemyInterval){
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
            
            // Update all arrays first
            this.enemies.forEach(enemy => enemy.update(deltaTime));
            this.floatingMessages.forEach(message => message.update());
            this.particles.forEach(particle => particle.update());
            this.collisions.forEach(collision => collision.update(deltaTime));
            
            // Clean up arrays safely using filter (no iteration issues)
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            this.floatingMessages = this.floatingMessages.filter(message => !message.markedForDeletion);
            this.particles = this.particles.filter(particle => !particle.markedForDeletion);
            this.collisions = this.collisions.filter(collision => !collision.markedForDeletion);
            
            // Limit particles properly
            if(this.particles.length > this.maxParticles){
                this.particles.length = this.maxParticles; // Fixed: proper length assignment
            }
        }
        draw(context){
            this.background.draw(context);
            this.player.draw(context);
            this.enemies.forEach(enemy => {
                enemy.draw(context);
            });
            this.particles.forEach(particle => {
                particle.draw(context);
            });
            this.collisions.forEach(collision => {
                collision.draw(context);
            });
            this.collectibleManager.draw(context);
            this.floatingMessages.forEach(message => {
                message.draw(context);
            });
            this.UI.draw(context);
        }
        addEnemy(){
            if(this.speed > 0 && Math.random() < 0.5) this.enemies.push(new GroundEnemy(this));
            else if(this.speed > 0) {
                if(Math.random() < 0.5) {
                    this.enemies.push(new ClimbingEnemy(this));
                } else {
                    this.enemies.push(new SmallSpiderEnemy(this));
                }
            }
            this.enemies.push(new FlyingEnemy(this), new ZombieEnemy(this));
            // Add SmallEnemyZombie with a chance of 40%
            if (Math.random() < 0.1) {
                this.enemies.push(new SmallEnemyZombie(this));
            }
        }   
    }
    
    // Initialize game after class definition
    game = new Game(canvas.width, canvas.height);
    
    let lastTime = 0;
    let gameOverShown = false;
    
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Add a fallback background color to see if the game is running
        ctx.fillStyle = '#87CEEB'; // Sky blue background as fallback
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Always update background for animated effect, even when game hasn't started
        // Set a base speed for background animation even when game isn't started
        if (!gameStarted) {
            game.speed = 1; // Base speed for background animation
            
            // Spawn and update enemies even when game hasn't started for visual effect
            if(game.enemyTimer > game.enemyInterval){
                game.addEnemy();
                game.enemyTimer = 0;
            } else {
                game.enemyTimer += deltaTime;
            }
            
            // Update enemies for visual movement
            game.enemies.forEach(enemy => enemy.update(deltaTime));
            // Clean up off-screen enemies
            game.enemies = game.enemies.filter(enemy => !enemy.markedForDeletion);
        }
        
        game.background.update();
        
        // Always draw the game background and player, but only update logic if started and not paused
        game.draw(ctx);
        
        if (gameStarted && !gamePaused) {
            game.update(deltaTime);
            
            // Check if game just ended and show modal
            if (game.gameOver && !gameOverShown) {
                gameOverShown = true;
                setTimeout(() => {
                    showGameOverModal();
                }, 500); 
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate(0);
});
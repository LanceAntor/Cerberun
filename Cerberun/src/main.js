import { Player } from './player.js';
import { InputHandler } from './input.js';
import { Background } from './background.js';
import { FlyingEnemy, GroundEnemy, ClimbingEnemy, SmallSpiderEnemy, ZombieEnemy, SmallEnemyZombie} from './enemies.js';
import { UI } from './UI.js';
import { CollectibleManager, Clock, Heart } from './collectibles.js';
import { inject } from "@vercel/analytics"

// Leaderboard System
class LeaderboardManager {
    constructor() {
        this.storageKey = 'cerberun_leaderboard';
        this.maxEntries = 5;
    }
    
    getLeaderboard() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            return [];
        }
    }
    
    saveLeaderboard(leaderboard) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
            return true;
        } catch (error) {
            console.error('Error saving leaderboard:', error);
            return false;
        }
    }
    
    addScore(username, score) {
        if (!username || username.trim() === '') {
            username = 'Anonymous';
        }
        
        const leaderboard = this.getLeaderboard();
        const newEntry = {
            username: username.trim().substring(0, 15), // Limit username length
            score: score,
            date: new Date().toISOString()
        };
        
        // Add new entry
        leaderboard.push(newEntry);
        
        // Sort by score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top entries
        const trimmedLeaderboard = leaderboard.slice(0, this.maxEntries);
        
        // Save back to localStorage
        this.saveLeaderboard(trimmedLeaderboard);
        
        // Return the rank of the new entry (1-based)
        const rank = trimmedLeaderboard.findIndex(entry => 
            entry.username === newEntry.username && 
            entry.score === newEntry.score &&
            entry.date === newEntry.date
        ) + 1;
        
        return rank > 0 ? rank : null;
    }
    
    isHighScore(score) {
        const leaderboard = this.getLeaderboard();
        if (leaderboard.length < this.maxEntries) {
            return true; // Always a high score if leaderboard isn't full
        }
        return score > leaderboard[leaderboard.length - 1].score;
    }
    
    clearLeaderboard() {
        localStorage.removeItem(this.storageKey);
    }
}

// Comprehensive zoom prevention
document.addEventListener('DOMContentLoaded', function() {
    // Prevent zoom with keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
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

    // Prevent context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Prevent drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
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
    
    // Initialize leaderboard manager
    const leaderboardManager = new LeaderboardManager();
    
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
    function displayLeaderboard() {
        const leaderboard = leaderboardManager.getLeaderboard();
        const currentUsername = usernameInput.value.trim() || 'Anonymous';
        
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
            
            const rank = index + 1;
            let rankDisplay = rank;
            
            // Add medals for top 3
            if (rank === 1) rankDisplay = '🥇 1';
            else if (rank === 2) rankDisplay = '🥈 2';
            else if (rank === 3) rankDisplay = '🥉 3';
            
            entryDiv.innerHTML = `
                <div class="rank">${rankDisplay}</div>
                <div class="username">${entry.username}</div>
                <div class="score">${entry.score}</div>
            `;
            
            leaderboardList.appendChild(entryDiv);
        });
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
    
    function handleGameOver() {
        const finalGameScore = game.score;
        const username = usernameInput.value.trim() || 'Anonymous';
        
        // Add score to leaderboard
        const rank = leaderboardManager.addScore(username, finalGameScore);
        
        // Show game over modal
        finalScore.textContent = finalGameScore;
        
        // Add high score notification if applicable
        if (rank && rank <= leaderboardManager.maxEntries) {
            const highScoreMsg = document.createElement('div');
            highScoreMsg.className = 'high-score-notification';
            highScoreMsg.innerHTML = `NEW HIGH SCORE!<br>Rank #${rank} `;
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
        
        gameOverModal.classList.remove('hidden');
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
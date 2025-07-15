import { Player } from './player.js';
import { InputHandler } from './input.js';
import { Background } from './background.js';
import { FlyingEnemy, GroundEnemy, ClimbingEnemy } from './enemies.js';
import { UI } from './UI.js';

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
    
    let gameStarted = false;
    let gamePaused = false;
    let audioInitialized = false;
    let musicEnabled = true;
    let soundEnabled = true;
    
    function initializeAudio() {
        if (!audioInitialized) {
            backgroundMusic.volume = 0.1;
            if (musicEnabled) {
                startBackgroundMusic();
            }
            audioInitialized = true;
        }
    }
    
    function startBackgroundMusic() {
        if (!musicEnabled) return;
        backgroundMusic.currentTime = 0; 
        backgroundMusic.volume = 0.1; 
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.log('Autoplay prevented, music will start on user interaction');
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
    
    // Try to start music immediately (will work if autoplay is allowed)
    startBackgroundMusic();
    
    // Initialize toggle states
    updateToggleStates();
    
    // Modal functionality
    startButton.addEventListener('click', function() {
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
        game.score = 0;
        game.time = 0;
        game.lives = 5;
        game.energy = 100; // Reset energy
        game.gameOver = false;
        game.enemyTimer = 0;
        game.player.x = 0;
        game.player.y = game.height - game.player.height - game.groundMargin;
        game.player.currentState = game.player.states[1]; // Set to running state
        game.player.currentState.enter();
        gameStarted = true;
    });
    
    playAgainButton.addEventListener('click', function() {
        gameOverModal.classList.add('hidden');
        // Reset and restart background music
        startBackgroundMusic();
        restartGame();
    });
    
    function restartGame() {
        if (game) {
            game.gameOver = false;
            game.score = 0;
            game.time = 0;
            game.lives = 5;
            game.energy = 100; // Reset energy
            game.enemies = [];
            game.particles = [];
            game.collisions = [];
            game.floatingMessages = [];
            game.player.x = 0;
            game.player.y = game.height - game.player.height - game.groundMargin;
            game.player.currentState = game.player.states[1]; // Set to running state
            game.player.currentState.enter();
            gameOverShown = false;
            gameStarted = true;
        }
    }
    
    function showGameOverModal() {
        finalScore.textContent = game.score;
        
        gameOverModal.classList.remove('hidden');
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
            this.enemyInterval = 500;
            this.debug = false;
            this.score = 0;
            this.fontColor = 'black';
            this.time = 0;
            this.maxTime = 30000; // 30 seconds
            this.winningScore = 40; 
            this.gameOver = false;
            this.lives = 5;
            this.energy = 100; // Add energy system
            this.maxEnergy = 100;
            this.energyRegenRate = 15; // Energy regenerated per second
            this.rollEnergyCost = 25; // Energy cost for roll attack
            this.rollEnergyDrainRate = 30; // Energy drained per second while rolling
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
            this.time += deltaTime;
            if(this.time > this.maxTime) this.gameOver = true;
            this.background.update();
            this.player.update(this.input.keys, deltaTime);
            
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
            this.floatingMessages.forEach(message => {
                message.draw(context);
            });
            this.UI.draw(context);
        }
        addEnemy(){
            if(this.speed > 0 && Math.random() < 0.5) this.enemies.push(new GroundEnemy(this));
            else if(this.speed > 0) this.enemies.push(new ClimbingEnemy(this));
            this.enemies.push(new FlyingEnemy(this));
        }   
    }
    
    // Initialize game after class definition
    game = new Game(canvas.width, canvas.height);
    console.log('Game initialized with dimensions:', canvas.width, 'x', canvas.height);
    
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
                }, 1000); // Small delay to see the final game state
            }
        }
        
        // Continue animation loop regardless of game state for background effect
        requestAnimationFrame(animate);
    }
    
    // Start the animation loop immediately for background effect
    animate(0);
});
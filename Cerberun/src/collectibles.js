import { FloatingMessages } from './floatingMessages.js';

export class Clock {
    constructor(game) {
        this.game = game;
        this.spriteWidth = 219; 
        this.spriteHeight = 270;
        this.width = 30;
        this.height = 30; 
        this.x = this.game.width + Math.random() * this.game.width * 0.5; // Start from right side
        this.y = Math.random() * (this.game.height - this.game.groundMargin - this.height - 200) + 100; // Safe spawn area above ground
        this.speedX = Math.random() * 1 + 2; // Horizontal speed
        this.markedForDeletion = false;
        this.image = document.getElementById('clock');
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 0; 
        this.fps = 10;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;
        this.timeBonus = 10000; 
        
        // Wave movement properties for smooth up-down motion
        this.waveAmplitude = 80; // Reduced amplitude to keep within bounds
        this.waveFrequency = 0.01; // How stretched the wave is
        this.startY = this.y; // Remember starting Y position
        this.waveOffset = Math.random() * Math.PI * 1; // Random phase offset
    }
    
    update(deltaTime) {
        // Move from right to left
        this.x -= this.speedX;
        
        // Create smooth wave motion like the image - up and down curves
        const wavePosition = (this.x + this.waveOffset) * this.waveFrequency;
        this.y = this.startY + Math.sin(wavePosition) * this.waveAmplitude;
        
        // Keep within screen bounds - never go below ground margin
        const minY = 50; // Top boundary
        const maxY = this.game.height - this.game.groundMargin - this.height - 20; // Ground boundary with buffer
        
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;
        
        // Remove if off screen
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
        
        // Animation frame update (if needed for animated sprites later)
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        } else {
            this.frameTimer += deltaTime;
        }
        
        // Check collision with player
        this.checkCollision();
    }
    
    checkCollision() {
        const player = this.game.player;
        
        // Simple rectangular collision detection
        if (this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y) {
            
            // Collision detected - give time bonus
            this.collect();
        }
    }
    
    collect() {
        // Add time bonus
        this.game.time += this.timeBonus;
        
        // Ensure time doesn't exceed starting time
        if (this.game.time > this.game.startingTime) {
            this.game.time = this.game.startingTime;
        }
        
        // Create floating message
        this.game.floatingMessages.push(new FloatingMessages(
            '+10 TIME!', 
            this.x, 
            this.y, 
            150, 
            '#00ff00' // Green color for time bonus
        ));
        
        // Play collection sound if enabled
        if (this.game.isSoundEnabled()) {
            const collectSound = document.getElementById('collectSound');
            if (collectSound) {
                const sound = collectSound.cloneNode(true);
                sound.volume = 0.3;
                sound.play().catch(e => console.log('Collect sound play failed:', e));
            }
        }
        
        // Mark for deletion
        this.markedForDeletion = true;
    }
    
    draw(context) {
       // console.log('Drawing clock at:', this.x, this.y, 'size:', this.width, this.height); // Debug log
        
        context.save();
        
        // Calculate circle properties
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const circleRadius = Math.max(this.width, this.height) / 2 + 5; // Slightly larger than clock
        
        // Draw highlight/glow circle (outer)
        context.shadowColor = '#f9f9f9ff'; // Yellow glow
        context.shadowBlur = 15;
        context.fillStyle = '#444444'; // Dark gray highlight
        context.beginPath();
        context.arc(centerX, centerY, circleRadius + 3, 0, 2 * Math.PI);
        context.fill();
        
        // Reset shadow for black circle
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        
        // Draw black circular background
        context.fillStyle = '#000000'; // Black circle
        context.beginPath();
        context.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
        context.fill();
        
        // Add subtle inner glow to black circle
        context.shadowColor = '#333333';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Draw the clock image on top of black circle
        if (this.image && this.image.complete) {
            context.drawImage(
                this.image,
                this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, // Source position and size
                this.spriteWidth, this.spriteHeight,
                this.x, this.y, // Destination position
                this.width, this.height // Destination size (scaled)
            );
        } else {
            // Fallback if image doesn't load or isn't ready - draw a simple clock shape
            // console.log('Using fallback rendering for clock'); // Debug log
            context.fillStyle = '#ffd700'; // Gold color
            context.fillRect(this.x, this.y, this.width, this.height);
            
            // Simple clock face
            context.fillStyle = '#000000';
            context.beginPath();
            context.arc(this.x + this.width/2, this.y + this.height/2, this.width/3, 0, 2 * Math.PI);
            context.fill();
            
            // Clock hands
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(this.x + this.width/2, this.y + this.height/2);
            context.lineTo(this.x + this.width/2, this.y + this.height/4);
            context.moveTo(this.x + this.width/2, this.y + this.height/2);
            context.lineTo(this.x + this.width/1.5, this.y + this.height/2);
            context.stroke();
        }
        
        context.restore();
        
        // Debug collision box (uncomment for testing)
        // context.strokeStyle = 'red';
        // context.strokeRect(this.x, this.y, this.width, this.height);
    }
}

export class CollectibleManager {
    constructor(game) {
        this.game = game;
        this.collectibles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 7000 + Math.random() * 7000; // 5-10 seconds between spawns (reduced for testing)
    }
    
    update(deltaTime) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn new collectible
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnCollectible();
            this.spawnTimer = 0;
            this.spawnInterval = 5000 + Math.random() * 5000; // Reset interval with randomness (reduced for testing)
        }
        
        // Update all collectibles
        this.collectibles.forEach(collectible => collectible.update(deltaTime));
        
        // Remove marked collectibles
        this.collectibles = this.collectibles.filter(collectible => !collectible.markedForDeletion);
    }
    
    spawnCollectible() {
        // Only spawn if game is running and there aren't too many collectibles
        if (this.game.gameStarted && !this.game.gameOver && this.collectibles.length < 3) {
            // 100% chance to spawn a clock for testing (was 80%)
            // console.log('Spawning clock collectible!'); // Debug log
            this.collectibles.push(new Clock(this.game));
        } 
        // else {
        //     console.log('Cannot spawn clock:', {
        //         gameStarted: this.game.gameStarted,
        //         gameOver: this.game.gameOver,
        //         collectiblesCount: this.collectibles.length
        //     }); // Debug log
        // }
    }
    
    draw(context) {
        this.collectibles.forEach(collectible => collectible.draw(context));
    }
    
    reset() {
        this.collectibles = [];
        this.spawnTimer = 0;
    }
}

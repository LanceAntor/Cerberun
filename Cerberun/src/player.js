import {Sitting, 
        Running,
        Jumping,
        Falling,
        Rolling,
        Diving,
        Hit} from "./playerStates.js";

import { CollisionAnimation } from "./collisionAnimation.js";
import { FloatingMessages } from "./floatingMessages.js";

export class Player {
    constructor(game){
        this.game = game;
        this.width = 100;
        this.height = 91.3;
        this.x = 0;
        this.y = this.game.height - this.height - this.game.groundMargin;
        this.vy = 0;
        this.weight = 1; // gravity effect
        this.image = document.getElementById('player');
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 5;
        this.fps = 20;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;
        this.speed = 0;
        this.maxSpeed = 7;
        this.states = [new Sitting(this.game), new Running(this.game), new Jumping(this.game), new Falling(this.game),
        new Rolling(this.game), new Diving(this.game), new Hit(this.game)];
        this.currentState = null;
        this.sound = document.getElementById('collisionSound');
        this.damageSound = document.getElementById('damageSound');
        
        // Invulnerability system
        this.invulnerable = false;
        this.invulnerabilityDuration = 3000; // 1 second in milliseconds
        this.invulnerabilityTimer = 0;
        this.blinkTimer = 0;
        this.blinkInterval = 100; // Blink every 100ms during invulnerability
        this.isVisible = true;
    }
    update(input, deltaTime) {
        // Update invulnerability
        this.updateInvulnerability(deltaTime);
        
        this.checkCollision();
        this.currentState.handleInput(input, deltaTime);
        // horizontal movement
        this.x += this.speed;
        if(input.includes('d') && this.currentState !== this.states[6]) {
            this.speed = this.maxSpeed;
        } else if(input.includes('a') && this.currentState !== this.states[6]) {
            // Increase speed when rolling backwards for better responsiveness
            if(this.currentState === this.states[4]) { // Rolling state
                this.speed = -this.maxSpeed * 1.5; // 1.5x faster when rolling backwards
            } else {
                this.speed = -this.maxSpeed;
            }
        } else {
            this.speed = 0;
        }
        // horizontal boundaries
        if(this.x < 0) this.x = 0; // prevent going off the left edge
        if(this.x > this.game.width - this.width) this.x = this.game.width - this.width; // prevent going off the right edge
        // vertical movement
        //if(input.includes('w') && this.onGround()) this.vy -= 20; // jump height
        this.y += this.vy;
        if(!this.onGround()) this.vy += this.weight;
        else this.vy = 0; 
        // vertical boundaries
        if(this.y > this.game.height - this.height - this.game.groundMargin)
        this.game.height - this.height - this.game.groundMargin;
        // sprite animation
        if(this.frameTimer > this.frameInterval){
            this.frameTimer = 0;
            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        } else {
            this.frameTimer += deltaTime;
        }
        //if(this.frameX< this.maxFrame) this.frameX++;
        //else this.frameX = 0;
        
    }
    draw(context){
        if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
        
        // Only draw if visible (for blinking effect during invulnerability)
        if (this.isVisible) {
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width,this.height, this.x, this.y, this.width, this.height);
        }
    }
    onGround(){
        return this.y >= this.game.height - this.height - this.game.groundMargin;
    }
    setState(state,speed){
        this.currentState = this.states[state];
        this.game.speed = this.game.maxSpeed * speed;
        this.currentState.enter();
    }
    
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            this.blinkTimer += deltaTime;
            
            // Handle blinking effect
            if (this.blinkTimer >= this.blinkInterval) {
                this.isVisible = !this.isVisible;
                this.blinkTimer = 0;
            }
            
            // End invulnerability
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
                this.isVisible = true;
                this.invulnerabilityTimer = 0;
                this.blinkTimer = 0;
            }
        }
    }
    
    startInvulnerability() {
        this.invulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        this.blinkTimer = 0;
        this.isVisible = true;
    }
    
    checkCollision(){
        this.game.enemies.forEach(enemy => {
            // Use displayWidth/Height if enemy has scaling, otherwise use normal width/height
            const enemyWidth = enemy.displayWidth || enemy.width;
            const enemyHeight = enemy.displayHeight || enemy.height;

            if (
                enemy.x < this.x + this.width &&
                enemy.x + enemyWidth > this.x &&
                enemy.y < this.y + this.height &&
                enemy.y + enemyHeight > this.y
            ) {
                // If invulnerable, do nothing (enemy passes through, no effect)
                if (this.invulnerable) {
                    return;
                }

                // collision detected
                enemy.markedForDeletion = true;
                this.game.collisions.push(new CollisionAnimation(this.game, enemy.x + enemyWidth * 0.5,
                    enemy.y + enemyHeight * 0.5
                ));

                if (this.currentState === this.states[4] || this.currentState === this.states[5]) {
                    // Player successfully defeated enemy
                    if (this.game.isSoundEnabled()) {
                        const collisionSound = this.sound.cloneNode(true);
                        collisionSound.volume = 0.5;
                        collisionSound.play().catch(e => console.log('Collision audio play failed:', e));
                    }
                    this.game.score++;
                    this.game.checkForStageAdvancement(); // Check for immediate stage advancement
                    this.game.floatingMessages.push(new FloatingMessages('+1', enemy.x, enemy.y, 150, 50));
                } else {
                    // Player took damage
                    if (this.game.isSoundEnabled()) {
                        const playerDamageSound = this.damageSound.cloneNode(true);
                        playerDamageSound.volume = 0.6;
                        playerDamageSound.play().catch(e => console.log('Damage audio play failed:', e));
                    }
                    this.setState(6, 0);
                    this.game.score -= 5;
                    this.game.lives--;
                    this.startInvulnerability(); // Start invulnerability period
                    if (this.game.lives <= 0) {
                        this.game.gameOver = true;
                    }
                }
            }
        });
    }
}
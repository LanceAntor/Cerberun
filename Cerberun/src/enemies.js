class Enemy {
    constructor(){
        this.frameX = 0;
        this.frameY = 0;
        this.fps = 20;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;
        this.markedForDeletion = false;
    }
    update(deltaTime){
        // movement
        this.x -= this.speedX + this.game.speed;
        this.y += this.speedY;
        if(this.frameTimer > this.frameInterval){
            this.frameTimer = 0;
            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        } else {
            this.frameTimer += deltaTime;
        }
        if(this.x + this.width < 0) this.markedForDeletion = true; // mark for deletion if off screen
    }
    draw(context){
        if(this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
        context.drawImage(this.image, this.frameX * this.width, 0, 
        this.width, this.height, this.x, this.y, this.width, this.height);
    }
}

export class FlyingEnemy extends Enemy {
    constructor(game){
        super();
        this.game = game;
        this.width = 60;
        this.height = 44;
        this.x = this.game.width + Math.random() * this.game.width * 0.5;
        this.y = Math.random() * this.game.height * 0.5;
        this.speedX = Math.random() * + 1;
        this.speedY = 0;
        this.maxFrame = 5;
        this.image = document.getElementById('enemy_fly');
        this.angle = 0;
        this.va = Math.random() * 0.1 + 0.1; // random angle velocity
    }
    update(deltaTime){
        super.update(deltaTime);
        this.angle += this.va;
        this.y += Math.sin(this.angle); // vertical oscillation
    }
}

export class GroundEnemy extends Enemy {
    constructor(game){
        super();
        this.game = game;
        this.width = 60;
        this.height = 87;
        this.x = this.game.width;
        this.y = this.game.height - this.height - this.game.groundMargin;
        this.image = document.getElementById('enemy_plant');
        this.speedX = 0;
        this.speedY = 0;
        this.maxFrame = 1;
    }
}

export class ClimbingEnemy extends Enemy {
    constructor(game){
        super();
        this.game = game;
        this.width = 120;
        this.height = 144;
        this.x = this.game.width;
        this.y = Math.random() * this.game.height * 0.5;
        this.image = document.getElementById('enemy_spider');
        this.speedX = 0;
        this.speedY = Math.random() > 0.5 ? 1 : -1; // random vertical direction
        this.maxFrame = 5;
    }
    update(deltaTime){
        super.update(deltaTime);
        if(this.y > this.game.height - this.height - this.game.groundMargin) this.speedY *= -1;
        if(this.y < -this.height) this.markedForDeletion = true; // mark for deletion if off screen

    }
    draw(context){
        super.draw(context);
        // draw a line to visualize the climbing path
        context.beginPath();
        context.moveTo(this.x + this.width/2,0);
        context.lineTo(this.x + this.width/2, this.y + 50);
        context.stroke();
    }
}
export class SmallSpiderEnemy extends Enemy {
    constructor(game){
        super();
        this.game = game;
        this.width = 310;
        this.height = 175;
        this.x = this.game.width;
        this.y = Math.random() * this.game.height * 0.5;
        this.image = document.getElementById('enemy_small_spider');
        this.speedX = 0;
        this.speedY = Math.random() > 0.5 ? 1 : -1; // random vertical direction
        this.maxFrame = 5;
        this.scale = 0.3; 
        this.displayWidth = this.width * this.scale;
        this.displayHeight = this.height * this.scale;
    }
    update(deltaTime){
        super.update(deltaTime);
        if(this.y > this.game.height - this.height - this.game.groundMargin) this.speedY *= -1;
        if(this.y < -this.height) this.markedForDeletion = true; // mark for deletion if off screen

    }
    draw(context){
        if(this.game.debug) context.strokeRect(this.x, this.y, this.displayWidth, this.displayHeight);
        context.drawImage(this.image, this.frameX * this.width, 0, 
        this.width, this.height, this.x, this.y, this.displayWidth, this.displayHeight);
        // draw a line to visualize the climbing path - centered on the displayed spider
        context.beginPath();
        context.moveTo(this.x + this.displayWidth/2, 0);
        context.lineTo(this.x + this.displayWidth/2, this.y + this.displayHeight/2);
        context.stroke();
    }
}

export class ZombieEnemy extends Enemy {
    constructor(game){
        super();
        this.game = game;
        this.width = 292;
        this.height = 410;
        this.x = this.game.width + Math.random() * this.game.width * 0.5;
        this.y = this.game.height - this.height - this.game.groundMargin;
        this.image = document.getElementById('enemy_zombie');
        this.speedX = Math.random() * 1 + 0.5; // random speed
        this.speedY = 0;
        this.maxFrame = 7;
        // Scale factor for rendering (0.3 = 30% of original size)
        this.scale = 0.4;
        this.displayWidth = this.width * this.scale;
        this.displayHeight = this.height * this.scale;
        // Adjust collision box position for scaled size
        this.y = this.game.height - this.displayHeight - this.game.groundMargin;
    }
    update(deltaTime){
        super.update(deltaTime);
        // Zombie-specific behavior: move towards the player
        const player = this.game.player;
        if (player.x < this.x) this.speedX = Math.abs(this.speedX); // move left
        if(this.x + this.displayWidth < 0) this.markedForDeletion = true;
    }
    draw(context){
        if(this.game.debug) context.strokeRect(this.x, this.y, this.displayWidth, this.displayHeight);
        context.drawImage(this.image, this.frameX * this.width, 0, 
        this.width, this.height, this.x, this.y, this.displayWidth, this.displayHeight);
    }
}
export class SmallEnemyZombie extends Enemy {
    constructor(game){
        super();
        this.game = game;
        this.width = 292;
        this.height = 410;
        this.x = -this.width + 20; // Spawn from left side (off screen)
        this.y = this.game.height - this.height - this.game.groundMargin;
        this.image = document.getElementById('enemy_zombie_right');
        this.speedX = -(Math.random() * 8 + 5); // Negative speed to move right
        this.speedY = 0;
        this.maxFrame = 7;
        this.scale = 0.2;
        this.displayWidth = this.width * this.scale;
        this.displayHeight = this.height * this.scale;
        // Adjust collision box position for scaled size
        this.y = this.game.height - this.displayHeight - this.game.groundMargin;
        
        // Play spawn sound effect
        const zombieSound = document.getElementById('smallZombie');
        if (zombieSound && this.game.isSoundEnabled()) {
            zombieSound.currentTime = 0;
            zombieSound.volume = 0.6;
            zombieSound.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    update(deltaTime){
        // Custom movement for left-to-right zombie (don't call super.update() to avoid wrong collision)
        this.x -= this.speedX + this.game.speed;
        this.y += this.speedY;
        
        // Animation frame handling
        if(this.frameTimer > this.frameInterval){
            this.frameTimer = 0;
            if(this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;
        } else {
            this.frameTimer += this.frameInterval / 1000 * deltaTime;
        }
        
        // Small Zombie-specific behavior: move towards the player from left
        const player = this.game.player;
        if (player.x > this.x) this.speedX = -Math.abs(this.speedX); // move right
        
        // Use displayWidth for proper collision detection (not full spritesheet width)
        if(this.x > this.game.width) this.markedForDeletion = true; // delete when off right side
    }
    draw(context){
        if(this.game.debug) context.strokeRect(this.x, this.y, this.displayWidth, this.displayHeight);
        context.drawImage(this.image, this.frameX * this.width, 0, 
        this.width, this.height, this.x, this.y, this.displayWidth, this.displayHeight);
    }
}
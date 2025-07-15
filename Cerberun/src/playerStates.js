import { Dust, Fire, Splash} from "./particles.js";
import { CollisionAnimation } from "./collisionAnimation.js";
import { FloatingMessages } from "./floatingMessages.js";

const states = {
    SITTING: 0,
    RUNNING: 1,
    JUMPING: 2,
    FALLING: 3,
    ROLLING: 4,
    DIVING: 5,
    HIT: 6,
};

class State {
    constructor(state,game){
        this.state = state;
        this.game = game;
    }
}

export class Sitting extends State {
    constructor(game){
        super('SITTING', game);
    }
    enter() {
        this.game.player.frameX = 0;
        this.game.player.frameY = 5;
        this.game.player.maxFrame = 4; 
    }
    handleInput(input, deltaTime){
        if(input.includes('a') || input.includes('d')){
            this.game.player.setState(states.RUNNING, 1);
        } else if(input.includes('Enter') && this.game.canStartRollAttack()){
            this.game.player.setState(states.ROLLING, 1);
        }
    }
}
export class Running extends State {
    constructor(game){
        super('RUNNING', game);
    }
    enter() {
        this.game.player.frameX = 0;
        this.game.player.frameY = 3;
        this.game.player.maxFrame = 8;
    }
    handleInput(input, deltaTime){
        this.game.particles.unshift(new Dust(this.game, this.game.player.x + this.game.player.width * 0.6
        , this.game.player.y + this.game.player.height));
        if(input.includes('s')){
            this.game.player.setState(states.SITTING, 0);
        } else if(input.includes('w')){
            this.game.player.setState(states.JUMPING, 1);
        } else if(input.includes('Enter') && this.game.canStartRollAttack()){
            this.game.player.setState(states.ROLLING, 2);
        }
    }
}
export class Jumping extends State {
    constructor(game){
        super('JUMPING',game);
    }
    enter() {
        if(this.game.player.onGround()) this.game.player.vy -= 32;
        this.game.player.frameX = 0;
        this.game.player.maxFrame = 6; 
        this.game.player.frameY = 1;
    }
    handleInput(input, deltaTime){
        if(this.game.player.vy > this.game.player.weight){
            this.game.player.setState(states.FALLING, 1);
        } else if(input.includes('Enter') && this.game.canStartRollAttack()){
            this.game.player.setState(states.ROLLING, 2);
        } else if(input.includes('s')){
            this.game.player.setState(states.DIVING, 0);
        }
    }
}
export class Falling extends State {
    constructor(game){
        super('FALLING', game);
    }
    enter() {
        if(this.game.player.onGround()) this.game.player.vy -= 32;
        this.game.player.frameX = 0;
        this.game.player.maxFrame = 6; 
        this.game.player.frameY = 2;
    }
    handleInput(input, deltaTime){
        if(this.game.player.onGround()){
            this.game.player.setState(states.RUNNING, 1);
        }else if(input.includes('s')){
            this.game.player.setState(states.DIVING, 0);
        }
    }
}

export class Rolling extends State {
    constructor(game){
        super('ROLLING', game);
    }
    enter() {
        this.game.player.frameX = 0;
        this.game.player.maxFrame = 6; 
        this.game.player.frameY = 6;
    }
    handleInput(input, deltaTime){
        this.game.particles.unshift(new Fire(this.game, this.game.player.x + this.game.player.width * 0.5
        , this.game.player.y + this.game.player.height * 0.5));
        
        // Drain energy while rolling
        if (input.includes('Enter')) {
            const hasEnergy = this.game.drainEnergyForRoll(deltaTime);
            if (!hasEnergy) {
                // Out of energy, stop rolling
                if (this.game.player.onGround()) {
                    this.game.player.setState(states.RUNNING, 1);
                } else {
                    this.game.player.setState(states.FALLING, 1);
                }
                return;
            }
        }
        
        if(!input.includes('Enter') && this.game.player.onGround()){
            this.game.player.setState(states.RUNNING, 1);
        } else if(!input.includes('Enter') && !this.game.player.onGround()){
            this.game.player.setState(states.FALLING, 1);
        } else if(input.includes('Enter') && input.includes('w') && this.game.player.
        onGround()){
            this.game.player.vy -= 32; // jump while rolling
        }
        else if(input.includes('s') && !
        this.game.player.onGround()){
            this.game.player.setState(states.DIVING, 0);
        }
    }
}

export class Diving extends State {
    constructor(game){
        super('DIVING', game);
    }
    enter() {
        this.game.player.frameX = 0;
        this.game.player.maxFrame = 6; 
        this.game.player.frameY = 6;
        this.game.player.vy = 15; // set vertical speed for diving
    }
    handleInput(input, deltaTime){
        this.game.particles.unshift(new Fire(this.game, this.game.player.x + this.game.player.width * 0.5
        , this.game.player.y + this.game.player.height * 0.5));
        if(this.game.player.onGround()){
            this.game.player.setState(states.RUNNING, 1);
            for(let i = 0; i < 30; i++){
                this.game.particles.unshift(new Splash(this.game, this.game.player.x + this.game.player.width * 0.5, 
                this.game.player.y + this.game.player.height * 0.5));
            }
            
            // AOE damage effect - defeat enemies within range
            this.createDivingAOE();
        } else if(input.includes('Enter') && this.game.player.onGround() && this.game.canStartRollAttack()){
            this.game.player.setState(states.ROLLING, 2);
        } 
    }
    
    createDivingAOE() {
        const player = this.game.player;
        const aoeRange = 200; 
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        // Check all enemies for AOE damage
        this.game.enemies.forEach(enemy => {
            // Use displayWidth/Height if enemy has scaling, otherwise use normal width/height
            const enemyWidth = enemy.displayWidth || enemy.width;
            const enemyHeight = enemy.displayHeight || enemy.height;
            const enemyCenterX = enemy.x + enemyWidth / 2;
            const enemyCenterY = enemy.y + enemyHeight / 2;
            
            // Calculate distance between player and enemy centers
            const distance = Math.sqrt(
                Math.pow(playerCenterX - enemyCenterX, 2) + 
                Math.pow(playerCenterY - enemyCenterY, 2)
            );
            
            // If enemy is within AOE range, defeat it
            if (distance <= aoeRange) {
                enemy.markedForDeletion = true;
                
                // Create collision animation at enemy position
                this.game.collisions.push(new CollisionAnimation(this.game, 
                    enemyCenterX, enemyCenterY));
                
                // Add score and floating message
                this.game.score += 2; 
                this.game.floatingMessages.push(new FloatingMessages('+2 AOE!', 
                    enemy.x, enemy.y, 150, 50));
                
                // Play sound effect if enabled
                if (this.game.isSoundEnabled()) {
                    const collisionSound = player.sound.cloneNode(true);
                    collisionSound.volume = 0.3; // Quieter for multiple enemies
                    collisionSound.play().catch(e => console.log('AOE audio play failed:', e));
                }
            }
        });
    }
}

export class Hit extends State {
    constructor(game){
        super('HIT', game);
    }
    enter() {
        this.game.player.frameX = 0;
        this.game.player.maxFrame = 10; 
        this.game.player.frameY = 4;
    }
    handleInput(input, deltaTime){
        if(this.game.player.frameX >= 10 && this.game.player.onGround()){
            this.game.player.setState(states.RUNNING, 1);
        } else if(this.game.player.frameX >= 10 && !this.game.player.onGround()){
            this.game.player.setState(states.FALLING, 1);
        } 
    }
}
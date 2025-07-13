class Particles {
    constructor (game) {
        this.game = game;
        this.markedForDeletion = false;
    }
    update(){
        this.x -= this.speedX + this.game.speed;
        this.y -= this.speedY;
        this.size *= 0.97; // gradually reduce size
        if(this.size < 0.5) this.markedForDeletion = true; // mark for deletion if too small
    }
}

export class Dust extends Particles {
    constructor(game, x, y){
        super(game);
        this.size = Math.random() * 10 + 10; 
        this.x = x;
        this.y = y;
        this.speedX = Math.random();
        this.speedY = Math.random();
        this.color = 'rgba(0, 0, 0, 0.1)';
    }
    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
    }
}

export class Splash extends Particles  {
    constructor(game, x, y){
        super(game);
        this.size = Math.random() * 100 + 100; // random size between 100 and 200
        this.x = x - this.size * 0.5; // center the splash
        this.y = y - this.size * 0.5; // center the splash
        this.speedX = Math.random() * 6 - 4;
        this.speedY = Math.random() * 2 + 2;
        this.gravity = 0;
        this.image = document.getElementById('fire');
    }
    update() {
        super.update();
        this.gravity += 0.1; // simulate gravity effect
        this.y += this.gravity; // apply gravity to y position

    }
    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
}


export class Fire extends Particles {
    constructor(game, x, y){
        super(game);
        this.image = document.getElementById('fire');
        this.size = Math.random() * 100 + 100; // random size between 50 and 100
        this.x = x;
        this.y = y;
        this.speedX = 1;
        this.speedY = 1;
        this.angle = 0;
        this.va = Math.random() * 0.2 + 0.1; // random angle speed
    }
    update(){
        super.update();
        this.angle += this.va; // update angle
        this.x += Math.sin(this.angle * 5);
    }
    draw(context){
        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.angle); // rotate based on angle
        context.drawImage(this.image, -this.size * 0.5, -this.size * 0.5, this.size, this.size);
        context.restore();
    }
}


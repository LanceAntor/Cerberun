export class InputHandler{
    constructor(game){
        this.game = game;
        this.keys = [];
        window.addEventListener('keydown', e => {
            if((    e.key === 's' ||
                    e.key === 'w' ||
                    e.key === 'a' ||
                    e.key === 'd' ||
                    e.key === 'Enter'
                ) && this.keys.indexOf(e.key) === -1){
                this.keys.push(e.key);
            } else if(e.key === 'p') this.game.debug = !this.game.debug; // Changed debug key to 'p'
        });
        window.addEventListener('keyup', e => {
            if(   e.key === 's' ||
                    e.key === 'w' ||
                    e.key === 'a' ||
                    e.key === 'd' ||
                    e.key === 'Enter') {
                this.keys.splice(this.keys.indexOf(e.key), 1); 
                console.log(e.key, this.keys);  // Moved inside the if block
            }
        });
    }
}
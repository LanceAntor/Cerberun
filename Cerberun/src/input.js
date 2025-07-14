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
            } 
            // else if(e.key === 'p') this.game.debug = !this.game.debug; // DEBUG TOGGLE - COMMENTED OUT
            // else if(e.key === 'f' || e.key === 'F') this.toggleFullscreen(); // Fullscreen toggle - COMMENTED OUT
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
    
    // COMMENTED OUT - Fullscreen toggle functionality (can be re-enabled later)
    /*
    toggleFullscreen() {
        const canvas = document.getElementById('canvas1');
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    */
}
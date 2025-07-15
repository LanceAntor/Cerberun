export class UI {
    constructor(game){
        this.game = game;
        this.fontSize = 30;
        this.fontFamily = 'Helvetica';
        this.livesImage = document.getElementById('lives');
    }
    draw(context){
        context.save();
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowColor = 'white';
        context.shadowBlur = 0;
        context.font = this.fontSize + 'px ' + this.fontFamily;
        context.textAlign = 'left';
        context.fillStyle = this.game.fontColor;
        //score
        context.fillText('Score: ' + this.game.score, 20, 50);
        //timer
        context.font = this.fontSize * 0.8 + 'px ' + this.fontFamily;
        context.fillText('Time: ' + (this.game.time * 0.001).toFixed(1), 20 ,80);
        //lives
        for (let i = 0; i < this.game.lives; i++){  
            context.drawImage(this.livesImage, 25 * i + 20, 95, 25, 25);
        }
        
        // Energy bar (top right)
        this.drawEnergyBar(context);
        
        // Controls info (top right)
        // context.font = this.fontSize * 0.5 + 'px ' + this.fontFamily;
        // context.textAlign = 'right';
        // context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        // context.fillText('WASD: Move | Enter: Roll', this.game.width - 20, 30);
        // // context.fillText('WASD: Move | Enter: Roll | P: Debug', this.game.width - 20, 30); // OLD with debug toggle
        // context.fillText('WASD: Move | Enter: Roll | F: Fullscreen | P: Debug', this.game.width - 20, 30); // OLD with fullscreen toggle
        // game over message
        // if(this.game.gameOver){
        //     context.textAlign = 'center';
        //     context.font = this.fontSize * 2 + 'px ' + this.fontFamily;
        //     if(this.game.score > this.game.winningScore){
        //         context.fillText('You win! Press R to restart', this.game.width * 0.5, this.game.height * 0.5 + 40);
        //     } else {
        //         context.fillText('Game Over', this.game.width * 0.5, this.game.height * 0.5);
        //         context.font = this.fontSize * 0.8 + 'px ' + this.fontFamily;
        //     }
        // }
        context.restore();
    }
    
    drawEnergyBar(context) {
        const barWidth = 200;
        const barHeight = 20;
        const barX = this.game.width - barWidth - 20; // 20px from right edge
        const barY = 40; 
        
        // Energy bar background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Energy bar border
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 2;
        context.strokeRect(barX, barY, barWidth, barHeight);
        
        // Energy bar fill
        const energyPercentage = this.game.energy / this.game.maxEnergy;
        const fillWidth = barWidth * energyPercentage;
        
        // Color changes based on energy level
        if (energyPercentage > 0.6) {
            context.fillStyle = '#616462ff'; 
        } else if (energyPercentage > 0.3) {
            context.fillStyle = '#919191ff'; 
        } else {
            context.fillStyle = '#d2d2d2ff'; 
        }
        
        context.fillRect(barX, barY, fillWidth, barHeight);
        
        // Energy text
        context.font = '14px Helvetica';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText('ENERGY', barX + barWidth / 2, barY - 8);
        
        // // Energy value text
        // context.font = '12px Helvetica';
        // context.fillStyle = 'black';
        // context.fillText(Math.ceil(this.game.energy) + '/' + this.game.maxEnergy, barX + barWidth / 2, barY + barHeight + 15);
    }
}
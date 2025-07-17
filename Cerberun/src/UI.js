export class UI {
    constructor(game){
        this.game = game;
        this.fontSize = 30;
        this.fontFamily = 'Creepster';
        this.livesImage = document.getElementById('lives');
    }
    draw(context){
        context.save();
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 1;
        context.shadowColor = 'white';
        context.shadowBlur = 0;
        context.font = this.fontSize + 'px ' + this.fontFamily;
        context.textAlign = 'left';
        context.fillStyle = this.game.fontColor;
        //score with target
        const stageTarget = this.game.getCurrentStageTarget();
        context.fillText(`Score: ${this.game.score}/${stageTarget}`, 20, 50);
        //timer
        context.font = this.fontSize * 0.8 + 'px ' + this.fontFamily;
        const remainingTime = Math.max(0, (this.game.time * 0.001).toFixed(1));
        context.fillText('Time: ' + remainingTime, 20 ,80);
        
        // Stage info
        context.font = this.fontSize * 0.7 + 'px ' + this.fontFamily;
        // Stage counter
        context.fillText(`Stage ${this.game.currentStage <= 5 ? this.game.currentStage : 'Endless Forest'}`, 20, 110);
        
        //lives
        for (let i = 0; i < this.game.lives; i++){  
            context.drawImage(this.livesImage, 25 * i + 20, 115, 25, 25);
        }
        
        // Energy bar (top right)
        this.drawEnergyBar(context);
        
        // Stage Display Popup
        if (this.game.showingStage) {
            this.drawStageDisplay(context);
        }
        
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
        context.font = '14px Nosifer';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('ENERGY', barX + barWidth / 2, barY - 8);
        
        // // Energy value text
        // context.font = '12px Creepster';
        // context.fillStyle = 'black';
        // context.fillText(Math.ceil(this.game.energy) + '/' + this.game.maxEnergy, barX + barWidth / 2, barY + barHeight + 15);
    }
    
    drawStageDisplay(context) {
        // Semi-transparent overlay
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, this.game.width, this.game.height);
        
        // Animation timing
        const totalDuration = 3000; 
        const slideInDuration = 500; 
        const stayDuration = 2000;
        const slideOutDuration = 500; 
        
        const currentTime = this.game.stageDisplayTime;
        
        // Calculate animation position
        let offsetX = 0;
        
        if (currentTime <= slideInDuration) {
            // Slide in from left
            const progress = currentTime / slideInDuration;
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            offsetX = -this.game.width * (1 - easeProgress);
        } else if (currentTime <= slideInDuration + stayDuration) {
            // Stay in center
            offsetX = 0;
        } else {
            // Slide out to right
            const slideOutStartTime = slideInDuration + stayDuration;
            const progress = (currentTime - slideOutStartTime) / slideOutDuration;
            const easeProgress = Math.pow(progress, 3); // Ease in cubic
            offsetX = this.game.width * easeProgress;
        }
        
        // Stage text
        context.textAlign = 'center';
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 4;
        
        // Main stage text
        context.font = '160px Creepster';
        let stageText;
        if (this.game.endlessMode) {
            stageText = "ENDLESS FOREST";
        } else {
            stageText = `STAGE ${this.game.currentStage}`;
        }
        const centerX = this.game.width / 2 + offsetX;
        const centerY = this.game.height / 2 - 50;
        
        context.strokeText(stageText, centerX, centerY);
        context.fillText(stageText, centerX, centerY);
        
        // Points required text (only show for stages 1-5)
        if (this.game.currentStage <= 5 && !this.game.endlessMode) {
            context.font = '50px Creepster';
            const targetScore = this.game.getCurrentStageTarget();
            const pointsText = `POINTS REQUIRED: ${targetScore}`;
            
            context.strokeText(pointsText, centerX, centerY + 50);
            context.fillText(pointsText, centerX, centerY + 50);
        } else if (this.game.endlessMode) {
            context.font = '50px Creepster';
            const surviveText = "SURVIVE AS LONG AS YOU CAN!";
            
            context.strokeText(surviveText, centerX, centerY + 50);
            context.fillText(surviveText, centerX, centerY + 50);
        }
        
        // Reset text alignment
        context.textAlign = 'left';
    }
}
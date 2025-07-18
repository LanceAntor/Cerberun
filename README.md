# Cerberun

Cerberun is a fast-paced action platformer where players dodge enemies, collect power-ups, and climb the global leaderboard. Designed for both casual and competitive gamers, Cerberun features dynamic difficulty, unique stages, and real-time online scoring powered by Firebase.

## Visual Demo

### Home Screen
![Home Screen Screenshot](static/cerberun_screenshots/homepage.jpg)
*Cerberun home screen with leaderboard and game start options*

### Gameplay
![Gameplay Screenshot](static/cerberun_screenshots/gameplay.jpg)
*In-game action showing player dodging enemies and collecting hearts*

### Leaderboard
![Leaderboard Screenshot](static/cerberun_screenshots/leaderboard.jpg)
*Global leaderboard with online scores and player rankings*

## Features

- **Dynamic Difficulty**: Stages become more challenging as you progress, with new enemy types and spawn rates.
- **Endless Mode**: Survive past stage 5 to enter the "Endless Forest"—an infinite challenge with unique music and visuals.
- **Invulnerability Mechanic**: After taking damage, players gain temporary invulnerability to recover and reposition. Enemies pass through you and cannot be defeated during this time.
- **Collectibles**: Grab clocks to extend time and hearts to restore lives.
- **Global Leaderboard**: Compete with players worldwide using real-time Firebase integration.
- **Sound & Visual Effects**: Immersive audio cues for stage transitions, power-ups, and endless mode.

## Installation

```bash
# Clone the repository
git clone https://github.com/LanceAntor/Cerberun.git
cd Cerberun

# Install dependencies (if using Node.js for build tools)
npm install

# Start the development server
npm run dev

```
## Usage

- **Play the Game**: Use keyboard controls to run, jump, roll, dive, and sit. Dodge enemies and collect power-ups.
- **Difficulty Scaling**: Each stage increases enemy spawn rates and introduces new enemy types.
- **Endless Forest**: After stage 5, the game enters endless mode with special music and infinite challenge.
- **Invulnerability**: After getting hit, you are invulnerable for a short period—enemies pass through you and cannot be defeated during this time.
- **Collectibles**: Clocks add time, hearts restore lives. Only a limited number can appear at once.
- **Leaderboard**: Submit your score and see how you rank globally.

## Built With

- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
- ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
- ![Font Awesome](https://img.shields.io/badge/Font%20Awesome-528DD7?style=for-the-badge&logo=fontawesome&logoColor=white)

## Acknowledgements

- **[Firebase](https://firebase.google.com/)**: Real-time database and authentication for leaderboard and online features.
- **[Font Awesome](https://fontawesome.com/)**: For icons used in UI and leaderboard.
- **[Vercel](https://vercel.com/)**: For seamless deployment and hosting.
- **[OpenGameArt](https://opengameart.org/)**: For free game art assets.
- **[Bevouliin](https://bevouliin.com/)**: For game graphics and resources.
- **[Pixabay](https://pixabay.com/)**: For royalty-free images and sounds.
- **Open Source Libraries**: Various JavaScript utilities for animation, sound, and game logic.

## Deployed on Vercel

Play Cerberun online: [https://cerberun25.vercel.app/](https://cerberun25.vercel.app/)

---

&copy; 2025 Cerberun. All rights reserved.

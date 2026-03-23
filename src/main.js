// Функция для запуска музыки (вызывай из Menu.js или Game.js)
function playBackgroundMusic(scene, key, { loop = true, volume = 0.5 } = {}) {
    // Создаем музыку только один раз
    if (!game.backgroundMusic) {
        game.backgroundMusic = scene.sound.add(key, { loop, volume });
        game.backgroundMusic.play();
    } else if (game.backgroundMusic.paused) {
        game.backgroundMusic.resume();
    }
}

// Функция для обновления состояния музыки при переключении настроек
function updateMusicState(scene) {
    if (game.backgroundMusic) {
        if (scene.musicEnabled) {
            if (game.backgroundMusic.paused) {
                game.backgroundMusic.resume();
            }
        } else {
            game.backgroundMusic.pause();
        }
    }
}


const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: GAME_CONFIG.backgroundColor,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [Boot, Preload, Menu, Game, Pause, GameOver]
};

const game = new Phaser.Game(config);

window.playBackgroundMusic = playBackgroundMusic;
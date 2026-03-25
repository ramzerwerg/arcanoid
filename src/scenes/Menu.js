class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
        this.musicEnabled = true;
        this.soundEnabled = true; 
    }

    create() {
        const { width, height } = this.game.config;
        
        let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
        bg.displayWidth = width
        bg.displayHeight = height;

        // Заголовок
        let logo = this.add.image(width / 2, height / 3, 'logo').setOrigin(0.5, 0.5);
        
        // this.add.text(width / 2, height / 3, 'ARKANOID', {
        //     font: '60px Arial',
        //     color: '#87ec6e',
        //     fontStyle: 'bold'
        // }).setOrigin(0.5);

        // Кнопка старта
        const startButton = this.add.text(width / 2, height / 2, 'Начать игру', {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: '34px',  
            color: '#ffffff',
            backgroundColor: '#19b826',
            padding: { x: 40, y: 20 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('Game', { level: 0 });
        });

        // Анимация кнопки
        this.tweens.add({
            targets: startButton,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Инструкция
        this.add.text(width / 2, height * 0.7, 'Управление: Мышь/Тач или < >', {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: '24px',  
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 6,
            align: "center",
            wordWrap: {                   // Перенос слов
                width: 250,
            },  
        }).setOrigin(0.5);

        playBackgroundMusic(this, 'backgroundMusic', { volume: 0.3 });
    }
}
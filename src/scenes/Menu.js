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
        logo.setAlpha(0);
        logo.setScale(0.5);

        // Кнопка старта
        const startButton = this.add.image(width / 2, height / 2, 'start_btn').setOrigin(0.5, 0.5).setInteractive();

        startButton.setAlpha(0);
        startButton.setScale(1.4);

        startButton.on('pointerdown', () => {
            this.scene.start('Game', { level: 0 });
        });

        // Инструкция
        const instructionText = width < UI.MOBILE_BREAKPOINT 
            ? "Управление: двигайте платформой с помощью пальца" 
            : "Управление: Мышью или < >";
        
        const instruction = this.add.text(width / 2, height * 0.7, instructionText, {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: '24px',
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 6,
            align: "center",
            wordWrap: {
                width: 420,
            },
        }).setOrigin(0.5);

        instruction.setAlpha(0);

        // Анимация появления
        this.tweens.add({
            targets: logo,
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: 'Back.out',
            delay: 200
        });

        this.tweens.add({
            targets: startButton,
            alpha: 1,
            scale: 1.5,
            duration: 800,
            ease: 'Back.out',
            delay: 200,
            onComplete: () => {
                // Анимация кнопки после появления
                this.tweens.add({
                    targets: startButton,
                    scaleX: 1.7,
                    scaleY: 1.7,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        this.tweens.add({
            targets: instruction,
            alpha: 1,
            duration: 500,
            delay: 800
        });

        playBackgroundMusic(this, 'backgroundMusic', { volume: 1 });
    }
}
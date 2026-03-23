class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const { width, height } = this.game.config;

        // Заголовок
        this.add.text(width / 2, height / 3, 'ARKANOID', {
            font: '60px Arial',
            color: '#87ec6e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Кнопка старта
        const startButton = this.add.text(width / 2, height / 2, 'НАЧАТЬ ИГРУ', {
            font: '40px Arial',
            color: '#ffffff',
            backgroundColor: '#51b139',
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
        this.add.text(width / 2, height * 0.7, 'Управление: Мышь/Тач или Стрелки', {
            fontSize: '24px',
            fontFamily: 'sans-serif',
            color: '#888888'
        }).setOrigin(0.5);
    }
}
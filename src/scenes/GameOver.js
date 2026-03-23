class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.win = data.win;
        this.score = data.score;
    }

    create() {
        const { width, height } = this.game.config;

        const title = this.win ? 'ПОБЕДА!' : 'ИГРА ОКОНЧЕНА';
        const color = this.win ? '#4ecdc4' : '#ff6b6b';

        this.add.text(width / 2, height / 3, title, {
            font: '60px Arial',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, `Финальный счет: ${this.score}`, {
            font: '40px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        const restartButton = this.add.text(width / 2, height * 0.65, 'ИГРАТЬ СНОВА', {
            font: '40px Arial',
            color: '#ffffff',
            backgroundColor: '#00d9ff',
            padding: { x: 40, y: 20 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.start('Game', { level: 0, score: 0, lives: 3 });
        });

        const menuButton = this.add.text(width / 2, height * 0.8, 'В МЕНЮ', {
            font: '30px Arial',
            color: '#888888'
        }).setOrigin(0.5).setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.start('Menu');
        });
    }
}
class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        // Показываем прогресс загрузки
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 500, 320, 50);

        const loadingText = this.add.text(400, 450, 'Загрузка...', {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00d9ff, 1);
            progressBar.fillRect(250, 510, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Загрузка всех ассетов
        this.load.setPath('assets/images/');
        this.load.image('paddle', 'paddle.png');
        this.load.image('ball', 'ball.png');
        this.load.image('brick1', 'brick1.png');
        this.load.image('brick2', 'brick2.png');
        this.load.image('brick3', 'brick3.png');

        this.load.setPath('assets/audio/');
        this.load.audio('hit', 'hit.mp3');
        this.load.audio('bounce', 'bounce.mp3');
        this.load.audio('win', 'win.mp3');
        this.load.audio('lose', 'lose.mp3');
    }

    create() {
        this.scene.start('Menu');
    }
}
class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        // Показываем прогресс загрузки
        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();
        progressBox.fillStyle(0x414141, 1);
        progressBox.fillRect(210, 550, 320, 50);

        const loadingText = this.add.text(400, 450, 'Загрузка...', {
            fontSize: UI.LAUNCH_TEXT_SIZE,
            fontFamily: UI.TEXT_FONT,
            color: '#ffffff',
            stroke: '#414141',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xaaddaa, 1);
            progressBar.fillRect(220, 560, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Загрузка всех ассетов
        this.load.setPath('assets/images/');
        this.load.image('paddle', 'paddle.png');
        this.load.image('paddle_2', 'paddle_2.png');
        this.load.image('ball', 'ball.png');
        this.load.image('brick1', 'brick1.png');
        this.load.image('brick2', 'brick2.png');
        this.load.image('brick3', 'brick3.png');
        this.load.image('brickTNT', 'brickTNT.png');
        this.load.image('bg', 'bg.png');
        this.load.image('bg_arena', 'bg_arena.png');
        this.load.image('logo', 'bg_arena.png');
        this.load.image('bonus_expand', 'bonus_expand.png');
        this.load.image('bonus_ball', 'bonus_ball.png');
        this.load.image('bonus_speed', 'bonus_speed.png');
        this.load.image('start_btn', 'start_btn.png');
        this.load.image('menu_bar', 'menu_bar.png');
        this.load.image('btn', 'btn.png');
        this.load.image('pause', 'pause.png');
        
        this.load.setPath('assets/audio/');
        this.load.audio('hit', 'hit.mp3');
        this.load.audio('bounce', 'bounce.mp3');
        this.load.audio('knock', 'knock.mp3');
        this.load.audio('win', 'win.mp3');
        this.load.audio('lose', 'lose.mp3');
        this.load.audio('backgroundMusic', 'backgroundMusic.mp3');
        this.load.audio('bonus', 'bonus.mp3');
        this.load.audio('explosion', 'explosion.mp3');
    }

    create() {
        // Инициализируем AudioManager после загрузки всех звуков
        AudioManager.init(this);
        
        this.scene.start('Menu');
    }
}
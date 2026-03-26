class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.win = data.win;
        this.score = data.score;
        this.level = data.level ?? 0;
    }

    create() {
        const { width, height } = this.game.config;

        // Фон
        UIHelper.createBackground(this, 'bg');

        // Заголовок
        const title = this.win ? 'ПОБЕДА!' : 'ИГРА ОКОНЧЕНА';
        const color = this.win ? '#4ecdc4' : '#ff6b6b';

        this.add.text(width / 2, height / 2.4, title, {
            ...UIHelper.TEXT_STYLES.TITLE,
            color,
            stroke: '#414141',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Счет
        this.add.text(width / 2, height / 2.15, `Счет:${this.score}`, {
            fontSize: '25px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#414141',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Кнопки
        this.createButtons(width, height);
    }

    createButtons(width, height) {
        const restartButton = UIHelper.createButton(
            this,
            width / 2,
            height / 1.8,
            'НАЧАТЬ ЗАНОВО',
            () => this.restartGame()
        ).setAlpha(0);

        const menuButton = UIHelper.createButton(
            this,
            width / 2,
            height / 1.6,
            'В МЕНЮ',
            () => this.goToMenu()
        ).setAlpha(0);

        // Анимация появления
        this.tweens.add({
            targets: restartButton,
            alpha: 1,
            delay: 200,
            duration: 400
        });

        this.tweens.add({
            targets: menuButton,
            alpha: 1,
            delay: 400,
            duration: 400
        });
    }

    restartGame() {
        this.scene.start('Game', { level: this.level, score: 0, lives: 3 });
    }

    goToMenu() {
        this.scene.start('Menu');
    }
}

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

        let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
        bg.displayWidth = width
        bg.displayHeight = height;

        const title = this.win ? 'ПОБЕДА!' : 'ИГРА ОКОНЧЕНА';
        const color = this.win ? '#4ecdc4' : '#ff6b6b';

        // Заголовок с тенью
        this.add.text(width / 2, height / 2.4, title, {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", Arial',
            color: color,
            stroke: '#414141',
            strokeThickness: 8,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Финальный счет
        this.add.text(width / 2, height / 2.15, `Счет:${this.score}`, {
            fontSize: '25px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#414141',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Кнопка "НАЧАТЬ ЗАНОВО"
        const restartButton = this.createBrickButton(
            width / 2,
            height / 1.8,
            'НАЧАТЬ ЗАНОВО',
            () => {
                // Запускаем тот же уровень с начала
                this.scene.start('Game', { level: this.level, score: 0, lives: 3 });
            }
        );

        // Кнопка "В МЕНЮ"
        const menuButton = this.createBrickButton(
            width / 2,
            height / 1.6,
            'В МЕНЮ',
            () => {
                this.scene.start('Menu');
            }
        );

        // Анимация появления
        restartButton.setAlpha(0);
        menuButton.setAlpha(0);

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

    // Создать кнопку с текстом внутри brick1
    createBrickButton(x, y, text, callback) {
        const padding = 25;
        const fontSize = 25;

        // Создаём временный текст для измерения
        const tempText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Получаем размеры текста
        const textBounds = tempText.getBounds();
        const buttonWidth = textBounds.width + padding * 2;
        const buttonHeight = textBounds.height + padding * 1.5;

        tempText.destroy();

        // Создаём контейнер для кнопки
        const container = this.add.container(x, y);

        // Фон из brick1 (растягиваем)
        const bg = this.add.image(0, 0, 'btn');
        bg.setDisplaySize(buttonWidth, buttonHeight);
        bg.setOrigin(0.5);

        // Текст
        const buttonText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 4,
        }).setOrigin(0.5);

        container.add([bg, buttonText]);
        container.setSize(buttonWidth, buttonHeight);

        // Сохраняем ссылки для обновления
        container.bg = bg;
        container.text = buttonText;

        // Делаем интерактивным
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setTint(0xcccccc);
            })
            .on('pointerout', () => {
                bg.clearTint();
            })
            .on('pointerdown', () => {
                bg.setTint(0x999999);
                callback();
            });

        return container;
    }
}

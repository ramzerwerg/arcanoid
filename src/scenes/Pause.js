class Pause extends Phaser.Scene {
    constructor() {
        super('Pause');
    }

    init(data) {
        this.previousScene = data.previousScene || 'Game';
        this.sceneData = data.sceneData || {};
    }

    create() {
        const { width, height } = this.game.config;

        // Затемнение фона
        this.overlay = UIHelper.createOverlay(this, 0.7)
            .setInteractive({ useHandCursor: true });

        // Меню
        this.createMenu(width, height);

        // Кнопки
        this.createButtons();

        // Обработка Esc
        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.resumeGame());

        // Останавливаем предыдущую сцену
        this.scene.pause(this.previousScene);

        // Анимация появления
        UIHelper.animatePopIn(this.menuContainer, 300);

        // Появление кнопок
        this.animateButtons();
    }

    createMenu(width, height) {
        const menuWidth = 400;
        const menuHeight = 320;
        const centerX = width / 2;
        const centerY = height / 2;

        this.menuContainer = this.add.container(centerX, centerY);
        this.menuBg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0xfdffff)
            .setOrigin(0.5)
            .setStrokeStyle(10, 0x777777);
        this.menuContainer.add(this.menuBg);

        const title = this.add.text(0, -120, 'ПАУЗА', {
            ...UIHelper.TEXT_STYLES.TITLE,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.menuContainer.add(title);
    }

    createButtons() {
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#414141',
            backgroundColor: '#fdffff',
            padding: { x: 30, y: 15 }
        };

        const buttonConfig = [
            { key: 'btnResume', text: '▶ Продолжить', y: -40, action: () => this.resumeGame() },
            { key: 'btnSound', text: this.getSFXButtonText(), y: 10, action: () => this.toggleSound() },
            { key: 'btnMusic', text: this.getMusicButtonText(), y: 60, action: () => this.toggleMusic() },
            { key: 'btnExit', text: 'Выйти в меню', y: 110, action: () => this.exitToMenu() }
        ];

        buttonConfig.forEach(config => {
            this[config.key] = this.add.text(0, config.y, config.text, buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => this[config.key].setStyle({ backgroundColor: '#e0e0e0' }))
                .on('pointerout', () => this[config.key].setStyle({ backgroundColor: '#fdffff' }))
                .on('pointerdown', () => config.action());
            this.menuContainer.add(this[config.key]);
        });
    }

    animateButtons() {
        const buttons = [this.btnResume, this.btnSound, this.btnMusic, this.btnExit];

        buttons.forEach((btn, i) => {
            btn.setAlpha(0);
            this.tweens.add({
                targets: btn,
                alpha: 1,
                delay: 100 + i * 80,
                duration: 200
            });
        });
    }

    getSFXButtonText() {
        return `Звуки:${AudioManager.isSFXEnabled() ? 'Вкл' : 'Выкл'}`;
    }

    getMusicButtonText() {
        return `Музыка:${AudioManager.isMusicEnabled() ? 'Вкл' : 'Выкл'}`;
    }

    toggleSound() {
        const isEnabled = AudioManager.toggleSFX();
        this.btnSound.setText(this.getSFXButtonText());
        // Обновляем цвет кнопки
        const newColor = isEnabled ? '#4CAF50' : '#f44336';
        this.btnSound.setStyle({ backgroundColor: newColor });
        this.btnSound.scene.time.delayedCall(150, () => {
            this.btnSound.setStyle({ backgroundColor: '#fdffff' });
        });
    }

    toggleMusic() {
        const isEnabled = AudioManager.toggleMusic();
        this.btnMusic.setText(this.getMusicButtonText());
        // Обновляем цвет кнопки
        const newColor = isEnabled ? '#4CAF50' : '#f44336';
        this.btnMusic.setStyle({ backgroundColor: newColor });
        this.btnMusic.scene.time.delayedCall(150, () => {
            this.btnMusic.setStyle({ backgroundColor: '#fdffff' });
        });
    }

    resumeGame() {
        this.destroyUI();
        this.scene.resume(this.previousScene);
        this.scene.stop();
    }

    exitToMenu() {
        this.destroyUI();
        this.scene.stop(this.previousScene);
        this.scene.start('Menu');
        this.scene.stop();
    }

    destroyUI() {
        [this.overlay, this.menuContainer, this.btnResume, this.btnSound, this.btnMusic, this.btnExit]
            .forEach(obj => obj?.destroy());
    }
}

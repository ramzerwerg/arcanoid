class Pause extends Phaser.Scene {
    constructor() {
        super('Pause');
    }

    init(data) {
        // Сохраняем ссылку на предыдущую сцену и её данные
        this.previousScene = data.previousScene || 'Game';
        this.sceneData = data.sceneData || {};
    }

    create() {
        const { width, height } = this.game.config;

        // === 1. Затемнение фона (оверлей) ===
        this.overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Клик по затемнению = продолжить (опционально)
                // this.resumeGame();
            });

        // === 2. Контейнер для меню (по центру) ===
        const menuWidth = 400;
        const menuHeight = 320;
        const menuX = width / 2;
        const menuY = height / 2;

        this.menuBg = this.add.rectangle(menuX, menuY, menuWidth, menuHeight, 0xfdffff)
            .setOrigin(0.5)
            .setStrokeStyle(10, 0x777777);

        // Заголовок
        this.add.text(menuX, menuY - 120, 'ПАУЗА', {
            fontSize: '40px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#414141',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // === 3. Кнопки меню ===
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#414141',
            backgroundColor: '#fdffff',
            padding: { x: 30, y: 15 },
            margin: { x:10, y: 15}
        };

        // Кнопка "Продолжить"
        this.btnResume = this.add.text(menuX, menuY - 40, '▶ Продолжить', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnResume.setStyle({ backgroundColor: '#e0e0e0' }))
            .on('pointerout', () => this.btnResume.setStyle({ backgroundColor: '#fdffff' }))
            .on('pointerdown', () => this.resumeGame());

        // Кнопка "Звуки: Вкл/Выкл"
        this.btnSound = this.add.text(menuX, menuY + 10, this.getSFXButtonText(), buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnSound.setStyle({ backgroundColor: '#e0e0e0' }))
            .on('pointerout', () => this.btnSound.setStyle({ backgroundColor: '#fdffff' }))
            .on('pointerdown', () => this.toggleSound());

        // Кнопка "Музыка: Вкл/Выкл"
        this.btnMusic = this.add.text(menuX, menuY + 60, this.getMusicButtonText(), buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnMusic.setStyle({ backgroundColor: '#e0e0e0' }))
            .on('pointerout', () => this.btnMusic.setStyle({ backgroundColor: '#fdffff' }))
            .on('pointerdown', () => this.toggleMusic());

        // Кнопка "Выйти в меню"
        this.btnExit = this.add.text(menuX, menuY + 110, 'Выйти в меню', {
            ...buttonStyle,
            backgroundColor: '#fdffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnExit.setStyle({ backgroundColor: '#e0e0e0' }))
            .on('pointerout', () => this.btnExit.setStyle({ backgroundColor: '#fdffff' }))
            .on('pointerdown', () => this.exitToMenu());

        // === 4. Обработка клавиши Esc ===
        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.resumeGame());

        // === 5. Останавливаем предыдущую сцену ===
        this.scene.pause(this.previousScene);

        // Анимация появления меню
        this.menuBg.setScale(0);
        this.tweens.add({
            targets: this.menuBg,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Кнопки появляются с задержкой
        [
            this.btnResume,
            this.btnSound,
            this.btnMusic,
            this.btnExit
        ].forEach((btn, i) => {
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
    }

    toggleMusic() {
        const isEnabled = AudioManager.toggleMusic();
        this.btnMusic.setText(this.getMusicButtonText());
    }

    resumeGame() {
        // Удаляем оверлей и меню для чистоты
        this.overlay?.destroy();
        this.menuBg?.destroy();
        this.btnResume?.destroy();
        this.btnSound?.destroy();
        this.btnMusic?.destroy();
        this.btnExit?.destroy();

        // Возвращаемся к игре
        this.scene.resume(this.previousScene);
        this.scene.stop();
    }

    exitToMenu() {
        // Очищаем паузу
        this.overlay?.destroy();
        this.menuBg?.destroy();

        // Останавливаем предыдущую сцену (игра) и переходим в меню
        this.scene.stop(this.previousScene);
        this.scene.start('Menu');
        this.scene.stop();
    }
}

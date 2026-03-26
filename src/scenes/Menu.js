class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const { width, height } = this.game.config;

        // Фон
        UIHelper.createBackground(this, 'bg');

        // Логотип
        this.logo = this.add.image(width / 2, height / 3, 'logo')
            .setOrigin(0.5, 0.5)
            .setScale(0.8)
            .setAlpha(0);

        // Кнопки
        this.createButtons(width, height);

        // Инструкция
        this.createInstruction(width, height);

        // Анимации появления
        this.animateIntro();

        // Музыка
        playBackgroundMusic(this, 'backgroundMusic', { volume: 1 });
    }

    createButtons(width, height) {
        const startButton = UIHelper.createButton(
            this,
            width / 2,
            height / 2.2,
            'НАЧАТЬ ИГРУ',
            () => this.startGame()
        ).setAlpha(0);

        const levelSelectButton = UIHelper.createButton(
            this,
            width / 2,
            height / 2 + 100,
            'ВЫБОР УРОВНЯ',
            () => this.scene.start('LevelSelect')
        ).setAlpha(0);

        // Кнопки настроек
        const settingsY = height / 2 + 190;
        const settingsGap = 250;
        const settingsX = width / 2 - settingsGap / 2;

        this.soundButton = UIHelper.createToggleButton(
            this,
            settingsX,
            settingsY,
            this.getSFXButtonText(),
            () => this.toggleSound(),
            AudioManager.isSFXEnabled()
        ).setAlpha(0);

        this.musicButton = UIHelper.createToggleButton(
            this,
            settingsX + settingsGap,
            settingsY,
            this.getMusicButtonText(),
            () => this.toggleMusic(),
            AudioManager.isMusicEnabled()
        ).setAlpha(0);

        // Сохраняем ссылки для анимации
        this.startButton = startButton;
        this.levelSelectButton = levelSelectButton;
    }

    createInstruction(width, height) {
        const isMobile = width < UI.MOBILE_BREAKPOINT;
        const instructionText = isMobile
            ? "Управление: двигайте платформой с помощью пальца"
            : "Управление: Мышью или < >";

        this.instruction = this.add.text(width / 2, height * 0.75, instructionText, {
            ...UIHelper.TEXT_STYLES.INSTRUCTION,
            align: "center",
            wordWrap: { width: 420 }
        }).setOrigin(0.5).setAlpha(0);
    }

    animateIntro() {
        // Логотип
        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: 'Back.out',
            delay: 200
        });

        // Кнопка старта с пульсацией
        this.tweens.add({
            targets: this.startButton,
            alpha: 1,
            scale: 1.3,
            duration: 800,
            ease: 'Back.out',
            delay: 200,
            onComplete: () => {
                this.tweens.add({
                    targets: this.startButton,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        // Остальные элементы
        this.tweens.add({
            targets: this.levelSelectButton,
            alpha: 1,
            delay: 400,
            duration: 300
        });

        this.tweens.add({
            targets: [this.soundButton, this.musicButton],
            alpha: 1,
            delay: 500,
            duration: 300
        });

        this.tweens.add({
            targets: this.instruction,
            alpha: 1,
            duration: 500,
            delay: 800
        });
    }

    startGame() {
        const maxLevel = GameStorage.getMaxLevel();
        const totalLevels = GameStorage.getTotalLevels();
        // Если все уровни пройдены, запускаем последний уровень
        const levelToStart = maxLevel > totalLevels ? totalLevels - 1 : maxLevel - 1;
        this.scene.start('Game', { level: levelToStart });
    }

    toggleSound() {
        // Разблокируем аудио на iOS
        if (AudioManager.isIOSDevice && !AudioManager.iosUnlocked) {
            AudioManager.forceUnlock(this);
        }

        const isEnabled = AudioManager.toggleSFX();
        UIHelper.updateToggleButton(this.soundButton, this.getSFXButtonText(), isEnabled);
    }

    toggleMusic() {
        // Разблокируем аудио на iOS
        if (AudioManager.isIOSDevice && !AudioManager.iosUnlocked) {
            AudioManager.forceUnlock(this);
        }

        const isEnabled = AudioManager.toggleMusic();
        UIHelper.updateToggleButton(this.musicButton, this.getMusicButtonText(), isEnabled);
    }

    getSFXButtonText() {
        return `ЗВУК:${AudioManager.isSFXEnabled() ? 'ВКЛ' : 'ВЫКЛ'}`;
    }

    getMusicButtonText() {
        return `МУЗЫКА:${AudioManager.isMusicEnabled() ? 'ВКЛ' : 'ВЫКЛ'}`;
    }
}

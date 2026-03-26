class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const { width, height } = this.game.config;

        let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
        bg.displayWidth = width
        bg.displayHeight = height;

        // Заголовок
        let logo = this.add.image(width / 2, height / 3, 'logo').setOrigin(0.5, 0.5);
        logo.setAlpha(0);
        logo.setScale(0.8);

        // Кнопка старта - запускает первый не пройденный уровень
        const startButton = this.createBrickButton(
            width / 2,
            height / 2.2,
            'НАЧАТЬ ИГРУ',
            () => {
                // Запускаем первый не пройденный уровень (maxLevel - это следующий для прохождения)
                const maxLevel = GameStorage.getMaxLevel();
                this.scene.start('Game', { level: maxLevel });
            }
        );

        startButton.setAlpha(0);

        // Кнопка выбора уровня
        const levelSelectButton = this.createBrickButton(
            width / 2, 
            height / 2 + 100, 
            'ВЫБОР УРОВНЯ',
            () => this.scene.start('LevelSelect')
        );

        // Кнопки настроек (звук и музыка)
        const settingsY = height / 2 + 190;
        const settingsGap = 290;
        const settingsX = width / 2 - settingsGap / 2;

        // Кнопка звука
        this.soundButton = this.createBrickButton(
            settingsX, 
            settingsY, 
            this.getSFXButtonText(),
            () => this.toggleSound()
        );

        // Кнопка музыки
        this.musicButton = this.createBrickButton(
            settingsX + settingsGap, 
            settingsY, 
            this.getMusicButtonText(),
            () => this.toggleMusic()
        );

        // Инструкция
        const instructionText = width < UI.MOBILE_BREAKPOINT
            ? "Управление: двигайте платформой с помощью пальца"
            : "Управление: Мышью или < >";

        const instruction = this.add.text(width / 2, height * 0.75, instructionText, {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: '18px',
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 4,
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
            scale: 1.3,
            duration: 800,
            ease: 'Back.out',
            delay: 200,
            onComplete: () => {
                this.tweens.add({
                    targets: startButton,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        this.tweens.add({
            targets: levelSelectButton,
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
            targets: instruction,
            alpha: 1,
            duration: 500,
            delay: 800
        });

        // playBackgroundMusic(this, 'backgroundMusic', { volume: 1 });

        this.music = this.sound.add('backgroundMusic', { loop: true, volume: 1 });
    
        // Отключаем паузу при потере фокуса
        this.sound.pauseOnBlur = false;

        // Ждём первого касания для разблокировки и запуска музыки
        this.input.once('pointerdown', () => {
            // Разблокируем звук
            this.sound.unlock();
            
            // Если звук разблокирован, запускаем музыку
            if (!this.sound.locked) {
                this.music.play();
            } else {
                // Если всё ещё заблокирован, ждём события разблокировки
                this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
                    this.music.play();
                });
            }
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

    // Создать маленькую кнопку настроек с brick1
    createBrickButtonSmall(x, y, text, callback, isEnabled) {
        const padding = 15;
        const fontSize = 14;
        
        // Создаём временный текст для измерения
        const tempText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 3,
        }).setOrigin(0.5);
        
        // Получаем размеры текста
        const textBounds = tempText.getBounds();
        const buttonWidth = textBounds.width + padding * 2;
        const buttonHeight = textBounds.height + padding * 1.5;
        
        tempText.destroy();
        
        // Создаём контейнер для кнопки
        const container = this.add.container(x, y);
        
        // Фон из brick1 (растягиваем)
        const bg = this.add.image(0, 0, 'brick1');
        bg.setDisplaySize(buttonWidth, buttonHeight);
        bg.setOrigin(0.5);
        
        // Тонировка в зависимости от состояния
        if (isEnabled) {
            bg.setTint(0x4CAF50); // Зелёный для ВКЛ
        } else {
            bg.setTint(0xf44336); // Красный для ВЫКЛ
        }
        
        // Текст
        const buttonText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 3,
        }).setOrigin(0.5);
        
        container.add([bg, buttonText]);
        container.setSize(buttonWidth, buttonHeight);
        
        // Делаем интерактивным
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                if (isEnabled) {
                    bg.setTint(0x66BB6A);
                } else {
                    bg.setTint(0xef5350);
                }
            })
            .on('pointerout', () => {
                if (isEnabled) {
                    bg.setTint(0x4CAF50);
                } else {
                    bg.setTint(0xf44336);
                }
            })
            .on('pointerdown', () => {
                if (isEnabled) {
                    bg.setTint(0x66BB6A);
                } else {
                    bg.setTint(0xef5350);
                }
                callback();
            });
        
        // Сохраняем ссылку на bg для обновления тона
        container.bg = bg;
        container.text = buttonText;
        
        return container;
    }

    getSFXButtonText() {
        return `ЗВУК:${AudioManager.isSFXEnabled() ? 'ВКЛ' : 'ВЫКЛ'}`;
    }

    getMusicButtonText() {
        return `МУЗЫКА:${AudioManager.isMusicEnabled() ? 'ВКЛ' : 'ВЫКЛ'}`;
    }

    toggleSound() {
        const isEnabled = AudioManager.toggleSFX();
        this.updateSoundButton(isEnabled);
    }

    toggleMusic() {
        const isEnabled = AudioManager.toggleMusic();
        this.updateMusicButton(isEnabled);
    }

    updateSoundButton(isEnabled) {
        if (this.soundButton) {
            this.soundButton.text.setText(this.getSFXButtonText());
            if (isEnabled) {
                this.soundButton.bg.clearTint();
                this.soundButton.bg.setTint(0x4CAF50);
            } else {
                this.soundButton.bg.clearTint();
                this.soundButton.bg.setTint(0xf44336);
            }
        }
    }

    updateMusicButton(isEnabled) {
        if (this.musicButton) {
            this.musicButton.text.setText(this.getMusicButtonText());
            if (isEnabled) {
                this.musicButton.bg.clearTint();
                this.musicButton.bg.setTint(0x4CAF50);
            } else {
                this.musicButton.bg.clearTint();
                this.musicButton.bg.setTint(0xf44336);
            }
        }
    }
}

class Pause extends Phaser.Scene {
    constructor() {
        super('Pause');
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 1;
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
        
        this.menuBg = this.add.rectangle(menuX, menuY, menuWidth, menuHeight, 0x1a1a2e)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0x00d9ff);
        
        // Заголовок
        this.add.text(menuX, menuY - 120, 'ПАУЗА', {
            font: '40px Arial',
            color: '#00d9ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // === 3. Кнопки меню ===
        const buttonStyle = {
            font: '24px Arial',
            color: '#ffffff',
            backgroundColor: '#00d9ff',
            padding: { x: 30, y: 15 },
            margin: { x:10, y: 15}
        };
        
        // Кнопка "Продолжить"
        this.btnResume = this.add.text(menuX, menuY - 40, '▶ Продолжить', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnResume.setStyle({ backgroundColor: '#00b8d9' }))
            .on('pointerout', () => this.btnResume.setStyle({ backgroundColor: '#00d9ff' }))
            .on('pointerdown', () => this.resumeGame());
        
        // Кнопка "Звуки: Вкл/Выкл"
        this.updateSoundButtonText();
        this.btnSound = this.add.text(menuX, menuY + 10, this.soundButtonText, buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnSound.setStyle({ backgroundColor: '#00b8d9' }))
            .on('pointerout', () => this.btnSound.setStyle({ backgroundColor: '#00d9ff' }))
            .on('pointerdown', () => this.toggleSound());
        
        // Кнопка "Музыка: Вкл/Выкл"
        this.updateMusicButtonText();
        this.btnMusic = this.add.text(menuX, menuY + 60, this.musicButtonText, buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnMusic.setStyle({ backgroundColor: '#00b8d9' }))
            .on('pointerout', () => this.btnMusic.setStyle({ backgroundColor: '#00d9ff' }))
            .on('pointerdown', () => this.toggleMusic());
        
        // Кнопка "Выйти в меню"
        this.btnExit = this.add.text(menuX, menuY + 110, '🏠 Выйти в меню', {
            ...buttonStyle,
            backgroundColor: '#ff6b6b'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.btnExit.setStyle({ backgroundColor: '#ee5a5a' }))
            .on('pointerout', () => this.btnExit.setStyle({ backgroundColor: '#ff6b6b' }))
            .on('pointerdown', () => this.exitToMenu());
        
        // === 4. Обработка клавиши Esc ===
        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.resumeGame());
        
        // === 5. Останавливаем предыдущую сцену ===
        this.scene.pause(this.previousScene);
        
        // === 6. Сохраняем состояние звуков из предыдущей сцены (если есть) ===
        const prevScene = this.scene.get(this.previousScene);
        if (prevScene?.soundEnabled !== undefined) {
            this.soundEnabled = prevScene.soundEnabled;
        }
        if (prevScene?.musicEnabled !== undefined) {
            this.musicEnabled = prevScene.musicEnabled;
        }
        this.updateSoundButtonText();
        this.updateMusicButtonText();

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
    
    updateSoundButtonText() {
        this.soundButtonText = `🔊 Звуки: ${this.soundEnabled ? 'Вкл' : 'Выкл'}`;
        if (this.btnSound) {
            this.btnSound.setText(this.soundButtonText);
        }
    }
    
    updateMusicButtonText() {
        this.musicButtonText = `🎵 Музыка: ${this.musicEnabled ? 'Вкл' : 'Выкл'}`;
        if (this.btnMusic) {
            this.btnMusic.setText(this.musicButtonText);
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundButtonText();

        // Глушим/включаем ТОЛЬКО звуковые эффекты, не трогая музыку
        // Музыка управляется отдельно через game.backgroundMusic и toggleMusic()
        const prevScene = this.scene.get(this.previousScene);
        if (prevScene?.sound) {
            prevScene.sound.setMute(!this.soundEnabled);
        }

        // Важно: если музыка была включена, убеждаемся, что она играет
        if (this.musicEnabled && game.backgroundMusic) {
            if (game.backgroundMusic.paused) {
                game.backgroundMusic.resume();
            }
        }

        // Сохраняем в предыдущую сцену
        if (prevScene) {
            prevScene.soundEnabled = this.soundEnabled;
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.updateMusicButtonText();
        
        // Управление фоновой музыкой
        if (this.musicEnabled) {
            // Если есть фоновая музыка — включаем
            if (this.game.backgroundMusic?.isPaused) {
                this.game.backgroundMusic?.resume();
            }
        } else {
            this.game.backgroundMusic?.pause();
        }
        
        // Сохраняем в предыдущую сцену
        const prevScene = this.scene.get(this.previousScene);
        if (prevScene) {
            prevScene.musicEnabled = this.musicEnabled;
        }

        updateMusicState(this);
    }
    
    resumeGame() {
        // Сохраняем настройки в предыдущую сцену
        const prevScene = this.scene.get(this.previousScene);
        if (prevScene) {
            prevScene.soundEnabled = this.soundEnabled;
            prevScene.musicEnabled = this.musicEnabled;
        }
        
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
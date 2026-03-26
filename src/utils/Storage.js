// Управление прогрессом и настройками игры
const GameStorage = {
    KEYS: {
        MAX_LEVEL: 'arkanoid_max_level',
        SOUND_ENABLED: 'arkanoid_sound_enabled',
        MUSIC_ENABLED: 'arkanoid_music_enabled'
    },

    // Получить максимальный пройденный уровень
    // Возвращает номер следующего уровня для прохождения
    getMaxLevel() {
        return parseInt(localStorage.getItem(this.KEYS.MAX_LEVEL) || '1', 10);
    },

    // Установить максимальный пройденный уровень
    setMaxLevel(level) {
        const newMax = level + 1;
        const currentMax = this.getMaxLevel();
        if (newMax > currentMax) {
            localStorage.setItem(this.KEYS.MAX_LEVEL, newMax.toString());
        }
    },

    // Получить количество доступных уровней
    getTotalLevels() {
        return typeof LEVELS !== 'undefined' ? LEVELS.length : 0;
    },

    // Проверить, доступен ли уровень
    isLevelUnlocked(level) {
        return level <= this.getMaxLevel();
    },

    // Получить настройки звука
    getSoundEnabled() {
        const value = localStorage.getItem(this.KEYS.SOUND_ENABLED);
        return value !== null ? value === 'true' : true;
    },

    // Установить настройки звука
    setSoundEnabled(enabled) {
        localStorage.setItem(this.KEYS.SOUND_ENABLED, enabled.toString());
    },

    // Получить настройки музыки
    getMusicEnabled() {
        const value = localStorage.getItem(this.KEYS.MUSIC_ENABLED);
        return value !== null ? value === 'true' : true;
    },

    // Установить настройки музыки
    setMusicEnabled(enabled) {
        localStorage.setItem(this.KEYS.MUSIC_ENABLED, enabled.toString());
    },

    // Сбросить весь прогресс
    resetProgress() {
        localStorage.removeItem(this.KEYS.MAX_LEVEL);
    },

    // Сбросить все настройки
    resetSettings() {
        localStorage.removeItem(this.KEYS.SOUND_ENABLED);
        localStorage.removeItem(this.KEYS.MUSIC_ENABLED);
    }
};

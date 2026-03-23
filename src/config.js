// src/config.js
const GAME_CONFIG = {
    width: 720,
    height: 1280,
    backgroundColor: 0x1a1a2e,  // ✅ Было: '#1a1a2e'
    paddle: {
        width: 120,
        height: 20,
        speed: 800,
        color: 0x00d9ff  // ✅ Было: '#00d9ff'
    },
    ball: {
        radius: 10,
        speed: 500,
        color: 0xff6b6b  // ✅ Было: '#ff6b6b'
    },
    brick: {
        width: 60,
        height: 25,
        gap: 5
    }
};
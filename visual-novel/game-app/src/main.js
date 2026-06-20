import Phaser from 'phaser';
import Preloader from './scenes/Preloader.js';
import VisualNovelScene from './scenes/VisualNovelScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [Preloader, VisualNovelScene]
};

const game = new Phaser.Game(config);

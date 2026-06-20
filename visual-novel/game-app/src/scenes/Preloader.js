import Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Show a basic loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: 'Loading...',
      style: { font: '20px monospace', fill: '#ffffff' }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Load JSON story data
    this.load.json('scene001', 'assets/scene001.json');

    // Load backgrounds
    this.load.image('bg-apartment', 'assets/image-scenes/apartment.png');
    this.load.image('bg-classroom', 'assets/image-scenes/classroom.png');
    this.load.image('bg-corner-store', 'assets/image-scenes/corner-store.png');
    this.load.image('bg-post-office', 'assets/image-scenes/post-office.png');

    // Load characters
    this.load.image('char-alex', 'assets/image-characters/alex.png');
    this.load.image('char-akiko', 'assets/image-characters/akiko.png');
    this.load.image('char-carlos', 'assets/image-characters/carlos.png');
    this.load.image('char-hiroshi', 'assets/image-characters/hiroshi.png');
    this.load.image('char-kenji', 'assets/image-characters/kenji.png');
    this.load.image('char-min-ji', 'assets/image-characters/min-ji.png');
  }

  create() {
    this.scene.start('VisualNovelScene');
  }
}

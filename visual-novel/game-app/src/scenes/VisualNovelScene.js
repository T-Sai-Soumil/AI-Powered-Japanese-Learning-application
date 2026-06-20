import Phaser from 'phaser';

export default class VisualNovelScene extends Phaser.Scene {
  constructor() {
    super('VisualNovelScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Load scene data
    this.sceneData = this.cache.json.get('scene001');
    this.dialogIndex = 0;
    this.currentDialogs = this.sceneData.dialog;
    this.isWaitingForChoice = false;

    // Background setup
    let bgKey = 'bg-' + this.sceneData.location.id;
    if (!this.textures.exists(bgKey)) bgKey = 'bg-apartment'; // fallback
    this.bg = this.add.image(width / 2, height / 2, bgKey);
    // Scale background to fit
    const scaleX = width / this.bg.width;
    const scaleY = height / this.bg.height;
    const scale = Math.max(scaleX, scaleY);
    this.bg.setScale(scale);

    // Character sprite setup
    this.characterSprite = this.add.image(width / 2, height, 'char-alex').setOrigin(0.5, 1);
    // Optionally scale character down if it's too large
    this.characterSprite.setScale(0.8);
    this.characterSprite.setVisible(false);

    // UI - Dialog box
    const boxHeight = 220;
    this.dialogBox = this.add.rectangle(width / 2, height - boxHeight / 2 - 20, width - 100, boxHeight, 0x000000, 0.8);
    this.dialogBox.setStrokeStyle(4, 0xffffff);

    // UI - Speaker Name text
    this.speakerText = this.add.text(80, height - boxHeight - 40, '', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 10 }
    });
    this.speakerText.setStroke('#ffffff', 2);

    // UI - Dialog text (English)
    this.dialogText = this.add.text(80, height - boxHeight, '', {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: width - 160 }
    });

    // UI - Japanese text
    this.japaneseText = this.add.text(80, height - boxHeight + 80, '', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffcc00',
      wordWrap: { width: width - 160 }
    });

    // Container for choices
    this.choicesContainer = this.add.container(0, 0);

    // Input to advance dialog
    this.input.on('pointerdown', () => this.advanceDialog());
    this.input.keyboard.on('keydown-SPACE', () => this.advanceDialog());
    this.input.keyboard.on('keydown-ENTER', () => this.advanceDialog());

    this.showDialog(this.dialogIndex);
  }

  advanceDialog() {
    if (this.isWaitingForChoice) return;
    
    this.dialogIndex++;
    if (this.dialogIndex < this.currentDialogs.length) {
      this.showDialog(this.dialogIndex);
    } else {
      // Scene is over
      this.speakerText.setText('');
      this.dialogText.setText('End of Scene. Thanks for playing!');
      this.japaneseText.setText('');
      this.characterSprite.setVisible(false);
    }
  }

  showDialog(index) {
    const dialog = this.currentDialogs[index];
    
    // Set speaker
    if (dialog.speaker === 'narrator') {
      this.speakerText.setVisible(false);
    } else {
      this.speakerText.setVisible(true);
      const speakerName = dialog.speaker === 'player' ? 'You' : this.sceneData.character.name;
      this.speakerText.setText(speakerName);
    }

    // Determine character image
    if (dialog.speaker === 'alex') {
      this.characterSprite.setTexture('char-alex'); // using base image for now
      this.characterSprite.setVisible(true);
    } else if (dialog.speaker === 'narrator') {
      this.characterSprite.setVisible(false);
    }

    this.dialogText.setText(dialog.text || '');
    this.japaneseText.setText(dialog.languageVersion || '');

    // Handle options/choices
    this.choicesContainer.removeAll(true);
    if (dialog.options && dialog.options.length > 0) {
      this.isWaitingForChoice = true;
      this.showChoices(dialog.options);
    } else {
      this.isWaitingForChoice = false;
    }
  }

  showChoices(options) {
    const width = this.scale.width;
    const height = this.scale.height;
    
    let startY = height / 2 - (options.length * 50);
    
    options.forEach((opt, index) => {
      // Choice background
      const btnBg = this.add.rectangle(width / 2, startY + (index * 100), 800, 80, 0x222222, 0.95);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(3, 0xffffff);

      // Choice text (English)
      const btnText = this.add.text(width / 2, startY + (index * 100) - 20, opt.text, {
        fontSize: '22px',
        color: '#ffffff'
      }).setOrigin(0.5);

      // Choice text (Japanese)
      const btnJpText = this.add.text(width / 2, startY + (index * 100) + 15, opt.languageVersion || '', {
        fontSize: '20px',
        color: '#ffcc00'
      }).setOrigin(0.5);

      btnBg.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation(); // prevent advanceDialog from triggering
        this.selectChoice(opt);
      });
      
      btnBg.on('pointerover', () => btnBg.setFillStyle(0x555555, 0.95));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x222222, 0.95));

      this.choicesContainer.add([btnBg, btnText, btnJpText]);
    });
  }

  selectChoice(choice) {
    this.isWaitingForChoice = false;
    this.choicesContainer.removeAll(true);
    
    // Some visual novels display the selected choice as a dialog spoken by the player.
    // In our JSON, the choice itself is the player's dialog step, so we just advance.
    this.advanceDialog();
  }
}

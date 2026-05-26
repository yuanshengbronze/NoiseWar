import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Direction, GridEngine } from 'grid-engine';

export class Game extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    gameText!: Phaser.GameObjects.Text;
    platforms!: Phaser.GameObjects.Group;
    player!: Phaser.GameObjects.Sprite;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    gridEngine!: GridEngine;

    constructor ()
    {
        super('Game');
    }

    preload() {
        this.load.setPath('assets');
        this.load.spritesheet('player', './fluffy.png', { frameWidth: 16, frameHeight: 20 });
        this.load.image("tiles", "grid-engine-tileset.png"); 
        this.load.tilemapTiledJSON("tilemap", "tilemap.json");
    }

    create ()
    {
        //Camera
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);
        
        //Background
        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        //Player
        this.player = this.add.sprite(100, 450, 'player').setScale(2);

        //Game Text
        this.gameText = this.add.text(512, 384, 'NoiseWar', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        //Controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        //Tilemap
        const tilemap = this.make.tilemap({ key: "tilemap" }); 
        tilemap.addTilesetImage("grid-engine-tileset", "tiles"); 
        for (let i = 0; i < tilemap.layers.length; i++) { 
            tilemap.createLayer(i, "grid-engine-tileset", 0, 0); 
        } 

        //Grid Engine
        const gridEngineConfig = { 
            characters: [ 
                { 
                id: "player", 
                sprite: this.player, 
                startPosition: { x: 15, y: 14 }, 
                }, 
            ], 
        }; 
        this.gridEngine.create(tilemap, gridEngineConfig);

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.cursors?.left.isDown) { 
            this.gridEngine.move("player", Direction.LEFT); 
        } else if (this.cursors?.right.isDown) { 
            this.gridEngine.move("player", Direction.RIGHT); 
        } else if (this.cursors?.up.isDown) { 
            this.gridEngine.move("player", Direction.UP); 
        } else if (this.cursors?.down.isDown) { 
            this.gridEngine.move("player", Direction.DOWN); 
        } 
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
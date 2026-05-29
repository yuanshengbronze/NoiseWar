import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Direction, GridEngine } from 'grid-engine';

export class Game extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    gameText!: Phaser.GameObjects.Text;
    player!: Phaser.GameObjects.Sprite;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    gridEngine!: GridEngine;
    tilemap!: Phaser.Tilemaps.Tilemap;
    direction: integer = 0;

    constructor ()
    {
        super('Game');
    }

    preload() {
        this.load.setPath('assets');
        this.load.spritesheet('player', './fluffy.png', { frameWidth: 16, frameHeight: 20 });
        this.load.image("tiles", "cloud_tileset.png"); 
        this.load.tilemapTiledJSON("tilemap", "maze.json");
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

        /*Game Text
        this.gameText = this.add.text(512, 384, 'NoiseWar', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        */

        //Controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        //Tilemap
        this.tilemap = this.make.tilemap({ 
            key: "tilemap"
        }); 
        this.tilemap.addTilesetImage("cloud_tileset", "tiles"); 
        for (let i = 0; i < this.tilemap.layers.length; i++) { 
            this.tilemap.createLayer(i, "cloud_tileset", 0, 0).setScale(3); 
        } 

        //Grid Engine
        const gridEngineConfig = { 
            characters: [ 
                { 
                id: "player", 
                sprite: this.player, 
                startPosition: { x: 1, y: 13 }, 
                speed: 5,
                }, 
            ],
            collisionTilePropertyName: "collides" 
        }; 
        this.gridEngine.create(this.tilemap, gridEngineConfig);

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.direction == 3) { 
            this.gridEngine.move("player", Direction.LEFT); 
        } else if (this.direction == 4) { 
            this.gridEngine.move("player", Direction.RIGHT); 
        } else if (this.direction == 1) { 
            this.gridEngine.move("player", Direction.UP); 
        } else if (this.direction == 2) { 
            this.gridEngine.move("player", Direction.DOWN); 
        } 
        
        /*
        if (this.cursors.left.isDown) { 
            this.gridEngine.move("player", Direction.LEFT); 
        } else if (this.cursors.right.isDown) { 
            this.gridEngine.move("player", Direction.RIGHT); 
        } else if (this.cursors.up.isDown) { 
            this.gridEngine.move("player", Direction.UP); 
        } else if (this.cursors.down.isDown) { 
            this.gridEngine.move("player", Direction.DOWN); 
        } 
        */

        if (this.cursors.space.isDown) {
            this.direction = 0;
        }

        const currPosition = this.gridEngine.getPosition("player")

        const properties = this.tilemap.getTileAt(currPosition.x, currPosition.y)?.properties

        if (properties.finish) {
            this.scene.start('GameClear');
        }
    }

    move(direction: integer) {
        this.direction = direction;
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
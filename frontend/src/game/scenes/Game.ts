import { EventBus } from '../EventBus';
import { Scene} from 'phaser';
import { Direction, GridEngine } from 'grid-engine';
import {Socket} from 'socket.io-client';
import {socket} from '../../socket.ts';

export class Game extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    player!: Phaser.GameObjects.Sprite;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    gridEngine!: GridEngine;
    tilemap!: Phaser.Tilemaps.Tilemap;
    direction: integer = 0;
    playerName!: Phaser.GameObjects.BitmapText;
    user!: string;
    opponent!: string;
    socket!: Socket;
    roomCode!: number;

    constructor ()
    {
        super('Game');
    }

    preload() {
        this.load.setPath('assets');
        this.load.spritesheet('foxy', './foxy.png', { frameWidth: 33, frameHeight: 32 });
        this.load.image("tiles", "cloud_tileset.png"); 
        this.load.tilemapTiledJSON("tilemap", "maze.json");
        this.load.bitmapFont('pixelfont', 'fonts/' + 'square_6x6' + '.png', 'fonts/' + 'square_6x6' + '.xml');
    }

    create ()
    {
        this.user = this.registry.get("user");

        //Player
        this.player = this.add.sprite(0, 0, 'foxy').setScale(0.65);
        this.createPlayerAnimation('idle', 'foxy', 0, 3);
        this.createPlayerAnimation('walk', 'foxy', 6, 11);
        this.createPlayerAnimation('up', 'foxy', 12, 15);

        //Controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        //Tilemap
        this.tilemap = this.make.tilemap({ 
            key: "tilemap"
        }); 
        this.tilemap.addTilesetImage("cloud_tileset", "tiles"); 
        this.tilemap.createLayer(0, "cloud_tileset", 0, 0); 

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

        //Camera
        const mapWidth = this.tilemap.widthInPixels;
        const mapHeight = this.tilemap.heightInPixels;
        this.camera = this.cameras.main;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(4);        
        
        //Player Text
        this.playerName = this.add.bitmapText(this.player.x, this.player.y, 'pixelfont', this.user);
        EventBus.emit('current-scene-ready', this);

        //Socket
        this.socket = socket;  
        
        this.socket.on("game-started", (data) => {
            console.log("Game started on room: ", data.roomCode);
            this.roomCode = data.roomCode;

            if (this.user === data.host) {
                this.opponent = data.guest;
            } else {
                this.opponent = data.host;
            }

            console.log(`You are racing against ${this.opponent}!`);
        });

        this.socket.on("receive-sabotage", () => {
            console.log(`Received sabotage`);
            this.receiveSabotage();
        });

        this.socket.on("game-over", (data) => {
            console.log(`Game over! The winner is ${data.winner}`);
            this.changeScene();
        });
    }

    update() {
        //CONTROLS
        if (this.direction == 3) { 
            this.gridEngine.move("player", Direction.LEFT); 
        } else if (this.direction == 4) { 
            this.gridEngine.move("player", Direction.RIGHT); 
        } else if (this.direction == 1) { 
            this.gridEngine.move("player", Direction.UP); 
        } else if (this.direction == 2) { 
            this.gridEngine.move("player", Direction.DOWN); 
        } 

        //CONTROLS FOR TESTING
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

        // 2. ANIMATION
        const isMoving = this.gridEngine.isMoving("player");
        const facingDirection = this.gridEngine.getFacingDirection("player");

        if (isMoving) {
            if (facingDirection === Direction.LEFT) {
                this.player.setFlip(true, false);  
                this.player.setOrigin(0, 0);   
                this.player.play('walk', true);      
            } else if (facingDirection === Direction.RIGHT) {
                this.player.setFlip(false, false); 
                this.player.setOrigin(0, 0);
                this.player.play('walk', true); 
            } else if (facingDirection === Direction.UP) {
                this.player.setFlip(false, false);
                this.player.setOrigin(0, 0);
                this.player.play('up', true);
            } else if (facingDirection === Direction.DOWN) {
                this.player.setFlip(false, true);
                this.player.setOrigin(0, -0.1); 
                this.player.play('up', true);
            }
        } else {
            this.player.setFlipY(false);
            this.player.setOrigin(0, 0); 
            this.player.play('idle', true);
        }

        //USERNAME TEXT
        const currPosition = this.gridEngine.getPosition("player")
        this.playerName.setPosition(this.player.x, this.player.y);

        //CLEAR CONDITION
        const properties = this.tilemap.getTileAt(currPosition.x, currPosition.y)?.properties
        if (properties.finish) {
            this.scene.stop('UI');
            this.scene.start('GameClear');
            this.socket.emit("player-finished", {
                roomCode: this.roomCode,
                username: this.user
            })
        }
    }

    move(direction: integer) {
        this.direction = direction;
    }

    changeScene()
    {
        this.scene.stop('UI');
        this.scene.start('GameOver');
    }

    sabotage() {
        this.socket.emit("send-sabotage", {
            roomCode: this.roomCode
        })
    }

    receiveSabotage() {
        this.scene.pause();
    }

    createPlayerAnimation(name: string, textureName: string, startFrame: number, endFrame: number) {
        this.anims.create({
            key: name,
            frames: this.anims.generateFrameNumbers(textureName, {
            start: startFrame,
            end: endFrame,
            }),
            frameRate: 8,
            repeat: -1,
            yoyo: false,
        });
    }
}
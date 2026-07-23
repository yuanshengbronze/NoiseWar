import { EventBus } from '../EventBus';
import { Scene, Scenes} from 'phaser';
import { Direction, GridEngine } from 'grid-engine';
import {socket} from '../../socket.ts';

type SabotageType = "pause" | "command-switch";

interface SabotageSuccessResponse {
  success: true;
  remainingUses: number;
}

interface SabotageFailureResponse {
  success: false;
  errorType: "limit" | "target-busy" | "validation" | "server";
  error: string;
  remainingUses?: number;
}

type SabotageResponse =
  | SabotageSuccessResponse
  | SabotageFailureResponse;
    
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
    roomCode!: string;

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
        this.roomCode = this.registry.get("roomCode");
        this.direction = 0;
        
        //Player
        this.player = this.add.sprite(0, 0, 'foxy').setScale(0.65);
        this.createPlayerAnimation('idle', 'foxy', 0, 3);
        this.createPlayerAnimation('walk', 'foxy', 6, 11);
        this.createPlayerAnimation('up', 'foxy', 12, 15);

        //Controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        //Tilemap
        const TILE_SIZE = 16;
        const WALL_TILE = 367;
        const maze = this.registry.get("maze")
        const mazeArray = maze.mazeArray;
        const start = maze.start;
        const end = maze.end;

        this.tilemap = this.make.tilemap({
            data: mazeArray,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });

        const tileset = this.tilemap.addTilesetImage(
            "cloud_tileset",
            "tiles",
            TILE_SIZE,
            TILE_SIZE
        );

        if (!tileset) {
            throw new Error("Could not create tileset");
        }

        const layer = this.tilemap.createLayer(0, tileset, 0, 0);

        if (!layer) {
            throw new Error("Could not create tilemap layer");
        }

        layer.forEachTile((tile) => {
            const isWall = tile.index === WALL_TILE;
            const isStart = tile.x === start[1] && tile.y === start[0];
            const isFinish = tile.x === end[1] && tile.y === end[0];

            tile.properties = {
                ge_collide: isWall,
                start: isStart,
                finish: isFinish
            };
        });

        //Grid Engine
        const gridEngineConfig = { 
            characters: [ 
                { 
                id: "player", 
                sprite: this.player, 
                startPosition: { x: 1, y: 1 }, 
                speed: 5,
                }, 
            ]        
        }; 
        this.gridEngine.create(this.tilemap, gridEngineConfig);

        //Camera
        const mapWidth = this.tilemap.widthInPixels;
        const mapHeight = this.tilemap.heightInPixels;
        this.camera = this.cameras.main;
        this.cameras.main.setBounds(0, 0, mapWidth + 20, mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(4);        
        
        //Player Text
        this.playerName = this.add.bitmapText(this.player.x, this.player.y, 'pixelfont', this.user);
        EventBus.emit('current-scene-ready', this);

        //Socket Events
        socket.on("receive-sabotage", (data = {}) => {
            const { type, word = "" } = data as { type?: string; word?: string };

            if (type === "command-switch") {
                EventBus.emit("command-switch-sabotage-received");
            }
            else if (type === "pause") {
                this.receiveSabotage(word);
            }
        });

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            socket.off("receive-sabotage");
        });

        socket.once("game-over", (data) => {
            this.gameOver(data.reason);
        });

        socket.once("game-clear", (data) => {
            this.gameClear(data.winner);
        });

        socket.once("player-disconnected", (data: {username: string}) => {
            this.gameOver(`${data.username} disconnected`)
        })

        socket.once("player-left", (data: {username: string}) => {
            this.gameOver(`${data.username} left`)
        })

        //EventBus
        EventBus.on("leaving-room", this.handleLeavingRoom, this);
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off("leaving-room", this.handleLeavingRoom, this);
        });

        EventBus.emit('current-scene-ready', this);
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

        if (this.cursors.shift.isDown) {
            this.pauseSabotage();
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
            socket.emit("player-finished", {
                roomCode: this.roomCode,
                username: this.user
            })
        }
    }

    move(direction: integer) {
        this.direction = direction;
    }

    gameOver(reason: string)
    {
        this.scene.stop('UI');
        this.scene.stop('Game');
        this.scene.start('GameOver', {
            reason: reason
        });
    }

    gameClear(winner: string)
    {
        this.scene.stop('Game');
        this.scene.stop('UI');
        this.scene.start('GameClear', {
            winner: winner
        });
    }

    pauseSabotage() {
        const type: SabotageType = "pause";

        const sabotageWord = this.registry.get("sabotageWord") || "";

        socket.emit("send-sabotage",
            {
                roomCode: this.roomCode,
                type,
                word: sabotageWord,
            },
            (res: SabotageResponse) => {
                if (res.success) {
                    EventBus.emit("sabotage-uses-updated", {
                        type,
                        remainingUses: res.remainingUses,
                    });
                    return;
                }

                switch (res.errorType) {
                    case "limit":
                        EventBus.emit("show-warning", {
                            message: "Pause unavailable — no uses remaining."
                        });
                        break;

                    case "target-busy":
                        EventBus.emit("show-warning", {
                            message: "Opponent is already sabotaged!",
                        });
                        break;

                    case "validation":
                        console.warn(`Invalid sabotage request: ${res.error}`);
                        break;

                    case "server":
                        EventBus.emit("show-warning", {
                            message: "Sabotage failed — please try again.",
                        });
                        break;
                }
            },
        );
    }

    commandSwitchSabotage() {
        const type: SabotageType = "command-switch";
        const commandSwitchWord = this.registry.get("commandSwitchWord") || "";

        socket.emit("send-sabotage",
            {
                roomCode: this.roomCode,
                type,
                word: commandSwitchWord,
            },
            (res: SabotageResponse) => {
                if (res.success) {
                    EventBus.emit("sabotage-uses-updated", {
                        type,
                        remainingUses: res.remainingUses,
                    });
                    return;
                }

                switch (res.errorType) {
                    case "limit":
                        EventBus.emit("show-warning", {
                            message: "Command Switch unavailable — no uses remaining."
                        });
                        break;

                    case "target-busy":
                        EventBus.emit("show-warning", {
                            message: "Opponent is already sabotaged",
                        });
                        break;

                    case "validation":
                        console.warn(`Invalid sabotage request: ${res.error}`);
                        break;

                    case "server":
                        EventBus.emit("show-warning", {
                            message: "Sabotage failed — please try again.",
                        });
                        break;
                }
            },
        );
    }

    receiveSabotage(word: string) {
        const uiScene = this.scene.get("UI") as Phaser.Scene & {
            setSabotageWord?: (word: string) => void;
        };

        uiScene.setSabotageWord?.(word);
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

    handleLeavingRoom() {
        this.scene.stop("UI");
        this.scene.stop("GameOver");
        this.scene.stop("GameClear");

        EventBus.emit("phaser-cleanup-complete");
        this.scene.stop("Game");
    }
}

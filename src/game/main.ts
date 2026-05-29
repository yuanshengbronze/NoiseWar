import { GridEngine } from "grid-engine";
import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { GameClear } from "./scenes/GameClear";

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 960,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,
        GameClear
    ],
    plugins: {
        scene: [{
            key: 'gridEngine',
            plugin: GridEngine,
            mapping: "gridEngine",
        },
        ]
    },
    pixelArt: true
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
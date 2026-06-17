import { useState, useRef, useEffect } from "react";
import { type IRefPhaserGame, PhaserGame } from "../PhaserGame";
import { MainMenu } from "../game/scenes/MainMenu";
import { Game } from "../game/scenes/Game";
import annyang from "annyang";
import Login from "./Login";
import type { UI } from "../game/scenes/UI";

function GamePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setUser(username);
  };

  useEffect(() => {
    if (annyang.isSpeechRecognitionSupported()) {
      const control = (direction: integer) => {
        if (phaserRef.current) {
          const gameScene = phaserRef.current.scene as Game;
          if (gameScene && gameScene.scene.key === "Game") {
            gameScene.move(direction);
          }
        }
      };

      const sabotage = () => {
        if (phaserRef.current) {
          const gameScene = phaserRef.current.scene as Game;
          if (gameScene && gameScene.scene.key === "Game") {
            gameScene.sabotage();
          }
        }
      };

      const stopSabotage = () => {
        if (phaserRef.current) {
          const UIScene = phaserRef.current.scene?.scene.get("UI") as UI;
          if (UIScene) {
            UIScene.stopSabotage();
          }
        }
      };

      const commands = {
        stop: () => {
          control(0);
        },
        up: () => {
          control(1);
        },
        down: () => {
          control(2);
        },
        left: () => {
          control(3);
        },
        right: () => {
          control(4);
        },
        sabotage: sabotage,
        absolutely: stopSabotage,
        "*term": (term: string) => {
          console.log(term);
        },
      };

      annyang.addCommands(commands);
      annyang.start();
      console.log("voice recognition started");

      return () => {
        annyang.abort();
      };
    } else {
      console.log("voice recognition not supported");
    }
  }, []);

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  if (!isLoggedIn) {
    return <Login loginSuccess={handleLogin} />;
  }

  return (
    <div id="app">
      <div>
        <h1> Welcome to NoiseWar!</h1>
      </div>
      <PhaserGame ref={phaserRef} user={user} />
      <div>
        <div>
          <button className="button" onClick={changeScene}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default GamePage;

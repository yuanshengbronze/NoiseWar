import { useState, useRef, useEffect } from "react";
import { type IRefPhaserGame, PhaserGame } from "../PhaserGame";
import { MainMenu } from "../game/scenes/MainMenu";
import { Game } from "../game/scenes/Game";
import annyang from "annyang";
import Login from "./Login";

function GamePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  }

  useEffect(() => {
    if (annyang.isSpeechRecognitionSupported()) {
      const control = (direction: integer) => {
        if (phaserRef.current) {
          const scene = phaserRef.current.scene as Game;
          if (scene && scene.scene.key === "Game") {
            scene.move(direction);
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
     return <Login loginSuccess={handleLogin}/>
  }

  return (
    <div id="app">
      <div>
        <h1> Welcome to NoiseWar!</h1>
      </div>
      <PhaserGame ref={phaserRef} />
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

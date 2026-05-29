import { useRef, useState } from "react";
import { type IRefPhaserGame, PhaserGame } from "./PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [canMoveSprite, setCanMoveSprite] = useState(true);

  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [, setSpritePosition] = useState({ x: 0, y: 0 });

  const handleLogin = () => {
    setIsLoggedIn(true);
  }

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  const moveSprite = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene && scene.scene.key === "MainMenu") {
        // Get the update logo position
        scene.moveLogo(({ x, y }) => {
          setSpritePosition({ x, y });
        });
      }
    }
  };

  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  if (!isLoggedIn) {
     return <Login loginSuccess={handleLogin}/>
  }

  return (
    <div id="app">
      <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
      <div>
        <div>
          <button className="button" onClick={changeScene}>
            Change Scene
          </button>
        </div>
        <div>
          <button
            disabled={canMoveSprite}
            className="button"
            onClick={moveSprite}
          >
            Toggle Movement
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState, useRef, useEffect } from "react";
import { type IRefPhaserGame, PhaserGame } from "../PhaserGame";
import { MainMenu } from "../game/scenes/MainMenu";
import { EventBus } from "../game/EventBus";
import { Game } from "../game/scenes/Game";
import { io } from "socket.io-client";
import annyang from "annyang";
import Login from "./Login";
import type { UI } from "../game/scenes/UI";
import Lobby from "./Lobby";

const socket = io("http://localhost:8080");

function GamePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<"lobby" | "playing">("lobby");
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setUser(username);
  };

  const handleCreateRoom = () => {
    socket.emit("create-room", { username: user }, (response: any) => {
      if (response.success) {
        console.log("Successfully created room:", response.roomCode);
        setRoomCode(response.roomCode);
      } else {
        alert("Could not create room: " + response.error);
      }
    });
  }

  const handleEnterRoom = (code: string) => {
    setRoomCode(code);
    setCurrentPhase("playing");
  }

  const startMainMenu = () => {
    if (phaserRef.current?.scene) {
      phaserRef.current.scene.scene.start('MainMenu');
    } else if (phaserRef.current?.game) {
      phaserRef.current.game.scene.start('MainMenu');
    }
  };

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  useEffect(() => {
    EventBus.on('GamePage', () => {
      startMainMenu();

      setCurrentPhase("lobby");
      setRoomCode("");

    });

    return () => {
      EventBus.removeListener('GamePage');
    };
  }, []);

  useEffect(() => {
    if (currentPhase === "playing") {
      startMainMenu();
    }
  }, [currentPhase]);

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

  if (!isLoggedIn) {
    return <Login loginSuccess={handleLogin} />;
  }

  return (
    <div id="app" data-room-code={roomCode ?? ""} style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      
      {/* Lobby page is displayed */}
      {currentPhase === "lobby" && (
        <div style={{
          backgroundImage: `url("/assets/bg.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "24px" 
        }}>
          <h1 style={{ color: "#fff", margin: 0, fontFamily: "Arial Black", textTransform: "uppercase" }}>
            Welcome to NoiseWar!
          </h1>

          <img 
            src="/assets/logo.png" 
            alt="NoiseWar Logo"
            style={{
              maxWidth: "600px",
              minWidth: "450px",          
              height: "auto",             
              objectFit: "contain",
              margin: "10px 0"            
            }}
          />

          <Lobby onCreateRoom={handleCreateRoom} onEnterRoom={handleEnterRoom} roomCode={roomCode}/>
        </div>
      )}

      {/* Displays the Phaser Canvas */}
      <div 
        style={{ 
          display: currentPhase === "playing" ? "block" : "none",
          width: "100%",
          height: "100%"
        }}
      >
        
        <PhaserGame ref={phaserRef} user={user} />
        <div>
          <div>
            <button className="button" onClick={changeScene}>
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default GamePage;

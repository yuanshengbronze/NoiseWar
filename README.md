# NoiseWar

Noise War is a 2-player web game, where players can compete by completing a vertical path in a given grid map as quickly as possible using voice inputs such as Up, Down, Left, and Right. Players can also sabotage each other by either shouting the wrong commands, or sending in-game tasks to their rival (such as spelling a difficult word)

# Motivation

Noise is an essential part of party games. Whether it is friends shouting over a game, cheering during a challenge, or laughing uncontrollably, the energy created by loud voices brings excitement and chaos in every party game. Therefore, we decided to build a game that uses noise as a core mechanic: Noise War.

We are motivated to explore how voice can be turned into a core, compelling game mechanic by designing Noise War into a fast-paced, competitive 1v1 experience driven by speech-to-text. In the process, we hope to have fun while learning software development practices, especially game development.

# User Stories

1. As a user, I want to have fun by competing with a friend in a game
2. As a user, I want to be able to play across distances
3. As a user, I want the matchmaking process to be effortless and quick
4. As a user, I want to play a variety of maps so that I don’t get bored
5. As a user, I want to sabotage my friend to annoy him
6. As a user, I want the game to be fun and chaotic as I rush to say commands to the microphone
7. As a user, I want my progress to be saved and be able to look up my match history

# Features

1.  Login System - COMPLETED

    Our login system is inspired by when2meet.com.

    Upon entering the website, users will be prompted to input a username and a password. If the username is not registered yet, the new username with its corresponding password will be stored inside the database. A registered username with an incorrect password will lead to an error message. A successful login/registration brings users to the main page.

    Our proof-of-concept plan is built using a React (Vite) frontend communicating with an Express backend connected to a Redis database layer. We have successfully implemented a unified sign up/login route. A single POST endpoint /api/event/:eventId/login for both registration and authentication. The room key is stored under the Redis hash room:${eventId}:users to check for usernames. If the username exists, its password is validated. If it doesn’t, the program registers it automatically.

3.  Matchmaking system - NOT STARTED
   
    Our proposed matchmaking system allows users to create their own private rooms and invite other users to play with them through randomly generated room codes. This matchmaking system is similar to games like Among Us and Jackbox.

    Upon logging in, a user has 2 options:
    1. Create a room, where a random room code will be generated and displayed to the user. A room instance will be generated inside the Redis cache. The user is then placed in a lobby to await their opponent.

    2. Join a room, where a user is prompted to enter a room code. The backend then validates the code. If the room is not full (< 2 people), the user enters the room.

5.  Game Skeleton - COMPLETED
   
    The game is made using Phaser. A Phaser game consists of scenes, which are logical sections of a game. There are currently 6 Scenes:
    1. Boot (shown while booting)
    2. Preloader (preloading assets)
    3. Main Menu
    4. Game
    5. Game Clear (shown when player reaches the target point)
    6. Game Over

    More scenes can be added in the future.

7.  Grid-Based Movement - COMPLETED
   
    The player character must move around in a grid-based map, meaning it cannot stop between tiles. We used Grid Engine, a Phaser plugin that makes implementing grid-based movement easier. The current maze map is created using Tiled, a free open-source 2D level editor.

9.  Voice-based controls - IN PROGRESS
    
    We want the player character to move through voice commands. Currently, there are 5 commands:
    1.  Up
    2.  Down
    3.  Left
    4.  Right
    5.  Stop

    Each command will keep the player moving in that direction until a different command is issued. To achieve this functionality, we shifted away from the initial plan (OpenAI Whisper) and used annyang, a JavaScript speech recognition library. It is much simpler to implement and achieves satisfactory accuracy and speed.

    Since the latency is considerable, it is very difficult to make the player turn at precisely the right point. So, we decided to use the spacebar as an extra control mechanism. When pressed, it is synonymous with the “stop” command, making it easier to stop precisely.

    The player speed is still being tuned to ensure a satisfying “game-feel”. Sabotaging mechanics are still not implemented.

11.  Visuals and Animations - IN PROGRESS
    
     Currently, the maze map is created from the Cloud City tileset (https://finalbossblues.itch.io/cloud-city-tileset). A yellow tile is the starting point, and a purple tile is the target point. Grey tiles are the maze walls, while plain blue tiles are used for the background.

     The player sprite sheet is Fluffy (https://annoraaq.github.io/grid-engine/assets/fluffy.png).

     These assets are used only for proof-of-concept and might be changed in the future to ensure a consistent art direction. There are still no animations being implemented.

11.  Randomly generated maps - NOT STARTED

     For our proof-of-concept, we manually designed a maze as our map to demonstrate grid-based movements using Tiled.

     Our proposed plan is to randomly generate a map for every room that is created to enhance users’ interest in the game. We plan to implement this by using a maze generation algorithm, which we can then export to Tiled.

11.  User profile - IN PROGRESS
    
     Our proposed plan is to make a user profile page where users can see their match history and stats (matches won, matches lost, etc). Currently, we have only made a login system that stores users’ username and password.

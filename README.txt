TANK WAR // GRID ASSAULT — Networked Edition
==============================================

A 2-player tank battle game. One screen (PC, TV, laptop) shows the battle.
Two players connect from their phones and drive their tanks with an
on-screen joystick + fire button.

REQUIREMENTS
------------
Node.js 16 or newer.

SETUP
-----
1. Open a terminal in this folder.
2. Install dependencies:
       npm install
3. Start the server:
       npm start
   You should see:
       TANK WAR server running on http://localhost:3000

HOW TO PLAY
------------
1. On the PC/TV/laptop that will display the battle, open a browser to:
       http://localhost:3000
   (or http://<your-computer's-LAN-IP>:3000 if opening from another device)
   Click "CREATE GAME". A 6-digit room code appears.

2. On each phone, make sure it's connected to the SAME WiFi network as the
   host computer, then open a browser to:
       http://<host-computer-LAN-IP>:3000/controller.html
   Enter the 6-digit room code shown on the host screen and tap JOIN.

   To find your computer's LAN IP:
     - Windows: open Command Prompt, run "ipconfig", look for IPv4 Address
     - Mac/Linux: open Terminal, run "ifconfig" or "ip a", look for an
       address like 192.168.x.x

3. The first phone to join becomes PLAYER A, the second becomes PLAYER B.
   Each phone shows a lobby screen — tap READY.

4. Once both players are ready, the joystick controller appears on each
   phone and the battle starts automatically on the host screen.

CONTROLS (on phone)
--------------------
- D-pad (left side): Up/Down = drive forward/backward, Left/Right = turn
- Big button (right side): FIRE — glows blue only while pressed
- The center of the D-pad shows your player letter (A or B)

GAMEPLAY
--------
- Destroy the enemy tank to win a round. First to 3 round wins takes the
  match.
- Bullets ricochet off walls and blocks up to 3 times before exploding,
  and can hit either tank (including the shooter) after bouncing.
- Powerups scattered across the arena:
    SPEED (lightning)  - temporary movement speed boost
    ARMOR (shield)     - absorbs the next hit
    DOUBLE SHOT (boom) - next shot fires two bullets
    REPAIR (heart)     - restores 1 HP
    AMMO REFILL (loop) - instantly refills ammo
    PIERCE (target)    - next shot passes through walls

SOUND
-----
All sound effects are real recorded samples embedded directly in the host
page (no external audio files needed):
  - Tank firing
  - Tank taking damage
  - Bullet ricochet off walls/blocks
  - Powerup pickup (shield / heart / speed)
  - Round / match victory

PROJECT STRUCTURE
------------------
server.js              - Express + Socket.io server (rooms, lobby, input relay)
public/index.html       - Host display (the actual game / battle screen)
public/controller.html  - Phone controller (joystick + fire button)
package.json            - Node dependencies

NOTES
-----
- Everything runs on your local network — no internet/cloud needed, no
  data leaves your network.
- If a phone disconnects mid-game (lock screen, browser backgrounded), it
  will automatically try to rejoin its same player slot when it reconnects.
- If the host page is closed or refreshed, the room is torn down and
  players are notified.

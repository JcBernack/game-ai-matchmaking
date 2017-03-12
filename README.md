# game-ai-matchmaking

## Installation

    git clone git@github.com:JcBernack/game-ai-matchmaking.git
    cd game-ai-matchmaking/server/tcp
    npm install

## Execution

To start the matchmaking server
    
    node server/tcp/server.js
    
To start a stupid random node or python bot
    
    node client/node/client.js
    python client/python/client.py

## Python client

See the python folder for a working client in python. Inherit from the `GameClient` class and implement methods like shown in `Bob.py` or overwrite the `action(self, action)` method and process the actions yourself. For possible actions send by the server see below.

## Communication

Connect to the server via tcp-sockets. The communication is text based and contains JSON objects encoded as UTF8 strings. It is important that every object ends with a line break "\n" to allow message separation. The server will immediately drop your connection on invalid messages.

The server can send the following messages:

- Text messages  
`{ type: "message", message: "text" }`  
these can contain welcome messages or the current number of connected players, just print them out to the console.

- Match start and game configuration - for now this will always be  
`{ type: "start", width: 7, height: 6, winLength: 4 }`

- Update of the game (move of the opponent)  
`{ type: "update", column: x }`  
where `x` will be an integer in the range `[0, width-1]`

- Notification of your game state  
`{ type: "state", state: STATE }`  
where STATE can be either "move", "won", "loss", "tie" or "abort".  
When STATE is "move" you have to submit your move by sending  
`{ type: "move", column: x }`  
(there is a timeout, after which the game will be aborted).  
All other states mean that the game has ended and you can reset your game.

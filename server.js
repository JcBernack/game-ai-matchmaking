const net = require("net");
const carrier = require("carrier");
const messages = require("./messages.js");

const config = {
    maxClients: 10,
    fieldWidth: 7,
    fieldHeight: 6,
    clientMoveTimeout: 2 // TODO: client timeouts
};

const state = {
    idCounter: 0,
    clients: {},
    clientCount: 0,
    permutationIndex: 0,
    players: [],
    activePlayer: 0,
    field: null,
    move: 0
};

function sendSocket(socket, message, callback) {
    socket.write(JSON.stringify(message) + "\n", callback);
}

function send(id, message) {
    sendSocket(state.clients[id].socket, message);
}

function broadcast(message) {
    const ids = Object.keys(state.clients);
    ids.forEach(function (id) {
        send(id, message);
    });
}

function onClientConnect(socket) {
    if (state.clientCount >= config.maxClients) {
        socket.destroy();
        console.log("Client refused - server full");
        return null;
    }
    const id = state.idCounter++;
    const socketAddress = socket.remoteAddress + ":" + socket.remotePort;
    console.log("New client", id);
    state.clients[id] = {
        socket: socket,
        name: socketAddress,
        author: "unkown"
    };
    state.clientCount++;
    return id;
}

function onClientDisconnect(id) {
    delete state.clients[id];
    state.clientCount--;
    console.log("Client disconnected", id);
    updateActivePlayers();
}

const dispatchers = {
    "setName": function (id, action) {
        const client = state.clients[id];
        client.name = action.name;
        client.author = action.author;
    },
    "move": function (id, action) {
        if (state.players[state.activePlayer] == id) {
            // get other player id
            const nextPlayer = (state.activePlayer + 1) % 2;
            const id2 = state.players[nextPlayer];
            //TODO: validate move (state=abort on error and start next match)
            state.move++;
            console.log("accepted move", state.move, "on column", action.column, "by player", id);
            // apply move
            state.field[action.column].push(state.activePlayer);
            // send move to other player
            send(id2, messages.move(action.column));
            // send state=move to the other player
            send(id2, messages.state("move"));
            state.activePlayer = nextPlayer;
        }
    }
};

function disconnectClient(id) {
    state.clients[id].socket.destroy();
}

function updateActivePlayers() {
    broadcast(messages.playerCount(state.clientCount));
}

function handleConnection(socket) {
    const id = onClientConnect(socket);
    if (id == null) return;
    carrier.carry(socket, function (line) {
        let action = null;
        try {
            action = JSON.parse(line);
        } catch (ex) {
            console.log("Error while parsing data from client", id);
            disconnectClient(id);
            return;
        }
        console.log("Received from client", id, action);
        if (Object.keys(dispatchers).indexOf(action.type) < 0) {
            disconnectClient(id);
        } else {
            dispatchers[action.type](id, action);
        }
    });
    socket.on("error", function (err) {
        console.log("Error on client", id, err);
    });
    socket.on("close", function () {
        onClientDisconnect(id);
    });
    send(id, messages.message("Welcome to the AI matchmaking server!"));
    updateActivePlayers();
    if (state.clientCount >= 2 && !state.running) {
        state.running = true;
        startNextMatch();
    }
}

function startNextMatch() {
    // n! / (n-2)!
    const numberOfMatches = state.clientCount * (state.clientCount - 1);
    if (state.permutationIndex >= numberOfMatches) state.permutationIndex = 0;
    const players = getMatchup(state.permutationIndex);
    const startMessage = messages.start(config.fieldWidth, config.fieldHeight);
    send(players[0], startMessage);
    send(players[1], startMessage);
    // states: move, won, loss, tie, abort
    send(players[0], messages.state("move"));
    state.activePlayer = 0;
    state.players = players;
    state.move = 0;
    state.field = [];
    for (let i = 0; i < config.fieldWidth; i++) {
        state.field.push([]);
    }
    state.permutationIndex++;
}

const server = net.createServer(handleConnection);
server.listen(5000, function () {
    console.log("Server running at on port 5000");
});

function flowChart() {
    // wait for players until player count > 1
    // build matchups
    // iterate over matchups
    // check if matchup is still valid (no player disconnected)
    // run match
    // repeat
}

function getMatchup(i) {
    const ids = Object.keys(state.clients);
    const n = ids.length - 1;
    let a = i / n;
    let b = i % n;
    if (a == b) b++;
    return [ids[a], ids[b]];
}

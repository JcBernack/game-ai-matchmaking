const net = require("net");
const carrier = require("carrier");
const MatchmakingFsm = require("./matchmaking");
const config = require("./config");

let idCounter = 1;
const clients = {};

function send(id, message) {
    if (id in clients) clients[id].write(JSON.stringify(message) + "\n");
}

function broadcast(message) {
    Object.keys(clients).forEach(id => send(id, message));
}

function dropClient(id) {
    clients[id].destroy();
}

const fsm = new MatchmakingFsm(config.options);
// fsm.on("transition", data => console.log("state change:", data.fromState, "->", data.toState));
// fsm.on("handling", data => console.log("handling event:", data.inputType));
fsm.on("send", send);
fsm.on("broadcast", broadcast);
fsm.on("dropClient", dropClient);

function connectionListener(socket) {
    const id = idCounter++;
    clients[id] = socket;
    fsm.clientConnected(id);
    carrier.carry(socket, function (line) {
        let action = null;
        try {
            action = JSON.parse(line);
        } catch (ex) {
            console.log("Error while parsing data from client", id);
            fsm.clientError(id);
            return;
        }
        fsm.clientAction(id, action);
    });
    socket.on("error", function (err) {
        // catch errors, but ignore them - otherwise the server would stop
        // errors will cause the connection to be closed anyway
        // console.log("Error on client", id, err);
    });
    socket.on("close", function () {
        delete clients[id];
        fsm.clientDisconnected(id);
    });
}

const server = net.createServer(connectionListener);
server.listen(config.port, config.hostname, function () {
    console.log("Server running at on:", server.address());
});

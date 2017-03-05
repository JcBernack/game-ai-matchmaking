const net = require("net");
const carrier = require("carrier");
const messages = require("./messages.js");

const socket = new net.Socket();
socket.connect(5000, "127.0.0.1", function () {
    console.log("Connected");
    send(messages.setName("korean ai v13.37", "gigo"));
});

function send(message) {
    socket.write(JSON.stringify(message) + "\n");
}

carrier.carry(socket, function (line) {
    const action = JSON.parse(line);
    console.log("Received:", action);
    dispatchers[action.type](action);
});

socket.on("error", function (err) {
    console.log("Connection error", err);
});

socket.on("close", function () {
    console.log("Connection closed");
});

const state = {
    field: null,
    playerCount: 0
};

const dispatchers = {
    "message": function (action) {
        console.log("Server message:", action.message);
    },
    "playerCount": function (action) {
        console.log("Current player count:", action.count);
        state.playerCount = action.count;
    },
    "start": function (action) {
        state.width = action.width;
        state.height = action.height;
        state.field = [];
        for (let i = 0; i < action.width; i++) {
            state.field.push([]);
        }
    },
    "state": function (action) {
        switch (action.state) {
            case "move":
                const validColumns = [];
                for (let i = 0; i < state.width; i++) {
                    if (state.field[i].length < state.height) {
                        validColumns.push(i);
                    }
                }
                const column = validColumns[Math.floor(Math.random() * validColumns.length)];
                console.log("Go for column", column);
                state.field[column].push(0);
                send(messages.move(column));
                break;
            case "abort":
                console.log("Match aborted");
                break;
        }
    },
    "move": function (action) {
        console.log("Received move on column", action.column);
        state.field[action.column].push(1);
    }
};

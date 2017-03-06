const net = require("net");
const carrier = require("carrier");

const actions = {
    move: function (column) {
        return {type: "move", column: column};
    }
};

const socket = new net.Socket();
socket.connect(5000, "127.0.0.1", function () {
    console.log("Connected to", socket.address());
});

function send(message) {
    socket.write(JSON.stringify(message) + "\n");
}

carrier.carry(socket, function (line) {
    const action = JSON.parse(line);
    // console.log("Received:", action);
    dispatchers[action.type](action);
});

socket.on("error", function (err) {
    // console.log("Connection error", err);
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
    "start": function (action) {
        state.width = action.width;
        state.height = action.height;
        state.field = [];
        for (let i = 0; i < state.width; i++) {
            state.field.push([]);
        }
        console.log("We got a match - game size", state.width + "x" + state.height);
    },
    "update": function (action) {
        console.log("Received move on column", action.column);
        state.field[action.column].push(1);
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
                setTimeout(() => send(actions.move(column)), 500);
                break;
            case "abort":
                console.log("Match aborted");
                break;
            case "won":
                console.log("We won, yay!");
                break;
            case "loss":
                console.log("We lost :(");
                break;
        }
    }
};

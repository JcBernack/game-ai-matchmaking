const machina = require("machina");

const actions = {
    message: function (message) {
        return {type: "message", message};
    },
    start: function (description) {
        return Object.assign({type: "start"}, description);
    },
    update: function (move) {
        return Object.assign({type: "update"}, move);
    },
    state: function (state) {
        return {type: "state", state};
    }
};

const MatchmakingFsm = machina.Fsm.extend({
    initialize: function () {
        this.clients = [];
    },
    minClients: 2,
    maxClients: 10,
    clientMoveTimeout: 2000,
    permutationIndex: 0,
    initialState: "waiting",
    states: {
        waiting: {
            _onEnter: function () {
                console.log("waiting for additional players");
            },
            newPlayer: function () {
                if (this.clients.length >= this.minClients) {
                    this.transition("startMatch");
                }
            }
        },
        startMatch: {
            _onEnter: function () {
                if (this.clients.length < this.minClients) {
                    this.transition("waiting");
                } else {
                    this.handle("nextMatch");
                }
            },
            nextMatch: function () {
                const n = this.clients.length;
                // n! / (n-2)!
                const numberOfMatches = n * (n - 1);
                if (this.permutationIndex >= numberOfMatches) this.permutationIndex = 0;
                let a = Math.floor(this.permutationIndex / (n - 1));
                let b = this.permutationIndex % (n - 1);
                if (a <= b) b++;
                a = this.clients[a];
                b = this.clients[b];
                console.log(`Start match ${this.permutationIndex} ${a} vs ${b}`);
                this.permutationIndex++;
                this.game = new this.GameType(a, b);
                const description = actions.start(this.game.describe());
                this.emit("send", a, description);
                this.emit("send", b, description);
                this.transition("nextMove");
            }
        },
        nextMove: {
            _onEnter: function () {
                const state = this.game.state();
                if (state[0] != "move") {
                    console.log(this.game.toString());
                }
                switch (state[0]) {
                    case "move":
                        this.moveState = state;
                        this.emit("send", state[1], actions.state("move"));
                        this.transition("clientMove");
                        break;
                    case "won":
                        console.log(`Client ${state[1]} won after ${this.game.moves} moves`);
                        this.emit("send", state[1], actions.state("won"));
                        this.emit("send", state[2], actions.state("loss"));
                        this.transition("startMatch");
                        break;
                    case "tie":
                        console.log(`Game ended in a tie after ${this.game.moves} moves`);
                        this.emit("send", state[1], actions.state("tie"));
                        this.emit("send", state[2], actions.state("tie"));
                        this.transition("startMatch");
                        break;
                }
            },
        },
        clientMove: {
            _onEnter: function () {
                this.timer = setTimeout(() => this.handle("timeout"), this.clientMoveTimeout);
            },
            move: function (id, move) {
                if (this.game.apply(id, move)) {
                    console.log("Accepted move by client", id, move);
                    this.emit("send", this.moveState[2], actions.update(move));
                    this.transition("nextMove");
                } else {
                    console.log("Invalid move by client", id, move);
                    const currentlyPlaying = this.moveState.indexOf(id) != -1;
                    if (currentlyPlaying) this.handle("sendAbort");
                    this.emit("dropClient", id);
                    this.removePlayer(id);
                    if (currentlyPlaying) this.transition("startMatch");
                }
            },
            timeout: function () {
                console.log("Client move timeout");
                this.handle("sendAbort");
                this.transition("startMatch");
            },
            sendAbort: function () {
                console.log("Aborting match");
                this.emit("send", this.moveState[1], actions.state("abort"));
                this.emit("send", this.moveState[2], actions.state("abort"));
            },
            _onExit: function () {
                clearTimeout(this.timer);
            }
        }
    },

    addPlayer: function (id) {
        if (this.clients.length >= this.maxClients) {
            this.emit("dropClient", id);
            console.log("Server full");
            return;
        }
        this.clients.push(id);
        this.emit("send", id, actions.message("Welcome to the AI matchmaking server!"));
        this.emit("broadcast", actions.message("Player count: " + this.clients.length));
        this.handle("newPlayer", id);
    },
    removePlayer: function (id) {
        const index = this.clients.indexOf(id);
        if (index == -1) return;
        this.clients.splice(index, 1);
        this.emit("broadcast", actions.message("Player count: " + this.clients.length));
    },
    playerAction: function (id, action) {
        if (action.type in this.dispatchers) {
            this.dispatchers[action.type].call(this, id, action);
        }
    },
    dispatchers: {
        move: function (id, action) {
            const move = this.GameType.sanitizeMove(action);
            if (move) this.handle("move", id, move);
        }
    }
});

module.exports = MatchmakingFsm;

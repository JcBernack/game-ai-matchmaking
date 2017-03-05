const messages = {
    setName: function (name, author) {
        return {type: "setName", name, author};
    },
    playerCount: function (count) {
        return {type: "playerCount", count};
    },
    message: function (message) {
        return {type: "message", message};
    },
    state: function (state) {
        return {type: "state", state};
    },
    start: function (width, height) {
        return {type: "start", width, height};
    },
    move: function (column) {
        return {type: "move", column};
    }
};

module.exports = messages;

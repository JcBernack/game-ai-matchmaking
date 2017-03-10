const ConnectFour = require("./connect_four");

module.exports = {
    hostname: "localhost",
    port: 5000,
    options: {
        GameType: ConnectFour,
        maxClients: 10,
        clientMoveTimeout: 2000,
    }
};

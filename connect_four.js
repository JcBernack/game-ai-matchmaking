class ConnectFour {
    constructor(playerOne, playerTwo) {
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.activePlayer = playerOne;
        this.inactivePlayer = playerTwo;
        this.width = 7;
        this.height = 6;
        this.winLength = 4;
        this.moves = 0;
        this.field = [];
        for (let i = 0; i < this.width; i++) {
            this.field.push([]);
        }
    }

    describe() {
        return {width: this.width, height: this.height, winLength: this.winLength};
    }

    apply(player, move) {
        if (!this.validate(player, move.column)) return false;
        this.field[move.column].push(player);
        this.moves++;
        this.activePlayer = this.getOpponent(this.activePlayer);
        this.inactivePlayer = this.getOpponent(this.activePlayer);
        return true;
    }

    validate(player, column) {
        if (player != this.activePlayer) return false;
        if (column < 0 || column >= this.width) return false;
        return this.field[column].length < this.height;
    }

    getOpponent(player) {
        return player == this.playerOne ? this.playerTwo : this.playerOne;
    }

    state() {
        // check if every field is occupied
        if (this.moves == this.width * this.height) {
            return ["tie", this.playerOne, this.playerTwo];
        }
        // check winning conditions
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.check(x, y, 1, 0) || this.check(x, y, 0, 1)
                    || this.check(x, y, 1, 1) || this.check(x, y, 1, -1)) {
                    const winner = this.field[x][y];
                    return ["won", winner, this.getOpponent(winner)];
                }
            }
        }
        // the game is still going
        return ["move", this.activePlayer, this.inactivePlayer];
    }

    check(x, y, dx, dy) {
        let player = this.field[x][y];
        // field unoccupied
        if (!player) return false;
        // count stones of the same player in the given direction
        let d = 0;
        while (this.field[x][y] == player) {
            d++;
            x += dx;
            y += dy;
            // make sure not to go out of bounds
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) break;
        }
        // check win condition
        return d >= this.winLength;
    }

    toString() {
        let rows = [];
        let exes = null;
        for (let y = 0; y < this.height; y++) {
            let row = "";
            for (let x = 0; x < this.width; x++) {
                let state = this.field[x][y];
                if (!state) {
                    row += "-";
                } else {
                    if (exes == null) exes = state;
                    row += state == exes ? "x" : "o";
                }
            }
            rows.unshift(row);
        }
        return rows.reduce((current, row) => current + row + "\n", "");
    }
}

ConnectFour.sanitizeMove = function (action) {
    const column = parseInt(action.column);
    return isNaN(column) ? null : {column};
};

module.exports = ConnectFour;

// let game = new ConnectFour(2, 1);
// game.apply(2, { column: 0 });
// game.apply(1, { column: 0 });
// game.apply(2, { column: 0 });
// game.apply(1, { column: 1 });
// game.apply(2, { column: 1 });
// game.apply(1, { column: 2 });
// game.apply(2, { column: 0 });
// game.apply(1, { column: 1 });
// game.apply(2, { column: 2 });
// game.apply(1, { column: 3 });
// console.log(game.toString());
// console.log("state", game.state());
// console.log("move on column 0 valid?", game.validate(2, 0));

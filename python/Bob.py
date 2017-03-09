from GameClient import GameClient


class Bob(GameClient):
    def message(self, action):
        print("Server message:", action["message"])

    def start(self, action):
        print("Start match:", action)
        # TODO: reset game

    def update(self, action):
        print("The opponent dropped a stone in column:", action["column"])
        # TODO: update game with the move of the copponent

    def move(self):
        # TODO: return evil genius move to outsmart the opponent
        # columns indices are zero-based: i.e. 0 to 6 for the default width of 7 columns
        # this will cause an invalid move very quickly and the server will kick us, return valid moves to fix that
        column = 3
        print("Go for column", column)
        self.send({"type": "move", "column": column})

    def won(self):
        print("We won!")

    def loss(self):
        print("We lost..")

    def tie(self):
        print("We both lost ;(")

    def abort(self):
        print("Game aborted.")



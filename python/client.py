from python.GameClient import GameClient


class Bob(GameClient):
    def message(self, action):
        print("Server message:", action["message"])

    def start(self, action):
        print("Start match:", action)
        # TODO: reset game

    def update(self, action):
        print("The opponent dropped a stone in column:", action["column"])
        # TODO: update game with the move of the copponent

    def state(self, action):
        s = action["state"]
        if s == "move":
            column = self.getMove()
            print("Go for column", column)
            self.send({"type": "move", "column": column})
        elif s == "won":
            print("We won!")
        elif s == "loss":
            print("We lost..")
        elif s == "tie":
            print("We both lost ;(")
        elif s == "abort":
            print("Game aborted.")
        else:
            print("Unknwon game state, wtf?", action)

    def getMove(self):
        # TODO: return evil genius move to outsmart the opponent
        # columns indices are zero-based: i.e. 0 to 6 for the default width of 7 columns
        # this will cause an invalid move very soon and the server will kick us, return valid moves to fix that
        return 3


# create bob and connect to server
client = Bob(("localhost", 5000))
# run game loop
client.run()

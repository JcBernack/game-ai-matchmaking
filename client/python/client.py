from Bob import Bob

# create bob and connect to server
client = Bob(("localhost", 5000))
# run game loop
client.run()

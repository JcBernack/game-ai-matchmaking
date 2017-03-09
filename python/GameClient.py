import json
import socket


class GameClient:
    def __init__(self, address):
        self.socket = socket.socket()
        self.socket.connect(address)

    def send(self, action):
        message = json.dumps(action) + "\n"
        self.socket.sendall(message.encode())

    def run(self):
        buffer = ""
        while True:
            packet = self.socket.recv(1024)
            # check for broken connection
            if not packet:
                break
            # append received packet to the buffer
            buffer += packet.decode()
            # loop as long as there are messages in the buffer
            while '\n' in buffer:
                # split at the first linebreak
                line, buffer = buffer.split('\n', 1)
                # decode the message into an object
                action = json.loads(line)
                # print("Received action:", action)
                # call a class method with name of action.type if existing
                getattr(self, action["type"])(action)

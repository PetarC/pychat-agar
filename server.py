#!/usr/bin/env python
import tornado
import tornadio2
from tornadio2 import SocketServer


class Thing(object):
    x = 0
    y = 0
    weight = 10


class MyConnection(tornadio2.SocketConnection):
    def on_message(self, message):
        pass

MyRouter = tornadio2.TornadioRouter(MyConnection)

application = tornado.web.Application(MyRouter.urls, socket_io_port = 8000)


if __name__ == "__main__":
    socketio_server = SocketServer(application)

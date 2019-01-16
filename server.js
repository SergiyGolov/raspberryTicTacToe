const {
    execFileSync
} = require('child_process');

var ngrokAdress = execFileSync("./getNgrokAdress.sh").toString().replace(/\s/g, '');

var express = require('express');

var app = express();

var http = require('http');

var server = http.createServer(app);

var io = require('socket.io').listen(server);


app.get('/', function (req, res) {
    res.render('game.ejs', {
        serverAdress: ngrokAdress
    });
});


io.sockets.on('connection', socket => {
    socket.on('new_user', nickName => {
        console.log(nickName + " connected to server!");
        socket.nickname = nickName;
    });

    socket.on('disconnect', () => {
        io.broadcast.emit('message',`${socket.nickname} disconnected`);
        console.log(`${socket.nickname} disconnected`);
    });

});

server.listen(8080);
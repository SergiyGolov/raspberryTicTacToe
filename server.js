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

var players = new Array();

var board = new Array(3);

for (var i = 0; i < board.length; i++) {
    board[i] = new Array(3);
    for (var j = 0; j < board[i].length; j++) {
        board[i][j] = "white";
    }
}

io.sockets.on('connection', socket => {
    if (players.length == 0) {
        socket.emit("setColor", "red");
        socket.color = "red";
        players.push(socket);
        socket.emit("wait");
    } else if (players.length == 1) {
        if (players[0].color == "red") {
            socket.emit("setColor", "green");
            socket.color = "green";
        } else {
            socket.emit("setColor", "red");
            socket.color = "red";
        }
        players.push(socket);
        players[0].emit("stopWait");
    } else {
        socket.emit("setColor", "white");
        socket.emit("message", "sorry, there are already 2 other players");
    }

    socket.on('disconnect', () => {
        let index = players.indexOf(socket);
        if (index !== -1) {
            players.splice(index, 1);
        }
    });

    socket.on('play', (move) => {
        if (board[move.x][move.y] == "white" && players.length == 2) {
            board[move.x][move.y] = move.color;
            players.forEach(player => {
                player.emit('playOk', move);
            });
        }
    });

});

server.listen(8080);
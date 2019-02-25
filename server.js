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

var redTurn = true;

var winner = "white";

var turnCount = 0;

for (var i = 0; i < board.length; i++) {
    board[i] = new Array(3);
    for (var j = 0; j < board[i].length; j++) {
        board[i][j] = "white";
    }
}

io.sockets.on('connection', socket => {

    if (turnCount > 0 && players.length == 1) {
        socket.emit("board", parseBoardToLedMatrix());
    }

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
        socket.emit("message", "Sorry, there are already 2 other players");
    }



    socket.on('disconnect', () => {
        let index = players.indexOf(socket);
        if (index !== -1) {
            players.splice(index, 1);
        }
        if (players.length == 0) {
            resetBoard();
            execFileSync("./ledMatrix.py", [parseBoardToLedMatrix()]);
        }
    });

    socket.on('play', (move) => {
        if (board[move.x][move.y] == "white" && players.length == 2 && (move.color == "red" && redTurn || move.color == "green" && !redTurn)) {
            redTurn = !redTurn;
            board[move.x][move.y] = move.color;
            players.forEach(player => {
                player.emit('playOk', move);
            });
            execFileSync("./ledMatrix.py", [parseBoardToLedMatrix()]);
            turnCount++;
            if (turnCount > 2) {
                //check x
                for (let i = 0; i < 3; i++) {
                    if (board[i][move.y] != move.color)
                        break;

                    if (i == 2)
                        winner = move.color;
                }

                if (winner == "white") {
                    //check y
                    for (let i = 0; i < 3; i++) {
                        if (board[move.x][i] != move.color)
                            break;

                        if (i == 2)
                            winner = move.color;
                    }
                }

                if (winner == "white") {
                    //check diagonal
                    if (move.x == move.y) {
                        for (let i = 0; i < 3; i++) {
                            if (board[i][i] != move.color)
                                break;

                            if (i == 2)
                                winner = move.color;
                        }
                    }
                }

                if (winner == "white") {
                    //check anti diagonal
                    if (move.x + move.y == 2) {
                        for (let i = 0; i < 3; i++) {
                            if (board[i][2 - i] != move.color)
                                break;

                            if (i == 2)
                                winner = move.color;
                        }
                    }
                }

                if (winner != "white") {
                    players.forEach(player => {
                        player.emit('message', `${move.color} won`);
                    });
                    resetBoard();
                }
            }
        }
    });

});

server.listen(8080);

function parseBoardToLedMatrix() {
    let matrixString = "";
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            if (board[i][j] == "red")
                matrixString += "r";
            else if (board[i][j] == "green")
                matrixString += "g";
            else
                matrixString += "0";
        }
    }
    return matrixString;
}

function resetBoard() {
    turnCount = 0;
    winner = "white";
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = "white";
        }
    }
}
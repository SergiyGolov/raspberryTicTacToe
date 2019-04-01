const {
    execFileSync
} = require('child_process');

require('dotenv').config({
    path: __dirname + '/.env'
});

var project_root = process.env.PROJECT_ROOT;
var ngrokAdress = execFileSync(`${project_root}/getNgrokAdress.sh`).toString().replace(/\s/g, '');

var app = require('express')(),
    server = require("http").createServer(app),
    io = require("socket.io")(server),
    session = require("express-session")({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true
    }),
    sharedsession = require("express-socket.io-session");

const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.env.DISCORD_BOT_SECRET;

var channel;

console.log(`ngrok adress: http://${ngrokAdress}`);

client.on('ready', () => {
    console.log("Bot ready");
    channel = client.channels.find(x => x.name === 'bot');
    channel.send(`Adress of the server: http://${ngrokAdress}`);
});

client.on('message', msg => {
    if (msg.author.id != client.user.id) {
        if (msg == "/link")
            msg.channel.send(`http://${ngrokAdress}`);
        else if(msg=="/reset"){
            resetBoard();
            execFileSync(`${project_root}/ledMatrix.py`, [parseBoardToLedMatrix()]);
            var sockets = io.sockets.sockets;
            for(var socketId in sockets)
            {
                var socket = sockets[socketId];
                socket.emit("board", parseBoardToLedMatrix());
                socket.emit("message", "The server state has been reset, press f5 on client side");
                socket.disconnect();
            }
            players.splice(0,players.length);
            redTurn=true;
            msg.channel.send("The server state has been reset, press f5 on client side");
        }
    }
});

client.login(token);

app.use(session);

app.get('/', function (req, res) {
    res.render(`${project_root}/views/game.ejs`, {
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

execFileSync(`${project_root}/ledMatrix.py`, [parseBoardToLedMatrix()]);

io.use(sharedsession(session));

io.on('connection', socket => {

    if (players.length == 0) {
        socket.emit("setColor", "red");
        socket.color = "red";
        if (turnCount == 0) {
            let userdata = {
                'color': socket.color
            };
            socket.handshake.session.userdata = userdata;
            socket.handshake.session.save();

            players.push(socket);
            socket.emit("wait");
        } else if (socket.handshake.session.userdata) {
            socket.color = socket.handshake.session.userdata.color;
            players.push(socket);
            socket.emit("setColor", socket.color);
            socket.emit("board", parseBoardToLedMatrix());
        }
    } else if (players.length == 1) {
        if (turnCount == 0) {
            if (players[0].color == "red") {
                socket.emit("setColor", "green");
                socket.color = "green";
            } else {
                socket.emit("setColor", "red");
                socket.color = "red";
            }
            let userdata = {
                'color': socket.color
            };
            socket.handshake.session.userdata = userdata;
            socket.handshake.session.save();
            players.push(socket);
            players[0].emit("stopWait");
        } else if (socket.handshake.session.userdata) {
            socket.color = socket.handshake.session.userdata.color;
            players.push(socket);
            socket.emit("setColor", socket.color);
            socket.emit("board", parseBoardToLedMatrix());
        }
    } else if (!socket.handshake.session.userdata) {
        {
            socket.emit("setColor", "white");
            socket.emit("message", "Sorry, there are already 2 other players");
        }
    }



    socket.on('disconnect', () => {
        let index = players.indexOf(socket);
        if (index !== -1) {
            players.splice(index, 1);
        }
        if (players.length == 0) {
            resetBoard();
            execFileSync(`${project_root}/ledMatrix.py`, [parseBoardToLedMatrix()]);
        }
    });

    socket.on('play', (move) => {
        if (board[move.x][move.y] == "white" && players.length == 2 && (move.color == "red" && redTurn || move.color == "green" && !redTurn)) {
            redTurn = !redTurn;
            board[move.x][move.y] = move.color;
            players.forEach(player => {
                player.emit('playOk', move);
            });
            execFileSync(`${project_root}/ledMatrix.py`, [parseBoardToLedMatrix()]);
            turnCount++;
            if (turnCount > 2) {
                //check x
                for (let i = 0; i < 3; i++) {
                    if (board[i][move.y] != move.color)
                        break;

                    if (i == 2) {
                        winner = move.color;
                        for (let j = 0; j < 3; j++)
                            board[j][move.y] = move.color.toUpperCase();
                    }

                }

                if (winner == "white") {
                    //check y
                    for (let i = 0; i < 3; i++) {
                        if (board[move.x][i] != move.color)
                            break;

                        if (i == 2) {
                            winner = move.color;
                            for (let j = 0; j < 3; j++)
                                board[move.x][j] = move.color.toUpperCase();
                        }
                    }
                }

                if (winner == "white") {
                    //check diagonal
                    if (move.x == move.y) {
                        for (let i = 0; i < 3; i++) {
                            if (board[i][i] != move.color)
                                break;

                            if (i == 2) {
                                winner = move.color;
                                for (let j = 0; j < 3; j++)
                                    board[j][j] = move.color.toUpperCase();
                            }
                        }
                    }
                }

                if (winner == "white") {
                    //check anti diagonal
                    if (move.x + move.y == 2) {
                        for (let i = 0; i < 3; i++) {
                            if (board[i][2 - i] != move.color)
                                break;

                            if (i == 2) {
                                winner = move.color;
                                for (let j = 0; j < 3; j++)
                                    board[j][2 - j] = move.color.toUpperCase();
                            }
                        }
                    }
                }

                if (winner != "white") {
                    channel.send(`${move.color} won`);
                    players.forEach(player => {
                        player.emit('message', `${move.color} won`);
                    });
                    showWinnerOnLedMatrix(false);

                } else if (turnCount == 9 && winner == "white") {
                    channel.send("stalemate !");
                    players.forEach(player => {
                        player.emit('message', "stalemate !");
                    });
                    showWinnerOnLedMatrix(true);
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
            else if (board[i][j] == String("red").toUpperCase())
                matrixString += "R";
            else if (board[i][j] == String("green").toUpperCase())
                matrixString += "G";
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

function showWinnerOnLedMatrix(stalemate) {
    var counter = 13;
    let parsedBoard = parseBoardToLedMatrix();
    if (stalemate)
        parsedBoard = parsedBoard.replace(/r/g, 'R').replace(/g/g, 'G');
    var winAnimation = setInterval(function () {
        counter--;
        if (counter === 0) {
            clearInterval(winAnimation);
            resetBoard();
            players.forEach(player => {
                player.emit("board", parseBoardToLedMatrix());
            });
            execFileSync(`${project_root}/ledMatrix.py`, [parseBoardToLedMatrix()]);
            channel.send('A new game has been started');
        } else if (counter % 2 == 0) {
            let blinkBoard = parsedBoard.replace(/R/g, '0').replace(/G/g, '0');
            execFileSync(`${project_root}/ledMatrix.py`, [blinkBoard]);
            players.forEach(player => {
                player.emit("board", blinkBoard);
            });
        } else {
            let blinkBoard = parsedBoard.replace(/R/g, 'r').replace(/G/g, 'g');
            execFileSync(`${project_root}/ledMatrix.py`, [blinkBoard]);
            players.forEach(player => {
                player.emit("board", blinkBoard);
            });
        }
    }, 250);
}
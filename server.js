const {
    execFileSync
} = require('child_process');

require('dotenv').config();

var ngrokAdress = execFileSync("./getNgrokAdress.sh").toString().replace(/\s/g, '');

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
    channel = client.channels.find(x => x.name ==='général');
    channel.send(`Adress of the server: http://${ngrokAdress}`);
});

client.on('message', msg => {
    if (msg.author.id != client.user.id ) {
        if(msg == "/link")
            msg.channel.send(ngrokAdress);
    }
});

client.login(token);

app.use(session);

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
            //execFileSync("./ledMatrix.py", [parseBoardToLedMatrix()]);
        }
    });

    socket.on('play', (move) => {
        if (board[move.x][move.y] == "white" && players.length == 2 && (move.color == "red" && redTurn || move.color == "green" && !redTurn)) {
            redTurn = !redTurn;
            board[move.x][move.y] = move.color;
            players.forEach(player => {
                player.emit('playOk', move);
            });
            //execFileSync("./ledMatrix.py", [parseBoardToLedMatrix()]);
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
                    channel.send(`${move.color} won`);
                    resetBoard();
                    players.forEach(player => {
                        player.emit('message', `${move.color} won`);
                        player.emit("board", parseBoardToLedMatrix());
                    });
                    //execFileSync("./ledMatrix.py", [parseBoardToLedMatrix()]);
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
    channel.send('A new game has been started');
    turnCount = 0;
    winner = "white";
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = "white";
        }
    }
}

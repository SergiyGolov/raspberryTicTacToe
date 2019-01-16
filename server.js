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



var playerCounter=0;



io.sockets.on('connection', socket => {
    socket.on('new_user', nickName => {
        console.log(nickName + " connected to server!");
        socket.nickname = nickName;
        playerCounter++;
        if(playerCounter==1)
        {
            socket.emit("setColor","red");
        }else if(playerCounter==2)
        {
            socket.emit("setColor","green");
        }else{
            socket.emit("setColor","white");
            socket.emit("message","sorry, there are already 2 other players");
        }
        console.log(playerCounter);
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('message',`${socket.nickname} disconnected`);
        console.log(`${socket.nickname} disconnected`);
        playerCounter--;
    });

});

server.listen(8080);
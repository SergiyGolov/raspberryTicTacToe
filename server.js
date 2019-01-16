var http = require('http');

const { execFileSync } = require('child_process');

var ngrokAdress=execFileSync("./getNgrokAdress.sh").toString();


var server = http.createServer((req, res) => {
    res.render('game.ejs',{serverAdress:ngrokAdress});
});

var io = require('socket.io').listen(server);



io.sockets.on('connection', socket => {

    socket.on('new_user', nickName => {
        console.log(nickName + " connected to server!");
    });

});

server.listen(8080);

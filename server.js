var http = require('http');

var fs = require('fs');

var server = http.createServer((req, res) => {
    fs.readFile('./game.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

var io = require('socket.io').listen(server);

io.sockets.on('connection', socket => {

    socket.on('new_user', nickName => {
        console.log(nickName+" connected to server!");
    });

});

server.listen(8080);

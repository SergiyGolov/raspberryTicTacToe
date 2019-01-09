var http = require('http');

var fs = require('fs');

var exec = require('child_process');

exec("ngrok http 8080", (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
});

exec("curl --silent --show-error http://127.0.0.1:4040/api/tunnels | sed -nE 's/.*public_url\":\"https:..([^\"]*).*/\1/p'", (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`); //TO-DO: use js templating engine to pass this variable to game.html and io.connect from game.html afterwards with this variable
    console.log(`stderr: ${stderr}`);
});

var server = http.createServer((req, res) => {
    fs.readFile('./game.html', 'utf-8', function (error, content) {
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        res.end(content);
    });
});

var io = require('socket.io').listen(server);



io.sockets.on('connection', socket => {

    socket.on('new_user', nickName => {
        console.log(nickName + " connected to server!");
    });

});

server.listen(8080);
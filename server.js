const { execFileSync } = require('child_process');

var ngrokAdress=execFileSync("./getNgrokAdress.sh").toString();

var express = require('express');

var app = express();

var io = require('socket.io').listen(app);


app.get('/', function(req, res) {
    res.render('game.ejs',{serverAdress:ngrokAdress});
});


io.sockets.on('connection', socket => {

    socket.on('new_user', nickName => {
        console.log(nickName + " connected to server!");
    });

});

app.listen(8080);


const fs = require('fs')
const express = require('express');
const expressBrowserify = require('express-browserify');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 8123;

const updateNotifier = require('update-notifier');
const pkg = require('bc19/package.json');

// notify users for bc19 updates
updateNotifier({
    pkg,
    updateCheckInterval:1000*20
}).notify();

app.get('/main.js', expressBrowserify('./site/main.js'));
app.use(express.static('./site'));

var file_path = '';

function watch_file(fpath) {
    delay = false;

    fs.watch(fpath, (event, filename) => {
        if (filename) {
            if (delay) return;
            setTimeout(function() {
                delay = false;
            }, 100);
            delay = true;

            console.log('file updated!');
            
            // broadcast file update news
            io.emit('file_update', { for: 'everyone' });
        }
    });
}

app.get('/replay', function(req, res) {
    if (file_path == '') {
        res.sendStatus(404);
    } else {
        res.sendFile(file_path);
    }
});

app.get('/set_replay', function(req, res) {
    var fpath = (new Buffer(req.url.split('?')[1], 'base64')).toString('binary');

    if (fs.existsSync(fpath)) {
        file_path = fpath;
        res.sendStatus(200);

        watch_file(file_path);
    } else {
        res.sendStatus(404);
    }
});

io.on('connection', function(socket){
    console.log('Got connection');
});

http.listen(port, () => console.log(`Running on port ${port}!`))

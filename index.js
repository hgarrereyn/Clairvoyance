
const fs = require('fs')
const express = require('express');
const expressBrowserify = require('express-browserify');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 8123;

var npm = new require('npm-api')();
const pkg = require('bc19/package.json');

var versions = {
    curr: pkg.version,
    newest: ''
};

console.log('BC19 Version: ' + versions.curr);

function check_bc19_update() {
    console.log('Checking for bc19 update');
    var repo = npm.repo('bc19');
    repo.package().then(function(pkg) {
        var version = pkg.version;
        console.log('newest version is: ' + version);
        versions.newest = version;
    }, function(err) {
        console.log('Error looking up bc19 information.')
        console.log('bc19 may be outdated');
    });
}

setInterval(function(){
    check_bc19_update();
}, 1000 * 60);

newest_bc19_version = check_bc19_update();

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

app.get('/version', function(req, res) {
    res.send(JSON.stringify(versions));
});

io.on('connection', function(socket){ });

http.listen(port, () => console.log(`Running on port ${port}!`))

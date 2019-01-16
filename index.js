
const fs = require('fs')
const express = require('express');
const app = express();
var http = require('http').Server(app);
var http_get = require('http').get;
var io = require('socket.io')(http);
const port = 8123;

const npm = require('npm');
const browserify = require('browserify');

var path = require('path');
var busboy = require("connect-busboy");
app.use(busboy());

var pkg = require('bc19/package');

var versions = {
    curr: pkg.version,
    newest: '',
    available: []
};

console.log('BC19 Version: ' + versions.curr);

npm.load(function(err) {
    npm.commands.view(['bc19', 'versions'], function(er, data){
        var n = Object.keys(data)[0];
        versions.newest = n;
        versions.available = data[n]['versions'].reverse();

        console.log('Newest: ' + versions.newest);
    });
});

app.get('/main.js', function(req, res) {
    var b = browserify();
    b.add('./site/main.js');
    b.bundle(function(err, buf) {
        res.type('text/javascript').send(buf);
    });
});

app.use(express.static('./site'));

var file_path = '';
var url_path = '';
var used_path = '';

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
    if (used_path == 'file') {
        if (file_path == '') {
            res.sendStatus(404);
        } else {
            res.sendFile(file_path);
        }
    } else if (used_path == 'url') {
        if (url_path == '') {
            res.sendStatus(404);
        } else {
            http_get(url_path, function(resp) {
                resp.pipe(res);
            });
        }
    } else if (used_path == 'upload') {
        res.sendFile(path.join(__dirname, '.tmp_replay'), {dotfiles: 'allow'});
    } else {
        res.sendStatus(404);
    }
});

app.get('/replay_path', function(req, res) {
    if (used_path == 'file') {
        res.send(file_path);
    } else if (used_path == 'url') {
        res.send(url_path);
    } else if (used_path == 'upload') {
        res.send(file_path);
    } else {
        res.sendStatus(404);
    }
});

app.get('/set_replay', function(req, res) {
    var fpath = (new Buffer(req.url.split('?')[1], 'base64')).toString('binary');

    if (fs.existsSync(fpath)) {
        file_path = fpath;
        used_path = 'file';
        res.sendStatus(200);

        watch_file(file_path);
    } else {
        res.sendStatus(404);
    }
});

app.get('/set_replay_url', function(req, res) {
    var upath = (new Buffer(req.url.split('?')[1], 'base64')).toString('binary');

    // very basic sanitisation.
    if (upath.startsWith("https://")) {
        // this is a somewhat dodgy way of doing it,
        // someone feel free to make it less dodgy
        // in the future
        url_path = upath.substring(0, 4) + upath.substring(5);
        used_path = 'url';
        res.sendStatus(200);
    } else if (upath.startsWith("http://")) {
        url_path = upath;
        used_path = 'url';
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
})

app.post('/upload_replay', function(req, res) {
    if(req.busboy) {
        req.pipe(req.busboy);

        req.busboy.on("file", function(fieldName, fileStream, fileName, encoding, mimeType) {
            file_path = fileName;
            used_path = 'upload';

            // save to disk at: .tmp_replay
            var fstr = fs.createWriteStream(path.join(__dirname, '.tmp_replay'));
            fileStream.pipe(fstr);

            res.redirect('/')
        });
    } else {
        res.redirect('/settings');
    }
});

app.get('/version', function(req, res) {
    res.send(JSON.stringify(versions));
});

app.get('/set_version', function(req, res) {
    var version = req.url.split('?')[1];

    console.log('switching to version: ' + version);

    npm.load(function(err) {
        npm.commands.install(['bc19@' + version], function(er, data){
            if (er) {
                res.sendStatus(404);
            } else {
                delete require.cache[require.resolve('bc19/package')]

                var pkg = require('bc19/package');
                versions.curr = pkg.version;
                
                res.sendStatus(200);
            }
        });
    });
});

io.on('connection', function(socket){ });

http.listen(port, () => console.log(`Running on port ${port}!`))


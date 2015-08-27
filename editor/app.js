var express = require('express');
var bodyParser = require('body-parser');
var app = express();
require('colors');
require('vvv');
var fs = require('fs');
var path = require('path');

app.use(bodyParser.json());

app.set('view engine', 'jade');
app.set('views', __dirname);

app.use(express.static(path.join(__dirname, 'static')));

app.get('/_up', function(req, res) {
    res.sendStatus(200);
});

var files = {};

/**
 * register a file to be edited
 */
app.post('/_edit', function(req, res, next) {
    log.v('/_edit req.body', req.body);
    files[req.body.filename] = req.body.fileFullURL;
    fs.stat(req.body.fileFullURL, function(e, r) {
        if (e) {
            fs.createReadStream(path.join(__dirname, '../test.js')).pipe(fs.createWriteStream(req.body.fileFullURL));
        }
        res.sendStatus(200);
    })
});

/**
 * Serve the edit page
 */
app.get('/:filename', function(req, res, next) {
    log.v('get', req.params.filename);
    if (!files[req.params.filename]) {
        return next('Hey dude i am not editing that file right now.\nif you want to start it, do "quickflow ' + req.params.filename + '"');
    }
    parse(req.params.filename, function(e, d) {
        if (e) {
            return next(e);
        }
        log.v(d);
        log.vv(files);
        res.render('edit', d);
    });
})

/**
 * React version
 */
app.get('/r/:filename', function(req, res, next) {

})

/**
 * API route for saving stuff
 */
app.post('/_save', function(req, res, next) {
    log.v('post /_save', req.body.filename);
    log.vv(req.body);
    var lines = [];
    lines.push("var quickflow = module.exports = require('quickflow')()\n");
    var graph = req.body.graph;
    Object.keys(graph).map(function(k) {
        lines.push('function ' + graph[k].name + '(data, done) {');
        lines.push(graph[k].body);
        lines.push('}');
        lines.push('');
    });
    Object.keys(graph).map(function(k) {
        if (graph[k].startingPoint) {
            lines.push('quickflow.registerStartingPoint(' + graph[k].name + ')');
        }
        graph[k].children.map(function(c) {
            lines.push('quickflow.register(' + graph[k].name + ', ' + graph[c].name + ')');
        })
    })
    lines.push('if (!module.parent) quickflow.run();')
    log.vv(lines);
    fs.writeFile(files[req.body.filename], lines.join('\n'))
    res.sendStatus(200);
})

function parse(filename, cb) {
    var data = {
        filename: filename,
        fileFullURL: files[filename]
    };
    delete require.cache[files[filename]];
    try {
        data.graph = require(files[filename]).graph;
    } catch (e) {
        return cb('Could not parse ' + data.filename + ', please fix it.\n\n' + e.stack);
    }
    cb(null, {data: data});
}

module.exports = function(done) {
    app.listen(31337, function (e) {
        if (e) {
            console.error(e);
        }
        console.log('quickflow'.rainbow, "(don't close this terminal)".gray)
        done();
    });
}
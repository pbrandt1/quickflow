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

var sample = '' + fs.readFileSync(path.join(__dirname, '../test.js'));
log.vv(sample);

/**
 * register a file to be edited
 */
app.post('/_edit', function(req, res, next) {
    log.v('/_edit req.body', req.body);
    files[req.body.filename] = req.body.fileFullURL;
    res.sendStatus(200);
});

/**
 * Serve the edit page
 */
app.get('/:filename', function(req, res, next) {
    log.v('get', req.params.filename);
    if (!files[req.params.filename]) {
        return next('Hey dude i am not editing that file right now');
    }
    parse(req.params.filename, function(e, d) {
        if (e) {
            return next(e);
        }
        res.render('edit', d);
    });
})

app.post('/_save', function(req, res, next) {
    log.v('post /_save', req.body.filename);
    log.vv(req.body);
    var lines = [];
    lines.push("var quickflow = require('quickflow')\n");
    var graph = req.body.graph;
    Object.keys(graph).map(function(k) {
        lines.push('function ' + graph[k].name + '(data, done) {');
        lines.push('  ' + graph[k].body.replace(/\n/g, '\n  '));
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
    console.log(lines);
    fs.writeFile(req.body.fileFullURL.replace('.js', '2.js'), lines.join('\n'))
})

function parse(filename, cb) {
    var data = {
        filename: filename,
        fileFullURL: files[filename]
    };
    data.graph = require(files[filename]);
    cb(null, {data: data});
}

app.get('*', function(req, res) {
    res.send('sup');
});


module.exports = function(done) {
    app.listen(31337, function (e) {
        if (e) {
            console.error(e);
        }
        console.log('quickflow'.rainbow, "(don't close this terminal)".gray)
        done();
    });
}
var filename = process.argv[2];
var path = require('path');
var fileFullURL = path.resolve(process.cwd(), filename);
var filename = path.basename(fileFullURL)

require('colors');
require('vvv');
var open = require('open');

log.v('editing', filename, '(' + fileFullURL + ')');

var root = 'http://localhost:31337';
var needle = require('needle');
log.vv('sending request to /_up');
needle.get(root + '/_up', function(e, r) {
    log.vv('done with request to /_up');
    if (e) {
        log.v('starting app');
        require('./app')(function() {
            log.v('app started');
            edit()
        });
    } else {
        log.v('app already up');
        edit()
    }
})

function edit() {
    log.vv('sending request to /_edit');
    needle.post(root + '/_edit', {
        filename: filename,
        fileFullURL: fileFullURL
    }, {
        json: true
    }, function(e, r) {
        log.vv('done with request to /_edit');
        if (e) {
            return console.error(('Could not edit ' + fileFullURL + ' (--_--)').red)
        }
        if (r.err) {
            console.error(('Could not edit ' + fileFullURL).red + ' (μ_μ)')
            console.error(r.err.message.red)
            return;
        }
        console.log('editing ' + filename + ' at ' + (root + '/' + filename).blue);
        open(root + '/' + filename);
    })
}
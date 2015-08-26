module.exports = require('./runner');

// if you run this program, it starts up the editor
if (!module.parent) {
    require('./editor');
}
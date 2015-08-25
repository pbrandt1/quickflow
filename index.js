// if you run this program, it starts up the editor
if (!module.parent) {
    require('./editor');
}

// otherwise if you require() quickflow, it exports the run tools
else {
    module.exports = require('./runner');
}
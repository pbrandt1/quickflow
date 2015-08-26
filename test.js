var quickflow = require('./index');

function startingPoint(data, done) {
    done({
        str: 'hello people'
    })
}

function upperCase(data, done) {
    done(data.str.toUpperCase());
}

function log(data, done) {
    console.log(data);
    done();
}

quickflow.registerStartingPoint(startingPoint);
quickflow.register(startingPoint, upperCase);
quickflow.register(upperCase, log);
if (!module.parent) {
    quickflow.run();
} else {
    module.exports = quickflow.graph;
}
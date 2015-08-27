var quickflow = module.exports = require('quickflow')()

function startingPoint(data, done) {
// here's a sample to get you started:
// we are editing the "startingPoint" function.
// calling the done() callback passes the specified data
// along the lines of the graph
done(data)
}

function upperCase(data, done) {
// you can transform the data you get into anything
// there are no rules
done({string: data.toUpperCase()})
}

function log(data, done) {
// you don't even have to call done() if you don't want to
// all logging is up to you, so you don't have to rely on
// a complicated framework convention to make things work.
console.log(data)
}

quickflow.connect(startingPoint, upperCase)
quickflow.connect(upperCase, log)
if (!module.parent) quickflow.run()
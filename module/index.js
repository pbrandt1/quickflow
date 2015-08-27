require('vvv');
require('colors');

var Quickflow = function() {
    if (!(this instanceof Quickflow)) {
        return new Quickflow();
    }
    this.graph = {};
    this.startupFunctions = [];
};

function getBody(f) {
    return f.toString()
        .split('{').splice(1).join('{')
        .split('}').slice(0, -1).join('}')
        .trim();
}

/**
 * Registers a source/sink pair so that functions know what to do with their output
 * @param fn_source
 * @param fn_sink
 * @constructor
 */
Quickflow.prototype.connect = function(fn_source, fn_sink) {
    var graph = this.graph;
    // make sure they are in the graph object
    if (fn_source && !graph[fn_source.name]) {
        graph[fn_source.name] = {
            fn: fn_source,
            name: fn_source.name,
            body: getBody(fn_source),
            children: []
        }
    }

    if (fn_sink && !graph[fn_sink.name]) {
        graph[fn_sink.name] = {
            fn: fn_sink,
            name: fn_sink.name,
            body: getBody(fn_sink),
            children: []
        }
    }

    if (fn_source && fn_sink) {
        graph[fn_source.name].children.push(fn_sink.name);
    }
}

/**
 * Runs quickflow
 * @constructor
 */
Quickflow.prototype.run = function (data) {
    var runFunctionByName = this.runFunctionByName.bind(this);
    var graph = this.graph;
    log.v('Graph of registered functions:');
    log.v(graph);
    log.v('');

    // find all the root nodes
    var rootNodes = Object.keys(graph).reduce(function(startupNodes, k) {
        graph[k].children.map(function(c) {
            if (startupNodes.indexOf(c) >= 0) {
                startupNodes.splice(startupNodes.indexOf(c), 1);
            }
        });
        return startupNodes;
    }, Object.keys(graph))
    log.v('root nodes:', rootNodes);
    rootNodes.map(function(f) {
        runFunctionByName(f, data);
    })
}

Quickflow.prototype.runFunctionByName = function(name, data) {
    var graph = this.graph;
    var runFunctionByName = this.runFunctionByName.bind(this);
    log.v('running', name, 'with', data);
    process.nextTick(function() {
        try {
            graph[name].fn.call(null, data, function (data) {
                graph[name].children.map(function (n) {
                    runFunctionByName(n, data);
                })
            })
        } catch (e) {
            console.error(('error running function \'' + name + '\' with data \'' + JSON.stringify(data) + '\'').red);
            console.error(e.stack.red);
        }
    });
}

module.exports = Quickflow;
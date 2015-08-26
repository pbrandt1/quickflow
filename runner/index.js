require('vvv');
require('colors');

var graph = {};
var startupFunctions = [];

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
function QuickFlowRegister(fn_source, fn_sink) {
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
 * Tells quickflow to run a function at start
 * @param fn
 */
function registerStartingPoint(fn) {
    if (fn && !graph[fn.name]) {
        graph[fn.name] = {
            fn: fn,
            name: fn.name,
            body: getBody(fn),
            children: []
        }
    }
    startupFunctions.push(fn.name);
    graph[fn.name].startingPoint = true;
}

/**
 * Runs quickflow
 * @constructor
 */
function Run() {
    log.v('Graph of registered functions:');
    log.v(graph);
    log.v('');
    startupFunctions.map(function(f) {
        runFunctionByName(f);
    })
}

function runFunctionByName(name, data) {
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

module.exports = {
    register: QuickFlowRegister,
    registerStartingPoint: registerStartingPoint,
    run: Run,
    graph: graph
};
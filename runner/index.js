require('vvv');

var graph = {};
var startupFunctions = [];


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
            children: []
        }
    }

    if (fn_sink && !graph[fn_sink.name]) {
        graph[fn_sink.name] = {
            fn: fn_sink,
            children: []
        }
    }

    if (!fn_source && fn_sink) {
        // if you call something with a null source, then the sink function is ran as a start-up function
        startupFunctions.push(fn_sink.name);
    } else if (fn_source) {
        if (fn_sink) {
            graph[fn_source.name].children.push(fn_sink.name);
        }
    }
}

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
            console.error(e.message);
            console.error(e.stack);
        }
    });
}

module.exports = {
    register: QuickFlowRegister,
    run: Run
};
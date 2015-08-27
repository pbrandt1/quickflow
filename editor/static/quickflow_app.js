// set up SVG for D3
var colors = d3.scale.category10();
var currentColorId = 0;
var functions = {};

var svg = d3.select('.graph')
    .append('svg')
    .attr('oncontextmenu', 'return false;')
    .attr('width', '100%')
    .attr('height', '100%');

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = Object.keys(quickflowData.graph).map(function(k) {
    var node = quickflowData.graph[k];
    node.id = currentColorId ++;
    node.reflexive = false;
    return node;
});
    //[
    //    {id: 0, reflexive: false, name: 'f_1'},
    //    {id: 1, reflexive: false, name: 'f_2'},
    //    {id: 2, reflexive: false, name: 'f_3'}
    //]
var links = Object.keys(quickflowData.graph).reduce(function(links, k) {
    quickflowData.graph[k].children.map(function(c) {
        links.push({
            source: quickflowData.graph[k],
            target: quickflowData.graph[c],
            left: false,
            right: true
        })
    })
    return links;
}, []);

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([$('.graph').width(), $('.graph').height()])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}

// update graph (called when needed)
function restart() {
    // path (link) group
    path = path.data(links);

    // update existing links
    path.classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


    // add new links
    path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
        .on('mousedown', function(d) {
            if(d3.event.ctrlKey) return;

            // select link
            mousedown_link = d;
            if(mousedown_link === selected_link) selected_link = null;
            else selected_link = mousedown_link;
            selected_node = null;
            restart();
        });

    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) { return d.id; });

    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('text')
        .text(function(d) { return d.name; })
        .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
        .classed('reflexive', function(d) { return d.reflexive; });

    // add new nodes
    var g = circle
        .enter()
        .append('svg:g')
        .on('mouseover', function(d) {
            if(!mousedown_node || d === mousedown_node) return;
            // enlarge target node
            d3.select(this).attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function(d) {
            if(!mousedown_node || d === mousedown_node) return;
            // unenlarge target node
            d3.select(this).attr('transform', '');
        })
        .on('mousedown', function(d) {
            console.log('mousedown on node');
            console.log(d);
            edit(d);
            if(d3.event.ctrlKey) return;

            // select node
            mousedown_node = d;
            if(mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;

            // reposition drag line
            drag_line
                .style('marker-end', 'url(#end-arrow)')
                .classed('hidden', false)
                .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

            restart();
        })
        .on('mouseup', function(d) {
            if(!mousedown_node) return;

            // needed by FF
            drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            // check for drag-to-self
            mouseup_node = d;
            if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

            // unenlarge target node
            d3.select(this).attr('transform', '');

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target, direction;
                source = mousedown_node;
                target = mouseup_node;
                direction = 'right';

            var link;
            link = links.filter(function(l) {
                return (l.source === source && l.target === target);
            })[0];

            if(link) {
                link[direction] = true;
            } else {
                link = {source: source, target: target, left: false, right: true};
                links.push(link);
                source.children.push(target.name);
                shouldSave = true;
            }

            // select new link
            selected_link = link;
            selected_node = null;
            restart();
        });

    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .attr('id', function(d) { return 'node_' + d.id; })
        .text(function(d) { return d.name; });

    // remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.size([$('.graph').width(), $('.graph').height()]);
    force.start();
}

function mousedown() {
    // prevent I-bar on drag
    d3.event.preventDefault();

    // because :active only works in WebKit?
    svg.classed('active', true);

    if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    // insert new node at point
    var point = d3.mouse(this),
        node = {
            id: currentColorId ++,
            reflexive: false,
            name: 'function_' + (Math.random()*1000000|0).toString(32),
            body: '',
            children: []
        };
    node.x = point[0];
    node.y = point[1];
    nodes.push(node);
    quickflowData.graph[node.name] = node;
    shouldSave = true;

    restart();
    restart();
}

function mousemove() {
    if(!mousedown_node) return;

    // update drag line
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if(mousedown_node) {
        // hide drag line
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');
    }

    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
}

function deleteNode(node) {
    // delete ui links
    links.filter(function(l) {
        return (l.source === node || l.target === node);
    }).map(function(l) {
        links.splice(links.indexOf(l), 1);
    });

    // delete ui node
    nodes.splice(nodes.indexOf(node), 1);
    delete quickflowData.graph[node.name];

    // delete children
    nodes.map(function(n) {
        if (n.children.indexOf(node.name) >= 0) {
            n.children.splice(n.children.indexOf(node.name), 1);
        }
    })
}

function deleteLink(link) {
    links.splice(links.indexOf(link), 1);
    link.source.children.splice(link.source.children.indexOf(link.target.name), 1);
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
    if (event.target !== document.body) { return true }
    //d3.event.preventDefault();

    if(lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if(d3.event.keyCode === 17) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if(!selected_node && !selected_link) return;
    switch(d3.event.keyCode) {
        case 8: // backspace
        case 46: // delete
            console.log('delete');
            if(selected_node) {
                deleteNode(selected_node);
            } else if(selected_link) {
                deleteLink(selected_link);
            }
            selected_link = null;
            selected_node = null;
            restart();
            break;
        case 66: // B
            //if(selected_link) {
            //    // set link direction to both left and right
            //    selected_link.left = true;
            //    selected_link.right = true;
            //}
            //restart();
            break;
        case 76: // L
            //if(selected_link) {
            //    // set link direction to left only
            //    selected_link.left = true;
            //    selected_link.right = false;
            //}
            //restart();
            break;
        case 82: // R
            //if(selected_node) {
            //    // toggle node reflexivity
            //    selected_node.reflexive = !selected_node.reflexive;
            //} else if(selected_link) {
            //    // set link direction to right only
            //    selected_link.left = false;
            //    selected_link.right = true;
            //}
            //restart();
            break;
    }
    shouldSave = true;
}

function keyup() {
    lastKeyDown = -1;

    // ctrl
    if(d3.event.keyCode === 17) {
        circle
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
        svg.classed('ctrl', false);
    }
}

// app starts here
svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);
d3.select('body')
    .on('keydown', keydown)
    .on('keyup', keyup);
restart();
restart(); // have to do this twice for some reason (don't know and don't care)
$( window ).resize(function() {
    restart();
})

var editor = ace.edit('ace');
editor.setTheme('ace/theme/monokai');
editor.getSession().setMode("ace/mode/javascript");
editor.getSession().setUseSoftTabs(true);
editor.getSession().setTabSize(2);

// Mark shouldSave as true every time the text changes
var shouldSave = false;
editor.getSession().on('change', function(e) {
    shouldSave = true;
    current_function.body = editor.getValue();
});

// save every second if required
setInterval(function() {
    if (!shouldSave) { return }
    console.log('saving');
    shouldSave = false;
    $.ajax({
        url: '/_save',
        type: 'POST',
        data: JSON.stringify(quickflowData),
        contentType: 'application/json'
    })
}, 1000);

var current_function;
function edit(node) {
    current_function = node;
    $('.fn-name').html('function <strong>' + node.name + '</strong>(data, done) <a class="edit" href="#" onclick="return editName()">edit</a>');
    editor.setValue(node.body);
    editor.gotoLine(0);
}

function editName() {
    $('.fn-name').html('function <input type="text" value=' + current_function.name + '>(data, done) <a href="#" onclick="return editNameDone()">done</a> <a href="#" onclick="return editNameCancel()">cancel</a>')
    return false;
}

$(document).on('keydown', '.fn-name input', function(e) {
    // ignore invalid function characters
    if ([32].indexOf(e.which) >= 0) {
        return false;
    }
})

function editNameDone() {
    var newName = $('.fn-name input').val();
    var oldName = current_function.name;
    if (newName === '' || (quickflowData.graph[newName] && quickflowData.graph[newName] !== current_function)) { return false }

    delete quickflowData.graph[oldName];
    current_function.name = newName;
    quickflowData.graph[newName] = current_function;
    nodes.map(function(n) {
        if (n.children.indexOf(oldName) >= 0) {
            n.children.splice(n.children.indexOf(oldName), 1);
            n.children.push(newName);
        }
    })
    restart();
    shouldSave = true;
    edit(current_function);
    return false;
}

function editNameCancel() {
    edit(current_function);
    return false;
}

if (Object.keys(quickflowData.graph).length > 0)
    edit(quickflowData.graph[Object.keys(quickflowData.graph)[0]]);

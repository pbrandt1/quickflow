# quickflow
A disgustingly simple flow based programming gui that makes runnable node scripts.  Install quickflow with -g and also install it to your node_modules folder.
```sh
npm install -g quickflow # install the gui
npm install quickflow # install the module
quickflow example.js # launch the gui, creating "example.js"
node example.js # run the code you just wrote
```
<img alt="quickflow screenshot" src="http://i.imgur.com/GbF8mdc.png">

You can also `require()` quickflow files and run them with whatever data you want.  I guess that means you could use them as request handlers in an express app or something.
```javascript
var handleRequest = require('./handleRequest.js')
handleRequest.run(req.body);
```

When an exception occurs, quickflow tells you what data was put into the function.
```
error running function 'upperCase' with data '[1,2,3]'
TypeError: undefined is not a function
    at upperCase (/data/code/quickflow/testException.js:14:24)
    at /data/code/quickflow/module/index.js:83:28
    at process._tickCallback (node.js:355:11)
    at Function.Module.runMain (module.js:503:11)
    at startup (node.js:129:16)
    at node.js:814:3
```

I'm seeking help:
* Nostradamus came to me in a dream and predicted that UX would totally suck for complicated graphs.  Therefore I'm seeking someone to make the graph look and act nice.

credits:
* I would like to thank rkirsling for http://bl.ocks.org/rkirsling/5001347.  I apologize for turning your code into a hideous swamp creature.
* I would also like to thank my power drill, which I discovered could be used to turn a manual coffee grinder into an electric coffee grinder.

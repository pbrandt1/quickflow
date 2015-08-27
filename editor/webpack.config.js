module.exports = {
    entry: "./app.jsx",
    output: {
        path: "./static",
        filename: "quickflow_react.js"
    },
    module: {
        loaders: [
            { test: /\.jsx/, loader: "jsx-loader" },
            // => "jade" loader is used for ".jade" files

            { test: /\.css$/, loader: "style!css" },
            // => "style" and "css" loader is used for ".css" files
            // Alternative syntax:
            { test: /\.css$/, loaders: ["style", "css"] },
        ]

    }
};

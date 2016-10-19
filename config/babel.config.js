module.exports = {
    "cacheDirectory": true,
    "cacheIdentifier": "v8",
    "presets": ["es2015-loose", "stage-0"],
    "plugins": [
        ["babel-plugin-transform-react-jsx", {"pragma": "VDOM.createElement"}],
        "babel-plugin-cx"
    ]
};


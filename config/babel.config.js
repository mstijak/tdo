module.exports = {
    "cacheDirectory": true,
    "cacheIdentifier": "4",
    "presets": [
        "@babel/preset-typescript",
        [
            "cx-env",
            {
                corejs: 3,
                targets: {
                    chrome: 66
                },
                loose: true,
                useBuiltIns: 'usage',
                modules: false,
                cx: {
                    imports: {
                        useSrc: true
                    }
                }
            }
        ]
    ],
    "plugins": []
};


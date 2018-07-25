module.exports = {
    "cacheDirectory": true,
    "cacheIdentifier": "2",
    "presets": [
        [
            "cx-env",
            {
                targets: {
                    chrome: 66,
                    ff: 59,
                    edge: 17,
                    safari: 11
                },
                loose: true,
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


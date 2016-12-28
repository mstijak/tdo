module.exports = {
    "cacheDirectory": true,
    "cacheIdentifier": "1",
    "presets": [
        [
            "cx-env",
            {
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


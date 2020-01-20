const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        main: './main.js'
    },
    node: {
        fs: 'empty'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: path.resolve(__dirname,"src/cjs.js"),
                options: {
                    dest: "test/TestResult.js",
                    wrapper: /(?<=\/\*\*)[\s\S]*?(?=\*\/)/,
                    deleteMetaInfo: true,
                    metasRegexps: {
                        title: "title:",
                        tags: function(data, getRegexpRes) {
                            let tagText = getRegexpRes(data, /(?<=tags:\s*).*/g);
                            return getRegexpRes(tagText, /(?<=\[\s?).*(?=\])/).split(
                                /,\s+/
                            );
                        }
                    },
                    append: function(loaderCtx, data, getRegexpRes) {
                        let path =
                            "/article" +
                            getRegexpRes(
                                loaderCtx.resourcePath,
                                /(?<=\\post)\\.*?(?=.md)/
                            ).replace(/\\/g, "/");
                        return { path };
                    }
                }
            }
        ]
    },
    resolveLoader: {
        modules: ['node_modules', './src/']
    }
}
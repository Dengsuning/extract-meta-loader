let fs = require('fs'),
    options = {},
    util = require('loader-utils'),
    pathFileMap = new Map()

const getRegexpRes = (text = "", exp) => {
    let res = text.match(exp)
    if (res) {
        return res instanceof Array && res.length ? res[0] : res
    }
    return ''
}

const getRegExpStr = (string, isWrapper) => {
    let res = ""
    if (isWrapper) {
        res = `(?<=${string}\\s+)[\\s\\S]*?(?=${string}+)`
    } else {
        res = `(?<=${string}\\s+).*`
    }
    return res
}

const convertToRegExp = (reg, isWrapper) => reg instanceof RegExp ? reg : new RegExp(getRegExpStr(reg, isWrapper))

const getFileMetas = function(text) {
    let metaContent = getRegexpRes(text, convertToRegExp(options.wrapper, true))
    if (!metaContent) { return null }
    let res = Object.keys(options.metasRegexps).reduce((obj, key) => {
        let regexp = options.metasRegexps[key]
        if (regexp instanceof Function) {
            obj[key] = regexp(metaContent, getRegexpRes)
        } else {
            obj[key] = getRegexpRes(metaContent, convertToRegExp(regexp, false))
        }
        return obj
    }, {})
    if (options.append) {
        Object.assign(res, options.append(this, text, getRegexpRes))
    }
    return res
}

const writeFile = (content) => {
    fs.writeFile(options.dest, content, (err) => {
        if (err) { console.error(err) }
    })
}

module.exports = function(content) {
    if (!this.resourceQuery) {
        options = util.getOptions(this)
        let metaInfo = getFileMetas.call(this, content),
            metaList = []
        pathFileMap.set(this.resourcePath, metaInfo)
        for (let item of pathFileMap.values()) {
            metaList.push(item)
        }
        writeFile(`export default ${JSON.stringify(metaList, null, 2)}`)
    }
    if (options.deleteMetaInfo) {
        return content.replace(new RegExp(`${options.wrapper}[\\s|\\S]*?${options.wrapper}`),'')
    }
    return content;
};
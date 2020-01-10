let fs = require('fs'),
    util = require('loader-utils'),
    options = {},
    loaderMap = new Map()

/**
 * 使用String.match方法获取数据信息，并自动返回匹配的第一项（match可能返回的是一个数组）
 * @param {String} text 
 * @param {RegExp} exp 
 */
const getRegexpRes = (text = "", exp) => {
    let res = text.match(exp)
    if (res) {
        return res instanceof Array && res.length ? res[0] : res
    }
    return ''
}

/**
 * 将用户传入的字符串转换为RegExp的匹配模式  实现正则变量化
 * @param {String} string 提取数据的边界符或匹配模式
 * @param {Boolean} isWrapper 是否是边界符
 */
const getRegExpStr = (string, isWrapper) => {
    let res = ""
    if (isWrapper) {
        res = `(?<=${string}\\s+)[\\s\\S]*?(?=${string}+)`
    } else {
        res = `(?<=${string}\\s+).*`
    }
    return res
}
/**
 * 将用户输入的元数据匹配准则转化为正则
 * @param {String | RegExp} reg 提取信息的字符串模式或正则
 * @param {Boolean} isWrapper 是否是元数据信息边界符 true => 自动以该祖父传作为片段开始和结尾来匹配
 */
const convertToRegExp = (reg, isWrapper) => reg instanceof RegExp ? reg : new RegExp(getRegExpStr(reg, isWrapper))

/**
 * 获取资源文件内自定义的元数据
 * @param {String} text Loader传入的资源文件内容
 */
const getFileMetas = function(text) {
    // 1. 根据元信息片段边界符 例如 --- 把元信息片段提取出来
    let metaContent = options.wrapper ? getRegexpRes(text, convertToRegExp(options.wrapper, true)) : ""
    // 若没有边界符 或 未提取到数据  则默认以资源文件为查找对象 （只顺序查找一次 因为正则没有使用 g ——全局标识）
    if (!metaContent) { metaContent = text }
    // 2. 获取与键值key相对应的元数据信息
    let res = Object.keys(options.metasRegexps).reduce((obj, key) => {
        let regexp = options.metasRegexps[key]
        if (regexp instanceof Function) {
            // 传入的是自定义方法
            obj[key] = regexp(metaContent, getRegexpRes)
        } else {
            // 传入的是字符串或正则表达式
            obj[key] = getRegexpRes(metaContent, convertToRegExp(regexp, false))
        }
        return obj
    }, {})
    // 3. 追加元数据信息
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
    // !this.resourceQuery 这样用是因为我在配合vue-markdown-loader解析markdown文件时，貌似markdown-loader给资源文件传入了query参数
    // 使得文件的path变成xxx.md?vue&type=template&... 导致该资源loader了多次 具体原因我也没太弄懂 
    if (!this.resourceQuery) {
        options = util.getOptions(this) // 获取用户配置信息

        if (!loaderMap.has(options.dest)) {
            // 使用dest目标文件区分不同的extract-meta-loader 
            // 以此避免不同的loader共享全局变量(pathFileMap)产生的数据
            loaderMap.add(options.dest, new Map())
        }

        // 提取文件元信息数据
        let metaInfo = getFileMetas.call(this, content),
            metaList = []
        let pathFileMap = loaderMap.get(options.dest)
        // 使用this.resourcePath唯一标识该资源 避免重复生成相同的文件信息（Map结构使用set方法会覆盖前一次设置）

        pathFileMap.set(this.resourcePath, metaInfo)
        // 遍历Map结构 生成数组结构的数据
        for (let item of pathFileMap.values()) {
            metaList.push(item)
        }
        // 写入文件
        writeFile(`export default ${JSON.stringify(metaList, null, 2)}`)
    }
    // 当指定了需要删除元数据信息时  删除它们
    if (options.deleteMetaInfo) {
        return content.replace(new RegExp(`${options.wrapper}[\\s|\\S]*?${options.wrapper}`), '')
    }
    return content;
};
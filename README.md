# extract-meta-loader
a webpack loader which is used to extract the meta infomation of file like markdown 

## FileExample
```
---
title: the file title
date: 1024-10-24 00:0:00
tags: [html, javascript]
---
## TITLE
write something here

```
## OPTIONS
```
options: {
    dest: 'src/config/xxxMeta.js', // Generated file path 生成的文件路径
    wrapper: '---', // Boundary symbol of meta content 元信息片段边界符
    deleteMetaInfo: true, // should delete the meta from the source content which used wrapper option('---')
    metasRegexps: {  // key words of meta: RegExp pattern (String | RegExp | Function)
        title: 'title:',  // title is the key and 'title:' is the pattern
        date:/\d{4}-\d{2}-\d{2}/  // you can also use the RegExp

        /*
        * @params data { String } the meta content 
        * @params getRegexpRes { Function } return the matching string
        * @return the result you need
        */
        tags: function(data, getRegexpRes) { 
            let tagText = getRegexpRes(data, /(?<=tags:\s*).*/g)
            return getRegexpRes(tagText, /(?<=\[\s?).*(?=\])/).split(/,\s+/)
        }
    },
    /*
    * you can append metaInfo with the loader context and source 
    * the result will merge to meta object 
    */
    append: function(loaderCtx, source, getRegexpRes) {
        let path = '/article' + getRegexpRes(loaderCtx.resourcePath, /(?<=\\markdown)\\.*?(?=.md)/).replace(/\\/g, '/')
        return { path }
    }
}
```

## RESULT
```
export default [
  {
    "title": "the file title",
    "tags": [
      "html",
      "javascript"
    ],
    "date": "1024-10-24",
    "path": "/article/font"
  }
]
```

# MoonBit 公众号排版

[打开排版工具](https://moonbit-community.github.io/wechat-moonbit/)

1. 粘贴 Markdown，或导入 UTF-8 编码的 `.md`、`.txt`、`.mbt` 或 `.mbtx` 文件。导入 MoonBit 源码时会自动生成代码块。
2. 选择「整篇」或「代码块」，切换代码主题，按需要用手机宽度检查排版。Markdown 里的 `moonbit`、`mbt` 和 `mbtx` 都会启用 MoonBit 高亮。
3. 点击「复制整篇富文本」或「复制所有代码块」，也可以单独复制某个代码块。将内容粘贴到微信公众平台的正文编辑器，再用微信预览检查最终样式和外链图片。

文稿在浏览器内渲染，当前文稿和代码主题保存在浏览器的本地存储。预览中的外链图片由浏览器从原地址加载。

## 本地开发

使用 Node.js 24 和 npm。

```sh
npm ci
npm run dev
npm run build
```

GitHub Actions 在更新 `main` 分支时构建并发布 `dist/` 到 GitHub Pages。站点通过 HTTPS 使用浏览器剪贴板，将带内联样式的 HTML 和纯文本一同写入。

## 许可证

Apache-2.0。MoonBit TextMate 语法来自 [moonbitlang/moonbit-tmLanguage](https://github.com/moonbitlang/moonbit-tmLanguage/blob/b7c3da502ee20a2a44861f9392704e263f94d952/grammars/moonbit.tmLanguage.json)，采用相同许可证。

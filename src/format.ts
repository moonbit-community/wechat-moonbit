import MarkdownIt from 'markdown-it'

export const themes = {
  ink: {
    syntax: 'material-theme-palenight', background: '#25233b', foreground: '#edeafb',
    bar: '#2f2a47', label: '#e8ddff', border: '#3d3655', dot: '#c5a7fb',
  },
  paper: {
    syntax: 'github-light', background: '#faf9fd', foreground: '#24202e',
    bar: '#f0ebf9', label: '#4c3477', border: '#e7def5', dot: '#8564c5',
  },
  pine: {
    syntax: 'github-dark', background: '#192f2e', foreground: '#e1f1ed',
    bar: '#213b39', label: '#d7f3eb', border: '#32504e', dot: '#8dcebb',
  },
}

export type Theme = keyof typeof themes
export type Colorize = typeof import('./highlight').colorize

const md = new MarkdownIt({ html: false })
const escape = md.utils.escapeHtml
const articleStyle = 'color:#282338;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;font-size:16px;line-height:1.85;word-wrap:break-word;overflow-wrap:anywhere;text-align:left;'
const monospace = 'SFMono-Regular,Consolas,Menlo,"PingFang SC",monospace'
const headingStyle = 'color:#241b39;font-weight:750;line-height:1.42;'
const elementStyles: Record<string, string> = {
  h1: headingStyle + 'font-size:27px;margin:0.4em 0 0.55em;letter-spacing:-0.02em;',
  h2: headingStyle + 'font-size:21px;margin:1.35em 0 0.6em;border-left:3px solid #7952db;padding-left:0.55em;',
  h3: headingStyle + 'font-size:18px;margin:1.25em 0 0.55em;',
  h4: headingStyle + 'font-size:16px;margin:1.2em 0 0.5em;',
  h5: headingStyle + 'font-size:15px;margin:1.2em 0 0.5em;',
  h6: headingStyle + 'font-size:14px;margin:1.2em 0 0.5em;',
  p: 'margin:0.55em 0 0.95em;',
  a: 'color:#5534b3;text-decoration:underline;',
  ul: 'margin:0.7em 0 0.95em;padding-left:1.65em;list-style-type:disc;',
  ol: 'margin:0.7em 0 0.95em;padding-left:1.65em;list-style-type:decimal;',
  li: 'margin:0.25em 0;',
  blockquote: 'margin:1em 0;padding:0.45em 0.85em;border-left:3px solid #a689e7;background-color:#f7f2ff;color:#58466f;',
  hr: 'border:0;border-top:1px solid #e8e0f1;margin:1.6em 0;',
  img: 'max-width:100%;height:auto;border-radius:5px;',
  table: 'border-collapse:collapse;table-layout:fixed;margin:0.9em 0;width:100%;font-size:14px;',
  th: 'padding:0.45em 0.5em;border:1px solid #e5ddef;background-color:#f5f0fd;',
  td: 'padding:0.45em 0.5em;border:1px solid #e5ddef;',
  code: `padding:0.15em 0.35em;border-radius:4px;background-color:#f2ecfc;color:#543397;font-family:${monospace};font-size:0.88em;`,
}

md.core.ruler.push('inline_export_styles', ({ tokens }) => {
  for (const token of tokens) {
    const children = token.children ?? [token]
    for (const child of children) {
      const css = elementStyles[child.tag]
      if (!css || child.nesting < 0) continue
      child.attrSet('style', css + (child.attrGet('style') ?? ''))
      if (child.tag === 'a') {
        child.attrSet('target', '_blank')
        child.attrSet('rel', 'noopener noreferrer')
      }
      if (child.tag === 'img') child.attrSet('referrerpolicy', 'no-referrer')
    }
  }
})

const languageNames: Record<string, string> = {
  moonbit: 'MoonBit', mbt: 'MoonBit', mbtx: 'MoonBit',
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python', python: 'Python', sh: 'Shell', bash: 'Shell', shell: 'Shell',
  shellscript: 'Shell', json: 'JSON', yaml: 'YAML', yml: 'YAML', html: 'HTML',
  css: 'CSS', go: 'Go', rs: 'Rust', rust: 'Rust', diff: 'Diff',
  txt: '纯文本', text: '纯文本', plaintext: '纯文本',
}

export interface CodeBlock {
  code: string
  html: string
  label: string
}

type FormatOptions = {
  theme: Theme
  colorize?: Colorize
  blocks: CodeBlock[]
}

function codeCard(code: string, info: string, options: FormatOptions) {
  const language = info.trim().split(/\s+/)[0].toLowerCase() || 'plaintext'
  const label = (Object.hasOwn(languageNames, language) ? languageNames[language] : language).slice(0, 40)
  const theme = themes[options.theme]
  const body = code.endsWith('\n') ? code.slice(0, -1) : code
  const colored = options.colorize?.(body, language, theme.syntax, escape) ?? escape(body)
  const html = `<section style="display:block;margin:16px 0 20px;border:1px solid ${theme.border};border-radius:10px;background-color:${theme.background};text-align:left;">
<section style="display:block;margin:0;padding:6px 14px;border-bottom:1px solid ${theme.border};border-radius:9px 9px 0 0;background-color:${theme.bar};color:${theme.label};font-size:12px;line-height:1.65;font-weight:700;"><span style="color:${theme.dot};margin-right:8px;">●</span>${escape(label)}</section>
<pre style="display:block;max-width:100%;margin:0;padding:11px 14px 13px;font-family:${monospace.replaceAll('"', '&quot;')};font-size:13px;line-height:1.65;tab-size:2;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;color:${theme.foreground};background-color:${theme.background};border-radius:0 0 9px 9px;"><code style="font-family:inherit;font-size:inherit;white-space:inherit;color:inherit;">${colored}</code></pre>
</section>`
  const index = options.blocks.push({ code, html, label }) - 1
  return `<section data-code-index="${index}">${html}</section>\n`
}

md.renderer.rules.fence = (tokens, i, _options, env) =>
  codeCard(tokens[i].content, tokens[i].info, env as FormatOptions)
md.renderer.rules.code_block = (tokens, i, _options, env) =>
  codeCard(tokens[i].content, '', env as FormatOptions)
md.renderer.rules.code_inline = (tokens, i) =>
  `<code style="${elementStyles.code.replaceAll('"', '&quot;')}">${escape(tokens[i].content)}</code>`

export function formatMarkdown(source: string, theme: Theme, colorize?: Colorize) {
  const options: FormatOptions = { theme, colorize, blocks: [] }
  const article = md.render(source, options)
  const code = options.blocks.map(({ html }, index) => `<section data-code-index="${index}">${html}</section>`).join('\n')
  return { article: wrapArticle(article), code: wrapArticle(code), blocks: options.blocks }
}

function wrapArticle(html: string) {
  return `<section style="${articleStyle.replaceAll('"', '&quot;')}">${html}</section>`
}

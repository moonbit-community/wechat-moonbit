import './style.css'
import { copyRichText, type ClipboardContent } from './clipboard'
import { formatMarkdown, themes, type CodeBlock, type Colorize, type Theme } from './format'

const example = [
  '# 用 MoonBit 写下第一行代码',
  '',
  '从一个问候函数开始。把这段示例换成自己的 Markdown，右侧就会同步更新。',
  '',
  '```moonbit',
  '///|',
  'fn greet(name : String) -> String {',
  '  "你好，\\{name}！"',
  '}',
  '',
  '///|',
  'fn main {',
  '  println(greet("MoonBit"))',
  '}',
  '```',
  '',
  '## 粘贴到公众号',
  '',
  '点击「复制整篇富文本」可带走正文和代码样式。只想用某段代码时，点该段上方的「复制代码」。',
  '',
  '> 可以切换代码主题，也可以用手机宽度检查长行是否好读。',
].join('\n')

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

const source = byId<HTMLTextAreaElement>('source')
const preview = byId('preview')
const previewScroll = byId('preview-scroll')
const copyAll = byId<HTMLButtonElement>('copy-all')
const copyLabel = byId('copy-label')
const fileInput = byId<HTMLInputElement>('file-input')
const themeInput = byId<HTMLSelectElement>('code-theme')
const draftStatus = byId('draft-status')
const blockCount = byId('block-count')
const lineCount = byId('line-count')
const articleMode = byId('show-article')
const codeMode = byId('show-code')
const wideView = byId('view-wide')
const phoneView = byId('view-phone')
const toast = byId('toast')
const clear = byId<HTMLButtonElement>('clear')
const draftKey = 'wechat-moonbit:draft:v1'
const themeKey = 'wechat-moonbit:theme:v1'

let mode: 'article' | 'code' = 'article'
let colorize: Colorize | undefined
let renderTimer: number | undefined
let toastTimer: number | undefined
let currentCopy: ClipboardContent | undefined
let savedDraft: string | null = null
let draftReadable = true
let theme: Theme = 'ink'

try {
  savedDraft = localStorage.getItem(draftKey)
  const savedTheme = localStorage.getItem(themeKey)
  if (savedTheme && Object.hasOwn(themes, savedTheme)) theme = savedTheme as Theme
} catch {
  draftReadable = false
}

let initialExample = savedDraft === null
source.value = savedDraft ?? example
themeInput.value = theme
draftStatus.textContent = !draftReadable ? '浏览器存储不可用' : savedDraft === null ? '示例文稿' : '本机草稿已恢复'

function notify(message: string) {
  window.clearTimeout(toastTimer)
  toast.hidden = false
  toast.textContent = message
  toastTimer = window.setTimeout(() => { toast.hidden = true }, 3500)
}

function storeDraft() {
  initialExample = false
  try {
    localStorage.setItem(draftKey, source.value)
    draftStatus.textContent = '已保存到当前浏览器'
  } catch {
    draftStatus.textContent = '草稿未能保存'
  }
}

function setSource(value: string) {
  source.value = value
  storeDraft()
  paint()
}

function emptyPreview(title: string, detail: string) {
  preview.innerHTML = `<div class="empty-state">
    <span class="panel-icon"><svg class="icon" aria-hidden="true"><use href="#i-code"/></svg></span>
    <strong>${title}</strong><p>${detail}</p>
  </div>`
}

function useCopyButton(block: CodeBlock) {
  const toolbar = document.createElement('div')
  toolbar.className = 'snippet-actions'
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'button quiet'
  button.setAttribute('aria-label', `复制 ${block.label} 代码`)
  button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg>复制代码'
  button.addEventListener('click', () => void copy({ html: block.html, text: block.code }, '代码已复制，样式和缩进已保留'))
  toolbar.append(button)
  return toolbar
}

function paint() {
  window.clearTimeout(renderTimer)
  renderTimer = undefined
  const markdown = source.value
  const formatted = formatMarkdown(markdown, theme, colorize)
  const markup = formatted[mode]
  const blocks = formatted.blocks
  currentCopy = undefined
  copyLabel.textContent = mode === 'article' ? '复制整篇富文本' : '复制所有代码块'
  byId('theme-swatch').style.backgroundColor = themes[theme].background
  lineCount.textContent = `${markdown ? markdown.split('\n').length : 0} 行`
  blockCount.textContent = `${blocks.length} 个代码块`
  clear.disabled = !markdown

  preview.innerHTML = markup
  if (!preview.firstElementChild?.childElementCount) {
    if (mode === 'code' && markdown.trim()) {
      emptyPreview('还没有代码块', '用三个反引号包住代码，或点击「插入代码块」。')
    } else {
      emptyPreview('预览会显示在这里', '粘贴 Markdown 或导入文件开始排版。')
    }
    copyAll.disabled = true
    return
  }

  const text = mode === 'article' ? preview.innerText.trim() : blocks.map(({ code }) => code.replace(/\n$/, '')).join('\n\n')
  currentCopy = {
    html: markup.replaceAll(/ data-code-index="\d+"/g, ''),
    text,
  }
  copyAll.disabled = false

  for (const wrapper of preview.querySelectorAll<HTMLElement>('[data-code-index]')) {
    const index = Number(wrapper.dataset.codeIndex)
    wrapper.prepend(useCopyButton(blocks[index]))
  }
}

async function copy(content: ClipboardContent, message: string) {
  try {
    await copyRichText(content)
    notify(message)
  } catch {
    notify('复制失败，请允许浏览器访问剪贴板后重试。')
  }
}

function changeMode(next: typeof mode) {
  if (mode === next) return
  mode = next
  articleMode.setAttribute('aria-pressed', String(mode === 'article'))
  codeMode.setAttribute('aria-pressed', String(mode === 'code'))
  previewScroll.scrollTop = 0
  paint()
}

function changeWidth(phone: boolean) {
  previewScroll.classList.toggle('phone', phone)
  wideView.setAttribute('aria-pressed', String(!phone))
  phoneView.setAttribute('aria-pressed', String(phone))
}

function replaceDraft(value: string, message: string) {
  if (source.value.trim() && source.value !== value && source.value !== example && !window.confirm(message)) return
  setSource(value)
  previewScroll.scrollTop = 0
  source.scrollTop = 0
}

function codeFence(text: string) {
  let longest = 2
  for (const [ticks] of text.matchAll(/^ {0,3}`+/gm)) longest = Math.max(longest, ticks.trimStart().length)
  return '`'.repeat(longest + 1)
}

source.addEventListener('paste', (event) => {
  const pastedText = event.clipboardData?.getData('text/plain')
  if (!initialExample || !pastedText || source.selectionStart !== source.selectionEnd) return
  event.preventDefault()
  setSource(pastedText)
  source.setSelectionRange(source.value.length, source.value.length)
})
source.addEventListener('input', () => {
  storeDraft()
  window.clearTimeout(renderTimer)
  renderTimer = window.setTimeout(paint, 100)
  if (source.value.trim() && (mode === 'article' || currentCopy)) copyAll.disabled = false
})
articleMode.addEventListener('click', () => changeMode('article'))
codeMode.addEventListener('click', () => changeMode('code'))
wideView.addEventListener('click', () => changeWidth(false))
phoneView.addEventListener('click', () => changeWidth(true))
themeInput.addEventListener('change', () => {
  theme = themeInput.value as Theme
  try { localStorage.setItem(themeKey, theme) } catch { /* Works for the open tab. */ }
  paint()
})

copyAll.addEventListener('click', () => {
  if (renderTimer !== undefined) paint()
  if (currentCopy) void copy(currentCopy, mode === 'article' ? '整篇富文本已复制，可以粘贴到公众号编辑器' : '所有代码块已复制')
})

byId('load-example').addEventListener('click', () => replaceDraft(example, '用示例替换当前文稿？'))
clear.addEventListener('click', () => {
  replaceDraft('', '清空当前文稿？')
  source.focus()
})
byId('insert-code').addEventListener('click', () => {
  const start = source.selectionStart
  const end = source.selectionEnd
  const selection = source.value.slice(start, end)
  const fence = codeFence(selection)
  const before = source.value.slice(0, start)
  const after = source.value.slice(end)
  const prefix = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
  const suffix = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : ''
  const opening = `${prefix}${fence}moonbit\n`
  source.setRangeText(`${opening}${selection}${selection.endsWith('\n') ? '' : '\n'}${fence}${suffix}`, start, end)
  source.focus()
  source.setSelectionRange(start + opening.length, start + opening.length + selection.length)
  storeDraft()
  paint()
})
byId('open-file').addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  fileInput.value = ''
  if (!file) return
  try {
    const text = (await file.text()).replace(/\r\n?/g, '\n')
    const fence = codeFence(text)
    const value = /\.mbtx?$/i.test(file.name) ? `${fence}moonbit\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}\n` : text
    replaceDraft(value, '导入文件会替换当前文稿，继续吗？')
  } catch {
    notify('读取文件失败，请重新选择文稿。')
  }
})

paint()
import('./highlight').then((highlight) => {
  colorize = highlight.colorize
  paint()
}).catch(() => {
  notify('代码高亮加载失败，仍可预览和复制。')
})

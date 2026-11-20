export interface ClipboardContent {
  html: string
  text: string
}

export function copyRichText({ html, text }: ClipboardContent) {
  return navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    }),
  ])
}

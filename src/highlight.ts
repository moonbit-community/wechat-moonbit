import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import type { LanguageRegistration } from 'shiki'
import grammar from './moonbit.tmLanguage.json'

const highlighter = await createHighlighterCore({
  engine: createOnigurumaEngine(import('shiki/wasm')),
  langs: [
    { ...grammar, aliases: ['mbt', 'mbtx'] } as LanguageRegistration,
    import('@shikijs/langs/javascript'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/langs/python'),
    import('@shikijs/langs/shellscript'),
    import('@shikijs/langs/json'),
    import('@shikijs/langs/yaml'),
    import('@shikijs/langs/html'),
    import('@shikijs/langs/css'),
    import('@shikijs/langs/rust'),
    import('@shikijs/langs/go'),
    import('@shikijs/langs/diff'),
  ],
  themes: [
    import('@shikijs/themes/material-theme-palenight'),
    import('@shikijs/themes/github-light'),
    import('@shikijs/themes/github-dark'),
  ],
})

const loadedLanguages = new Set(highlighter.getLoadedLanguages())

export function colorize(source: string, language: string, theme: string, escape: (value: string) => string) {
  if (!loadedLanguages.has(language)) return escape(source)

  const lines = highlighter.codeToTokensBase(source, { lang: language, theme })
  return lines.map((line) => line.map((token) => {
    const text = escape(token.content)
    return token.color ? `<span style="color:${token.color}">${text}</span>` : text
  }).join('')).join('\n')
}

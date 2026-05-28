// One-pass JS/JSX syntax tokenizer for the code editor overlay.
// Comments and strings are matched first so keywords inside them are never re-highlighted.
const TOKEN_RE = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(`(?:[^`\\]|\\.)*`)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(\b(?:import|export|default|class|extends|constructor|super|const|let|var|function|return|new|if|else|from|this|true|false|null|undefined|typeof|async|await|for|of|in|while|do|break|continue|switch|case|throw|try|catch|finally|static|get|set)\b)|(\b[A-Z][a-zA-Z0-9]*\b)|(\b\d[\d.]*\b)/g

export function highlight(raw) {
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return esc.replace(TOKEN_RE, (m, lc, bc, tmpl, sq, dq, kw, cls, num) => {
    if (lc || bc)          return `<span class="hl-c">${m}</span>`
    if (tmpl || sq || dq)  return `<span class="hl-s">${m}</span>`
    if (kw)                return `<span class="hl-k">${m}</span>`
    if (cls)               return `<span class="hl-cls">${m}</span>`
    if (num)               return `<span class="hl-n">${m}</span>`
    return m
  })
}

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'

let pyodide     = null
let loadPromise = null

export async function getPyodide(onStatus) {
  if (pyodide) return pyodide

  if (!loadPromise) {
    loadPromise = (async () => {
      // Inject CDN script once
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src     = PYODIDE_URL + 'pyodide.js'
          s.onload  = resolve
          s.onerror = () => reject(new Error('failed to load Pyodide CDN script'))
          document.head.appendChild(s)
        })
      }
      onStatus?.('booting Python…')
      pyodide = await window.loadPyodide({ indexURL: PYODIDE_URL })
      onStatus?.('ready')
      return pyodide
    })()
  }

  return loadPromise
}

// Runs Python code, captures stdout + stderr, returns { output, error }
export async function runPython(code, onStatus) {
  const py = await getPyodide(onStatus)

  const outLines = []
  const errLines = []

  py.setStdout({ batched: s => outLines.push(s) })
  py.setStderr({ batched: s => errLines.push(s) })

  try {
    await py.runPythonAsync(code)
    const out = [...outLines, ...errLines].join('\n').trimEnd()
    return { output: out, error: null }
  } catch (e) {
    const out = outLines.join('\n').trimEnd()
    return { output: out, error: e.message }
  }
}

export function isPyodideReady() {
  return pyodide !== null
}

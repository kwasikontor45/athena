const fs = require('fs')
const path = require('path')

const CODEX_DIR = path.join(process.env.HOME, 'vault', 'codex')
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data')
const OUTPUT = path.join(OUTPUT_DIR, 'codebase-summary.json')

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return null }
}

function detectStack(repoPath) {
  const pkg = readJson(path.join(repoPath, 'package.json'))
  if (!pkg) return []
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const stack = []
  if (deps.react || deps['react-dom']) stack.push('react')
  if (deps['react-native']) stack.push('react-native')
  if (deps.vue || deps['vue-router']) stack.push('vue')
  if (deps.next) stack.push('next.js')
  if (deps.express) stack.push('express')
  if (deps.flask) stack.push('flask')
  if (deps.django) stack.push('django')
  if (deps.vite) stack.push('vite')
  if (deps.typescript || deps.tsx) stack.push('typescript')
  if (deps.tailwindcss) stack.push('tailwind')
  if (deps['@cloudflare/workers-types'] || deps.wrangler) stack.push('cloudflare')
  if (deps.flask || deps.django) stack.push('python')
  if (deps['socket.io'] || deps['flask-socketio']) stack.push('websockets')
  return stack
}

function detectKeyFiles(repoPath) {
  const candidates = [
    'src/App.jsx', 'src/App.js', 'src/App.tsx', 'src/main.jsx', 'src/main.tsx',
    'app.py', 'main.py', 'server.js', 'index.js', 'index.ts',
    'README.md', 'README.markdown', 'vite.config.js',
    'package.json', '.env.example',
  ]
  return candidates.filter(c => fs.existsSync(path.join(repoPath, c)))
}

function detectPatterns(repoPath) {
  const src = path.join(repoPath, 'src')
  if (!fs.existsSync(src)) return {}
  const files = fs.readdirSync(src)
  const kebab = files.filter(f => f.includes('-') && !f.includes(' ')).length
  const camel = files.filter(f => /^[a-z][a-zA-Z0-9]*\.[a-z]+$/.test(f)).length
  const pascal = files.filter(f => /^[A-Z][a-zA-Z0-9]*\.[a-z]+$/.test(f)).length
  const dominant = kebab >= camel && kebab >= pascal ? 'kebab-case' :
                   camel >= pascal ? 'camelCase' : 'PascalCase'
  return {
    fileNaming: dominant,
    hasTests: fs.existsSync(path.join(repoPath, 'src', '__tests__')) ||
              fs.existsSync(path.join(repoPath, 'tests')) ||
              files.some(f => f.includes('.test.')),
  }
}

function ingestRepo(repoPath) {
  const name = path.basename(repoPath)
  const pkg = readJson(path.join(repoPath, 'package.json'))
  const readme = path.join(repoPath, 'README.md')
  let description = ''
  if (fs.existsSync(readme)) {
    description = fs.readFileSync(readme, 'utf-8').split('\n')[0].replace(/^#\s*/, '').slice(0, 120)
  }
  if (!description && pkg?.description) {
    description = pkg.description
  }

  return {
    description,
    stack: detectStack(repoPath),
    keyFiles: detectKeyFiles(repoPath),
    patterns: detectPatterns(repoPath),
  }
}

function main() {
  if (!fs.existsSync(CODEX_DIR)) {
    console.error(`codex dir not found: ${CODEX_DIR}`)
    process.exit(1)
  }

  const entries = fs.readdirSync(CODEX_DIR)
    .map(n => path.join(CODEX_DIR, n))
    .filter(p => fs.statSync(p).isDirectory())
    .filter(p => !path.basename(p).startsWith('.'))

  const summary = {
    generatedAt: new Date().toISOString(),
    repoCount: entries.length,
    repos: {},
  }

  for (const repoPath of entries) {
    const name = path.basename(repoPath)
    summary.repos[name] = ingestRepo(repoPath)
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(summary, null, 2))

  const sizeKb = (fs.statSync(OUTPUT).size / 1024).toFixed(2)
  console.log(`ingested ${summary.repoCount} repos → ${OUTPUT} (${sizeKb} kb)`)
}

main()

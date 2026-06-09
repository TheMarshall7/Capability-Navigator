const fs = require('fs')
const path = require('path')

const binDir = path.join(__dirname, '..', 'node_modules', '.bin')
const nextBin = path.join(binDir, 'next')
const shimPath = path.join(__dirname, 'next-shim.cjs')

if (!fs.existsSync(binDir) || !fs.existsSync(shimPath)) return

const launcher = `#!/usr/bin/env node\nrequire(${JSON.stringify(shimPath)})\n`
fs.writeFileSync(nextBin, launcher, { mode: 0o755 })

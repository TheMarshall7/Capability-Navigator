#!/usr/bin/env node
const { spawnSync } = require('child_process')
const path = require('path')

const realNext = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')
const args = process.argv.slice(2)

function runNext() {
  const result = spawnSync(process.execPath, [realNext, ...args], {
    stdio: 'inherit',
    env: process.env,
  })
  process.exit(result.status ?? 1)
}

// Cloudflare Pages often runs `npx next build`, which never creates
// `.vercel/output/static`. Redirect to the adapter on Pages CI only.
if (
  process.env.CF_PAGES === '1' &&
  args[0] === 'build' &&
  !process.env.__CF_PAGES_INNER
) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['@cloudflare/next-on-pages'],
    {
      stdio: 'inherit',
      env: { ...process.env, __CF_PAGES_INNER: '1' },
    }
  )
  process.exit(result.status ?? 1)
}

runNext()

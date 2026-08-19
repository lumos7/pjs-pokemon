// Writes public/sw.js from sw.template.js with a build-derived cache VERSION.
// Run via the build script (chained, not "prebuild" — pnpm doesn't auto-run
// pre/post scripts, and Vercel builds with pnpm).
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 12)
const version = sha ? `pj-${sha}` : `pj-dev-${Date.now()}`

const template = fs.readFileSync(path.join(root, 'sw.template.js'), 'utf8')
if (!template.includes('__PJ_SW_VERSION__')) {
  console.error('[gen-sw] placeholder __PJ_SW_VERSION__ missing from sw.template.js')
  process.exit(1)
}
const output = template.split('__PJ_SW_VERSION__').join(version)
if (output.includes('__PJ_SW_VERSION__')) {
  console.error('[gen-sw] substitution failed — placeholder still present in output')
  process.exit(1)
}
fs.writeFileSync(path.join(root, 'public', 'sw.js'), output)
console.log(`[gen-sw] public/sw.js written with VERSION=${version}`)

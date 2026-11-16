import fs from 'fs'
import path from 'path'

const root = path.resolve('src')

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p)
  }
  return out
}

for (const file of walk(root)) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s

  s = s.replace(/^['"]use client['"]\s*;?\s*\n/gm, '')

  s = s.replace(/from ['"]next\/link['"]/g, "from '@/lib/Link'")
  s = s.replace(/import Link from ['"]next\/link['"]/g, "import Link from '@/lib/Link'")

  s = s.replace(
    /from ['"]next\/navigation['"]/g,
    "from '@/lib/navigation'"
  )

  s = s.replace(/from ['"]next-auth\/react['"]/g, "from '@/lib/next-auth-react'")

  // types: remove next-auth module augmentation later in types file

  if (s !== orig) {
    fs.writeFileSync(file, s)
    console.log('patched', path.relative(root, file))
  }
}

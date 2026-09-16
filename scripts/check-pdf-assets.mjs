import fs from 'node:fs'
import path from 'node:path'

const dist = process.argv[2] ?? '.next'
const routes = [
  '(dashboard)/submissions/[id]/page',
  '(dashboard)/submissions/[id]/pdf/route',
  '(dashboard)/admin/submissions/[id]/page',
  '(dashboard)/admin/submissions/[id]/pdf/route',
  'f/[type]/[slug]/page',
]
const fonts = ['Poppins-Regular.ttf', 'Poppins-SemiBold.ttf', 'Poppins-Bold.ttf']
// PDFKit loads its standard fonts with dynamic package imports, which Next's
// file tracer cannot discover. The renderer initializes Helvetica even when
// the document later uses an embedded typeface.
const standardFontDir = 'node_modules/pdfkit/js/standard-fonts'
const standardFontFiles = fs.readdirSync(standardFontDir, { recursive: true })
  .map((entry) => path.join(standardFontDir, entry))
  .filter((entry) => fs.statSync(entry).isFile())
if (!standardFontFiles.length) throw new Error('PDFKit standard font files were not found')
const requiredAssets = [
  ...fonts.map((font) => path.join('src/lib/pdf/fonts', font)),
  ...standardFontFiles,
]
const banner = fs.readdirSync('public/brand').find((name) => /^(wealthy-advisers-club|onboarding-banner)\.(png|jpe?g|webp)$/i.test(name))
if (banner) requiredAssets.push(path.join('public/brand', banner))

for (const route of routes) {
  const file = path.join(dist, 'server/app', `${route}.js.nft.json`)
  const entries = new Set(JSON.parse(fs.readFileSync(file, 'utf8')).files
    .map((entry) => path.resolve(path.dirname(file), entry)))
  for (const asset of requiredAssets) {
    if (!entries.has(path.resolve(asset)))
      throw new Error(`${route} is missing ${asset} from its deployment bundle`)
  }
}
console.log(`${requiredAssets.length} PDF deployment assets verified for all ${routes.length} routes.`)

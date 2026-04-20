import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
// CommonJS module
const png2icons = require('png2icons')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const assetsDir = path.join(projectRoot, 'assets')

const svgTransparent = path.join(assetsDir, 'icon.svg')
const svgBackground = path.join(assetsDir, 'icon-bg.svg')

const outIcns = path.join(assetsDir, 'icon.icns')
const outIco = path.join(assetsDir, 'icon.ico')
const outPng = path.join(assetsDir, 'icon.png')

async function ensureAssetsDir() {
  await fs.mkdir(assetsDir, { recursive: true })
}

async function rasterizeSvgToPng(svgPath, sizePx) {
  const svg = await fs.readFile(svgPath)
  // Higher density reduces aliasing when rasterizing SVG
  const density = 1024
  return sharp(svg, { density })
    .resize(sizePx, sizePx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

async function writeFileAtomic(filePath, buf) {
  const tmp = `${filePath}.tmp`
  await fs.writeFile(tmp, buf)
  await fs.rename(tmp, filePath)
}

async function main() {
  await ensureAssetsDir()

  // Generate from transparent SVG (macOS)
  const png1024Transparent = await rasterizeSvgToPng(svgTransparent, 1024)
  const icnsBuf = png2icons.createICNS(png1024Transparent, png2icons.BICUBIC, 0)
  if (!icnsBuf) throw new Error('png2icons.createICNS returned null')
  await writeFileAtomic(outIcns, icnsBuf)

  // Generate from background SVG (Windows/Linux)
  const png1024Bg = await rasterizeSvgToPng(svgBackground, 1024)

  // Windows executable-friendly ICO (mix of BMP for small sizes + PNG for large sizes)
  const icoBuf = png2icons.createICO(png1024Bg, png2icons.BICUBIC, 0, false, true)
  if (!icoBuf) throw new Error('png2icons.createICO returned null')
  await writeFileAtomic(outIco, icoBuf)

  // Linux PNG (512x512)
  const png512 = await sharp(png1024Bg).resize(512, 512).png().toBuffer()
  await writeFileAtomic(outPng, png512)

  // Helpful output for CI / local use
  // eslint-disable-next-line no-console
  console.log('Icon outputs written:')
  // eslint-disable-next-line no-console
  console.log(`- ${path.relative(projectRoot, outIcns)}`)
  // eslint-disable-next-line no-console
  console.log(`- ${path.relative(projectRoot, outIco)}`)
  // eslint-disable-next-line no-console
  console.log(`- ${path.relative(projectRoot, outPng)}`)
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


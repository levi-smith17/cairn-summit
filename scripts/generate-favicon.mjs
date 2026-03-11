import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// SVG with dark green background so white stones are visible
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 145" width="200" height="145">
  <rect width="200" height="145" fill="#2e4110" rx="18"/>

  <!-- STONE 4 - bottom, wide, tilt right -->
  <g transform="rotate(1.8, 100, 114)">
    <path d="
      M 61.7,126
      C 57.1,124 53.6,118 55.3,112
      C 57.1,106 64.0,102 74.5,100
      C 84.9,98 97.7,97 109.3,98
      C 119.7,99 131.3,102 137.1,107
      C 141.8,111 142.9,117 141.2,122
      C 138.9,127 131.9,131 120.9,133
      C 108.1,135 94.2,134 81.4,132
      C 69.8,130 65.2,128 61.7,126 Z
    " fill="white" stroke="#8aaa52" stroke-width="1.6"/>
  </g>

  <!-- STONE 3 - medium, tilt left -->
  <g transform="rotate(-2.5, 97, 80)">
    <path d="
      M 61.6,92
      C 57.0,90 53.5,84 55.2,78
      C 57.0,72 63.9,68 74.4,66
      C 84.8,64 96.4,63 106.9,64
      C 116.1,65 126.6,68 132.4,74
      C 136.4,78 137.6,84 135.3,90
      C 132.4,95 125.4,98 113.8,99
      C 101.1,101 87.1,100 74.4,98
      C 66.3,96 63.9,94 61.6,92 Z
    " fill="white" stroke="#8aaa52" stroke-width="1.6"/>
  </g>

  <!-- STONE 2 - narrower, tilt right -->
  <g transform="rotate(2.0, 100, 50)">
    <path d="
      M 71.0,62
      C 66.4,60 62.9,54 65.2,48
      C 66.9,42 74.5,38 83.8,37
      C 91.9,35 101.2,35 110.4,37
      C 118.6,38 126.7,43 129.6,49
      C 132.5,54 130.7,60 126.1,64
      C 120.3,68 109.3,70 97.7,69
      C 86.1,68 75.6,66 71.0,62 Z
    " fill="white" stroke="#8aaa52" stroke-width="1.6"/>
  </g>

  <!-- STONE 1 - top, narrowest, tilt left -->
  <g transform="rotate(-1.5, 95, 22)">
    <path d="
      M 72.4,33
      C 67.7,31 65.4,25 67.2,19
      C 68.9,13 75.9,10 84.0,9
      C 90.9,8 99.1,8 106.0,10
      C 113.0,12 117.6,17 117.6,23
      C 117.6,29 113.0,33 103.7,35
      C 94.4,37 82.8,36 75.9,34
      C 73.5,34 72.4,33 72.4,33 Z
    " fill="white" stroke="#8aaa52" stroke-width="1.6"/>
  </g>
</svg>`

const svgBuffer = Buffer.from(svg)

async function createIco() {
  // Generate PNGs at standard favicon sizes
  const sizes = [16, 32, 48]
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 46, g: 65, b: 16, alpha: 1 } })
        .png()
        .toBuffer()
    )
  )

  // Build ICO file manually
  const numImages = pngBuffers.length
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = numImages * dirEntrySize
  const totalHeaderSize = headerSize + dirSize

  // Calculate offsets
  const offsets = []
  let offset = totalHeaderSize
  for (const buf of pngBuffers) {
    offsets.push(offset)
    offset += buf.length
  }

  const totalSize = offset
  const ico = Buffer.alloc(totalSize)

  // ICO header
  ico.writeUInt16LE(0, 0)       // reserved
  ico.writeUInt16LE(1, 2)       // type: 1 = ICO
  ico.writeUInt16LE(numImages, 4) // image count

  // Directory entries
  for (let i = 0; i < numImages; i++) {
    const base = headerSize + i * dirEntrySize
    const size = sizes[i]
    ico.writeUInt8(size === 256 ? 0 : size, base)     // width
    ico.writeUInt8(size === 256 ? 0 : size, base + 1) // height
    ico.writeUInt8(0, base + 2)   // color count (0 = no palette)
    ico.writeUInt8(0, base + 3)   // reserved
    ico.writeUInt16LE(1, base + 4) // color planes
    ico.writeUInt16LE(32, base + 6) // bits per pixel
    ico.writeUInt32LE(pngBuffers[i].length, base + 8) // image data size
    ico.writeUInt32LE(offsets[i], base + 12) // image data offset
  }

  // Image data
  for (let i = 0; i < numImages; i++) {
    pngBuffers[i].copy(ico, offsets[i])
  }

  const outPath = join(__dirname, '../public/favicon.ico')
  writeFileSync(outPath, ico)
  console.log(`favicon.ico written to ${outPath}`)
  console.log(`Sizes: ${sizes.map(s => `${s}x${s}`).join(', ')}`)
}

createIco().catch(console.error)

const fs = require('fs')
const path = require('path')
const pngToIco = require('png-to-ico')

const src = path.join(__dirname, '..', 'fondo icono .png')
const outDir = path.join(__dirname, '..', 'build')
const outIco = path.join(outDir, 'icon.ico')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

pngToIco(src)
  .then(buf => fs.writeFileSync(outIco, buf))
  .then(() => console.log('icon.ico generado en', outIco))
  .catch(err => {
    console.error('Error generando icon.ico:', err)
    process.exit(1)
  })

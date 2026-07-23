const { app, BrowserWindow, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')

const isProd = process.env.NODE_ENV === 'production'

const store = new Store({ name: 'window-state' })

function createMainWindow () {
  const bounds = store.get('bounds') || { width: 1024, height: 768 }
  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'fondo icono .png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('close', () => {
    const { width, height } = win.getBounds()
    store.set('bounds', { width, height })
  })

  if (!isProd) {
    win.webContents.openDevTools()
  }

  const indexPath = path.join(__dirname, 'index.html')
  win.loadFile(indexPath)
}

function createSplash () {
  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true
  })
  splash.loadFile(path.join(__dirname, 'build', 'splash.html'))
  return splash
}

app.whenReady().then(() => {
  const splash = createSplash()
  setTimeout(() => {
    createMainWindow()
    if (splash && !splash.isDestroyed()) splash.close()
  }, 900)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

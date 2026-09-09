// ════════════════════════════════════════════════════════════════════
//  Túnel de Viento — proceso principal de Electron
//  Envuelve la aplicación HTML autocontenida (Tunel_de_viento_completo.html)
//  en una ventana de escritorio. Electron incluye su propio Chromium: NO
//  depende de WebView2 ni de ningún runtime; corre en cualquier Windows 10+ x64.
// ════════════════════════════════════════════════════════════════════
'use strict';
const { app, BrowserWindow, Menu, shell, dialog, session } = require('electron');
const path = require('path');

const APP_HTML = path.join(__dirname, '..', 'Tunel_de_viento_completo.html');
const APP_VERSION = app.getVersion();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}

function createMainWindow() {
  const win = new BrowserWindow({
    // El panel lateral mide 344 px y ahora incluye globos de ayuda que se
    // despliegan en el flujo; por debajo de 1180 px el lienzo queda estrecho.
    width: 1600, height: 980, minWidth: 1180, minHeight: 760,
    backgroundColor: '#f1eee6',
    title: 'Túnel de Viento ' + APP_VERSION,
    show: false,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      spellcheck: false,
      backgroundThrottling: false   // no frenar la simulación CFD al perder foco
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(APP_HTML);

  // Enlaces externos → navegador del sistema; nada saca al usuario de la app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); if (/^https?:\/\//i.test(url)) shell.openExternal(url); }
  });
  return win;
}

// La exportación de PNG usa un blob y un <a download>. En Electron eso entra
// por el gestor de descargas, no por will-navigate. Se fija el diálogo de
// guardado en Imágenes con el nombre que compone la app, y al terminar se
// avisa con la ruta: en una app de escritorio, un archivo que "se descarga"
// sin decir dónde es un archivo perdido.
function setupDownloads() {
  session.defaultSession.on('will-download', (event, item) => {
    const nombre = item.getFilename() || 'tunel-viento.png';
    item.setSaveDialogOptions({
      title: 'Guardar imagen del túnel de viento',
      defaultPath: path.join(app.getPath('pictures'), nombre),
      filters: [{ name: 'Imagen PNG', extensions: ['png'] }]
    });
    item.once('done', (_e, state) => {
      if (state === 'completed') {
        const ruta = item.getSavePath();
        dialog.showMessageBox({
          type: 'info', title: 'Imagen guardada',
          message: 'PNG exportado', detail: ruta,
          buttons: ['Abrir carpeta', 'Cerrar'], defaultId: 1, cancelId: 1
        }).then(r => { if (r.response === 0) shell.showItemInFolder(ruta); });
      } else if (state === 'interrupted') {
        dialog.showMessageBox({
          type: 'error', title: 'Exportación fallida',
          message: 'No se pudo guardar la imagen.',
          detail: 'A resoluciones altas la exportación necesita bastante memoria. Pruebe con 1920 × 1120.',
          buttons: ['Cerrar']
        });
      }
    });
  });
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Archivo', submenu: [{ role: 'quit', label: 'Salir' }] },
    { label: 'Ver', submenu: [
      { role: 'reload', label: 'Recargar' },
      { role: 'forceReload', label: 'Forzar recarga' },
      { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
      { type: 'separator' },
      { role: 'resetZoom', label: 'Zoom 100%' },
      { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }
    ]},
    { label: 'Ayuda', submenu: [{
      label: 'Acerca de Túnel de Viento',
      click: () => dialog.showMessageBox({
        type: 'info', title: 'Acerca de', message: 'Túnel de Viento ' + APP_VERSION,
        detail: 'Simulación CFD 2D para análisis bioclimático (ventilación / viento).\n' +
                'Universidad de San Buenaventura - Pasto.\n\n' +
                'Navier-Stokes incompresible sobre malla escalonada MAC.\n' +
                'Advección MUSCL de 2.º orden con limitador van Leer.\n' +
                'Cierre Smagorinsky conmutable. Presión por multigrid geométrico.\n\n' +
                'Resultado cualitativo: no apto para dimensionamiento.\n' +
                'Consulte "Acerca de" dentro de la aplicación para el alcance y las restricciones.\n\n' +
                'Electron ' + process.versions.electron + '.',
        buttons: ['Cerrar']
      })
    }]}
  ]));
}

app.whenReady().then(() => {
  buildMenu(); setupDownloads(); createMainWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

# Túnel de Viento — Aplicación de escritorio para Windows

Empaqueta el simulador CFD 2D **Túnel de Viento** (un único HTML autocontenido)
como aplicación nativa de Windows usando **Electron**. El `.exe` resultante
**no depende de WebView2 ni de ningún runtime**: corre en cualquier
**Windows 10+ x64**, tal cual. App 100 % offline (zero-CDN), con la fuente
JetBrains Mono embebida.

## Estructura
```
tunel-viento-desktop/
├─ Tunel_de_viento_completo.html   ← la aplicación (zero-CDN, en la raíz)
├─ src/main.js                     ← proceso principal de Electron
├─ .github/workflows/build-windows.yml
├─ package.json
└─ .gitignore
```

## Compilar en GitHub
1. Sube esta carpeta a un repositorio.
2. **Actions → Build Windows → Run workflow** (o empuja una etiqueta `v1.0.0`).
3. Descarga desde la pestaña **Releases** del repositorio:
   - `TunelDeViento-1.0.0-portable.exe` → se abre sin instalar.
   - `TunelDeViento-1.0.0-setup.exe` → instalador opcional.

## Local (opcional, requiere Node.js)
```bash
npm install
npm start
npm run dist
```

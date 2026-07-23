# Instrucciones esenciales — Release

Enlace proporcionado por el autor:

https://drive.google.com/file/d/1ZvFTJRGNG9LQBu6uuJUXDHgu5kp6lKdf/view?usp=sharing

Resumen rápido

- Descargar el instalador desde el enlace anterior.
- Colocar el instalador en la carpeta `release/` del proyecto: `d:\descargas\Nueva carpeta (72)\fracciones-main\release`.
- Ejecutar `Fracciones Setup 1.0.0.exe` para instalar o ejecutar `Fracciones-Portable.exe` para la versión portable.

Instalación en Windows (pasos esenciales)

1. Descarga el archivo desde el enlace de Google Drive.
2. Mueve el archivo descargado a la carpeta `release/` del proyecto.
3. Para instalar la aplicación (instalador NSIS): haz doble clic en `Fracciones Setup 1.0.0.exe` y sigue el asistente.
4. Para usar la versión portable: ejecuta `Fracciones-Portable.exe` desde la carpeta `release/`.

Comandos útiles (PowerShell)

```powershell
# Mover el instalador desde Descargas a la carpeta release
Move-Item -Path "$env:USERPROFILE\Downloads\nombre_del_archivo.exe" -Destination "release\"

# Abrir el instalador (NSIS)
Start-Process -FilePath "release\Fracciones Setup 1.0.0.exe"

# Ejecutar la versión portable
Start-Process -FilePath "release\Fracciones-Portable.exe"
```

Verificar integridad (opcional)

```powershell
# Obtener hash SHA256 del instalador
Get-FileHash -Path "release\Fracciones Setup 1.0.0.exe" -Algorithm SHA256
```

Subir lo esencial a GitHub (mínimo)

```bash
git add .
git commit -m "Add Electron packaging and release artifacts"
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

Crear una Release en GitHub (opcional, usando `gh`)

```bash
gh release create v1.0.0 release/"Fracciones Setup 1.0.0.exe" --title "Fracciones v1.0.0" --notes "Instalador y portable"
```

Notas importantes

- No puedo descargar el archivo directamente desde Google Drive en este entorno; debes descargarlo manualmente y copiarlo a la carpeta `release/`.
- Si quieres que yo publique la Release en GitHub desde esta máquina, configura la CLI `gh` con acceso (token) y dímelo; ejecutaré el comando por ti.
- Si necesitas que optimice assets, firme el instalador o genere un MSI, indícamelo y lo preparo (firmado requiere certificado privado).


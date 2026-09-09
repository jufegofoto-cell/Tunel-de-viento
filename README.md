# Túnel de Viento

Simulador **CFD 2D** para análisis bioclimático, empaquetado como aplicación
nativa de Windows con **Electron**. Resuelve las ecuaciones de Navier-Stokes
incompresibles alrededor de una geometría que se dibuja en pantalla o se importa
desde un PNG, y muestra en vivo los campos de velocidad, presión y vorticidad.

El `.exe` **no depende de WebView2 ni de ningún runtime**: corre en cualquier
**Windows 10+ x64** tal cual. Aplicación 100 % offline, sin CDN ni telemetría,
con la fuente JetBrains Mono incrustada.

> **Alcance.** Los resultados son **cualitativos**: sirven para intuición,
> docencia y comparación temprana entre alternativas de diseño. **No son aptos
> para dimensionamiento.** Las restricciones concretas están documentadas dentro
> de la aplicación, en *Geometría → Acerca de*.

---

## Qué hace

- **Dibuja o importa la geometría.** Pincel sobre el lienzo, o un PNG donde los
  píxeles oscuros se leen como muro, con mover / escalar / rotar antes de aplicar.
- **Tres tipos de dominio.** Conducto o túnel (tapa y piso como pared), planta en
  terreno abierto (ambos bordes dejan salir masa) y sección con suelo (piso pared,
  tapa abierta). Es la elección que más cambia el resultado.
- **Régimen ajustable.** Por Reynolds objetivo, recorriendo la secuencia clásica
  (flujo reptante → vórtices adheridos → calle de von Kármán → estela desordenada),
  o por fluido real (aire, agua, aceite, glicerina, miel).
- **Campos y visualización.** Velocidad, presión y vorticidad, con líneas de
  corriente, vectores, seis paletas y escala normalizada por percentil 99.
- **Barandillas de montaje.** El panel calcula el bloqueo, la distancia a la salida
  en múltiplos del frente y el tiempo estimado hasta el estado estacionario, y avisa
  cuando el montaje deja de ser representativo.
- **Exportación PNG** hasta 5760 × 3360, con barra de escala y pie de parámetros.
- **Ayuda en contexto.** Cada control con un botón `?` que explica qué hace cada
  opción y cuándo usarla.

## Requisitos

Windows 10 o superior, 64 bits. Nada más. Para compilar desde el código,
Node.js 22 o superior.

## Descargar

Desde la pestaña **[Releases](../../releases)** del repositorio:

| Archivo | Qué es |
|---|---|
| `TunelDeViento-2.0.0-portable.exe` | Un solo ejecutable. No instala nada. |
| `TunelDeViento-2.0.0-setup.exe` | Instalador con acceso directo y desinstalador. |

Windows SmartScreen puede avisar la primera vez, porque el ejecutable no está
firmado digitalmente: *Más información → Ejecutar de todas formas*.

## Cómo usarlo bien

Tres recomendaciones que ahorran tiempo y errores:

1. **Elija el tipo de dominio antes que nada.** Si el plano dibujado es horizontal
   (una planta), use *Planta en terreno abierto*. Con paredes, una geometría grande
   convierte el dominio en una tobera y la aceleración que se ve la produce la pared,
   no el edificio.
2. **Vigile el indicador de bloqueo.** Por encima del 5 % en modo conducto, el
   resultado deja de ser representativo. El panel lo avisa en rojo.
3. **Converja en malla ligera y suba al final.** Llegar al estado estacionario
   (τ ≥ 4) en la malla máxima puede tardar horas; en 288 × 168 son minutos. Al
   cambiar de malla la geometría se remuestrea y no se pierde.

## Cómo funciona

Navier-Stokes incompresible en 2D sobre **malla escalonada MAC**, con proyección
de Chorin:

- **Advección** MUSCL de 2.º orden con limitador van Leer (TVD), en forma de flujos.
- **Presión** por **multigrid geométrico** (ciclo V, suavizador Gauss-Seidel
  rojo-negro), 4 ciclos con paredes y 10 con bordes abiertos.
- **Turbulencia** por cierre Smagorinsky conmutable, que se apaga solo por debajo
  de Re ≈ 500.
- **Estabilidad** por sub-paso adaptativo (CFL y límite difusivo), pre-proyección a
  divergencia nula tras cada cambio de geometría, y reinicio automático si el campo
  se rompe.

El campo se rasteriza a la resolución del solver y el lienzo lo escala por hardware,
no en JavaScript.

## Limitaciones

- **Es 2D.** En sección el aire no puede rodear el cuerpo y la estela sale larga; en
  planta se sobrestima el efecto venturi entre volúmenes, porque en la realidad buena
  parte del aire escapa hacia arriba.
- **Entrada de velocidad uniforme**, sin perfil de capa límite atmosférica. Es un
  túnel aerodinámico clásico, no viento exterior urbano: no reproduce el descenso por
  fachada ni el vórtice de base.
- **Sin funciones de pared**: no resuelve la subcapa viscosa junto a los sólidos.
- **Ventana útil de Reynolds** de ~1 a unos pocos cientos. Por encima manda la
  difusión numérica del esquema; el panel avisa mediante el Reynolds de celda. No
  alcanza el Re ≈ 10⁶ del viento real a escala urbana.
- Abrir los bordes quita el confinamiento, **no** equivale a terreno infinito: siguen
  faltando las ~15 veces el frente aguas abajo que piden las guías.

## Estructura

```
tunel-viento-desktop/
├─ Tunel_de_viento_completo.html   ← la aplicación (autocontenida, en la raíz)
├─ src/main.js                     ← proceso principal de Electron
├─ src/icon.png                    ← icono de la ventana (256 px)
├─ build/icon.ico                  ← icono del .exe y del instalador (16–256 px)
├─ .github/workflows/build-windows.yml
├─ package.json
├─ .gitignore
└─ README.md
```

Todo el simulador vive en ese único HTML: sin dependencias, sin servidor, sin
instalación. También se abre con doble clic en cualquier navegador moderno; el
empaquetado con Electron solo le da ventana propia, menú e integración con el
diálogo de guardado de Windows.

## Compilar

### En GitHub (recomendado)

1. **Actions → Build Windows → Run workflow** para actualizar el release `latest`.
2. O empujar una etiqueta para crear un release con esa versión:
   ```bash
   git tag v2.0.0 && git push --tags
   ```

El workflow verifica antes de compilar que el HTML esté presente, sea autocontenido
y traiga las fuentes incrustadas, para no publicar un ejecutable roto tras cinco
minutos de build.

### En local

```bash
npm install
npm start      # abre la app
npm run dist   # genera portable + instalador en dist/
```

---

**Universidad de San Buenaventura — Pasto.** Uso académico.

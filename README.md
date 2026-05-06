# Sudoku-Cubo Focus 360

Prueba técnica para el rol de Backend Node.js Semi Senior en Focus 360. Implementación de una API REST y un cliente HTML/JS vanilla para validar, diagnosticar y corregir determinísticamente un Sudoku-Cubo.

## Tecnologías Utilizadas

- **Backend**: Node.js, TypeScript, Express.js.
- **Frontend**: HTML5, CSS3 (CSS Grid, Variables), JavaScript Vanilla.
- **Testing**: `node:test` (nativo de Node.js).

## Requisitos Previos

- Node.js v20 o superior (recomendado).
- npm (incluido con Node.js).

## Instalación y Ejecución

1. Clona el repositorio o descomprime el archivo entregado.
2. Abre una terminal en la raíz del proyecto.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor en modo desarrollo (usando `ts-node`):
   ```bash
   npm run dev
   ```
5. Abre tu navegador web y visita: [http://localhost:3000](http://localhost:3000)

## Ejecución con Docker (Bonus)

Para ejecutar el proyecto utilizando Docker:
1. Construye la imagen:
   ```bash
   docker build -t sudokube-api .
   ```
2. Ejecuta el contenedor:
   ```bash
   docker run -p 3000:3000 sudokube-api
   ```

## Pruebas

El proyecto cuenta con una suite de pruebas unitarias que cubren los casos de validación, corrección y rotación utilizando el test runner nativo de Node.js.

Para ejecutar las pruebas:
```bash
npm test
```

## Decisiones Técnicas y Supuestos

1. **TypeScript**: Se optó por usar TypeScript para tipar la lógica de dominio y las respuestas de la API, lo que mejora la robustez y previene errores en tiempo de ejecución. Al ejecutarse con `ts-node` y `tsx`, el flujo de desarrollo es transparente.
2. **Historial Persistente (Bonus)**: Para el endpoint `/api/sudokube/history`, se implementó el almacenamiento persistente en un archivo local `history.json` utilizando Promesas del FileSystem nativo de Node.js. 
3. **Lógica de Corrección Determinística**: La regla aplicada respeta la primera aparición válida en la cara, y reemplaza los índices problemáticos (vacíos, duplicados, fuera de rango) con los números faltantes ordenados de forma ascendente.
4. **Rotación**: Se implementó la rotación estricta de una matriz 3x3 de una sola cara (horaria y antihoraria). El bonus de afectar caras adyacentes no fue implementado para priorizar un código central impecable dentro del marco de tiempo sugerido.
5. **Dockerización (Bonus)**: Se incluyó un `Dockerfile` listo para compilar y servir la aplicación en cualquier entorno sin depender de Node.js instalado en el host local.
5. **Estética del Frontend**: Se diseñó una interfaz con temática "modo oscuro", uso intensivo de CSS Grid para las caras del cubo, y animaciones de error/validación para una mejor experiencia de usuario.

## Estructura del Proyecto

- `src/server.ts`: Configuración de Express y definición de endpoints.
- `src/sudokube.ts`: Lógica pura del dominio (validación, rotación, resolución).
- `public/`: Archivos estáticos del frontend (HTML, CSS, JS).
- `tests/sudokube.test.ts`: Pruebas automatizadas.

Candidato: Sebastián Leonardo López Rojas
Email: sl.lopezrojas@gmail.com

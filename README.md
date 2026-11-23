# Grama Joyería

Aplicación web progresiva (PWA) instalable en PC y celular para la gestión del negocio de reventa de joyería.

## Requisitos

- Node.js 24+
- npm 11+

## Configuración inicial

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar variables de entorno locales si hace falta personalizarlas:
   ```bash
   cp .env.example .env.local
   ```
3. Iniciar entorno de desarrollo:
   ```bash
   npm run dev
   ```

## Comandos disponibles

| Comando                | Descripción                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Levanta el servidor local de Vite                               |
| `npm run typecheck`    | Verifica tipos de TypeScript en modo estricto                   |
| `npm run lint`         | Ejecuta ESLint sobre el código                                  |
| `npm run format`       | Formatea el proyecto con Prettier                               |
| `npm run format:check` | Verifica formato sin modificar archivos                         |
| `npm test`             | Ejecuta los tests unitarios con Vitest                          |
| `npm run build`        | Verifica tipos y genera el build de producción + PWA en `dist/` |

## Estructura del proyecto

- `src/app/` — Shell principal de la aplicación, proveedores y rutas futuras.
- `src/features/` — Módulos funcionales por dominio (inventario, ventas, caja, etc.).
- `src/services/` — Clientes de persistencia, autenticación y sincronización.
- `src/shared/` — Componentes y utilidades reutilizables (incluye manejo seguro de montos en centavos y validación de entorno).
- `.github/workflows/ci.yml` — Pipeline automático en cada push o PR hacia `main`.

## Flujo de trabajo con Git

- `main` se mantiene siempre estable y lista para producción.
- Cada cambio o módulo nuevo se trabaja en una rama corta (`feat/...`, `fix/...`, `chore/...`) y se integra mediante Pull Request.
- Mensajes de commit sugeridos con Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).

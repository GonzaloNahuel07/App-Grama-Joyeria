import { env } from '../shared/lib/env';

/**
 * Root application shell. Domain modules will be mounted here once defined.
 */
export function App() {
  return (
    <main className="app-shell">
      <section className="status-card" aria-labelledby="app-title">
        <span className="status-badge">Base técnica lista</span>
        <h1 id="app-title">{env.VITE_APP_NAME}</h1>
        <p>
          Proyecto inicializado con TypeScript estricto, reglas de código, tests unitarios y soporte
          PWA para PC y celular.
        </p>
        <ul className="status-list">
          <li>Arquitectura modular preparada en src/features, src/services y src/shared.</li>
          <li>Listo para definir las funcionalidades del negocio y conectar la base de datos.</li>
        </ul>
      </section>
    </main>
  );
}

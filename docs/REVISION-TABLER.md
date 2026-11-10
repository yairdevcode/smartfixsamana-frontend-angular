# Revisión local del rediseño Tabler

El trabajo queda en la rama `redesign/tabler-local`, sin commits, push, merges ni despliegues. El repositorio estaba limpio en `master` al comenzar.

## Iniciar y revisar

Las dependencias ya están instaladas en este checkout. Desde la terminal de VS Code:

```bash
npm start
```

Abre **http://localhost:4200/login** e inicia sesión con tu usuario habitual. Mantén el backend que ejecutas desde IntelliJ en su configuración existente. No se cambiaron las direcciones, rutas ni contratos de los servicios.

Si necesitas reinstalar las dependencias, ejecuta `npm ci`. Tabler 1.7.4 declara Node >=20; Node 20 es compatible con Angular 17 y con el Dockerfile existente. La integración también compiló y ejecutó pruebas con el Node 18.19.1 disponible durante este trabajo.

Recorrido sugerido:

1. Acceso y registro: etiquetas, validaciones, mostrar contraseña y respuesta a credenciales incorrectas. La asignación de administrador conserva la restricción existente.
2. Resumen: órdenes registradas, pendientes, completadas y repuestos que alcanzaron su mínimo. Comprueba los valores contra tus registros.
3. Reparaciones: búsqueda, paginación, nueva orden, edición y selección de cliente y equipo. Al editar, revisa repuestos y resumen de costos.
4. Clientes, celulares, repuestos y tipos: filtros, tablas y formularios.
5. Inventario: alertas, movimientos y registro de entradas/salidas.
6. Reparaciones externas, liquidaciones y ganancias: filtros, formularios, resumen y consulta de fecha.
7. Repite las pantallas principales con un usuario sin permisos administrativos, con tema oscuro y con un ancho de celular.

## Implementación

- `@tabler/core` **1.7.4** y `@tabler/icons` **3.51.0**, fijados en el lockfile. CSS y JavaScript oficiales registrados en `angular.json`, también para Karma.
- Clases reales de Tabler en tarjetas, botones, campos, tablas, alertas, paginación, menús, estados vacíos y spinners. Los estilos anteriores de los componentes se retiraron; el tema compartido vive en `src/styles.css`.
- SVG locales extraídos de los iconos oficiales, reunidos en `src/assets/icons/tabler-sprite.svg`; licencia incluida. No hay una dependencia de CDN para los iconos.
- Tema claro inicial con verde petróleo; el selector usa `data-bs-theme` de Tabler y respeta la preferencia guardada en `smartfix-theme`.
- Navegación por tareas del taller y menú móvil con cierre por Escape, restauración del foco y contención del recorrido de teclado.
- Autocompletado de cliente y equipo con selección por teclado y valores visibles al editar. Los identificadores y DTO enviados a la API se mantienen.
- Se eliminaron altas mensuales estimadas, tiempos aleatorios, satisfacción fija y tasas presentadas sin contexto. El panel cuenta registros reales y muestra **Sin datos** cuando una fuente no responde. La fecha de las últimas órdenes es la fecha de ingreso, no una supuesta fecha de cambio de estado.
- Angular 17, autenticación JWT, sesión en `sessionStorage`, permisos, rutas, validaciones, servicios y contratos se conservaron.

## Compilación y pruebas

```bash
npm run build -- --configuration development
npm run build -- --configuration production
npm test -- --watch=false --browsers=ChromeHeadless
# Con el frontend abierto en otra terminal:
npm run test:ui -- http://localhost:4200
```

La prueba `test:ui` utiliza Puppeteer, que ya era dependencia del proyecto. Intercepta **todas las peticiones del backend de desarrollo** con respuestas en memoria: no lee ni escribe datos del taller. Revisa acceso, guard, registro, permisos visibles, búsqueda, paginación, reintento tras errores, DTO de alta/edición de reparación, repuestos, navegación móvil, tema oscuro y persistencia del tema. También abre los listados y formularios de los demás módulos y verifica que no exista desbordamiento horizontal de página.

Las capturas y `report.json` se guardan en `smartfix-tabler-review` dentro del directorio temporal del sistema (`/tmp/smartfix-tabler-review` en Linux). Los registros de prueba solo existen en ese navegador de pruebas; no se incorporan a la aplicación ni constituyen un modo demo.

El presupuesto inicial de producción se ajustó a 1.3 MB de aviso y 1.5 MB de error para incluir los recursos completos oficiales de Tabler. El resultado observado es aproximadamente 1.19 MB sin comprimir y 208 kB estimados de transferencia. Se conserva la minificación; se desactiva únicamente la extracción de CSS crítico y la incrustación de fuentes, porque el procesador de Angular 17 no reconoce algunos selectores de Tabler 1.7. El CSS completo se entrega como una hoja externa, sin eliminar esas reglas.

## Límites de la verificación

Se verificó la interfaz con Chromium en escritorio (1440 px), tableta (834 px) y móvil (390 px). Las pruebas de interfaz usan una API aislada. Queda por validar con tu backend y tus credenciales la persistencia real, las reglas de autorización del servidor y las operaciones de importación/exportación de Excel, conciliación y generación de liquidaciones. No se modificaron esas operaciones ni se ejecutaron sobre datos reales.

El servidor temporal de revisión se detiene al terminar; `npm start` desde VS Code inicia la aplicación para tu revisión.

## Resultado de esta revisión

- Compilación de desarrollo: aprobada.
- Compilación de producción: aprobada, sin advertencias.
- Karma/Chromium: **50 pruebas aprobadas**.
- Prueba de interfaz: aprobada; **44 capturas**, sin errores de JavaScript ni peticiones de API sin interceptar. Se verificaron alta/edición de reparación, agregado/retiro de repuestos y entrada de inventario con DTO conservados.
- `git diff --check`: aprobado.

# Prompt de arranque para Claude

> Copiá todo el texto de abajo y pegáselo a Claude como primer mensaje, **adjuntando
> al mismo tiempo estos archivos**: `docs/ARQUITECTURA.md`, `db/base_de_datos_script.txt`,
> `Modelo_Factura.xlsx`, `Requerimiento_del_cliente.pdf` y `prototipo/venta_credito.html`.
> Así tu Claude arranca con el mismo contexto que ya tiene el proyecto, sin que tengas
> que explicarle todo de nuevo.

---

Hola Claude. Estoy trabajando en equipo (4 estudiantes) en un proyecto para la materia
Ingeniería de Software III de la FP-UNA. Te adjunto toda la documentación.

**El proyecto:** ampliar un sistema de facturación existente llamado "GQG System" para que
soporte ventas a **crédito** con cuotas, además del **contado** que ya tiene. Una factura a
crédito genera varias cuentas a cobrar (cuotas) con fechas de vencimiento que el sistema
calcula solo. Hay dos modos de calcular esas fechas:
- **Regular:** cuotas en intervalos mensuales fijos (ej: 30/60/90 días).
- **Irregular:** el usuario define los días de cada cuota (ej: 30/45/60 días).

El corazón de la solución es un **trigger de base de datos** que, al insertar una venta,
genera las cuotas automáticamente. La interfaz solo deja elegir contado/crédito y el plazo.

**Lo que ya está decidido y NO quiero que cambies sin avisarme:**
- Stack: MySQL/MariaDB + Node/Express + React (o HTML+Tailwind). Está justificado en el doc.
- La base de datos es MySQL porque el trigger ya está empezado en esa sintaxis.
- La dirección visual: sobria tipo Linear/Notion, paleta tinta (#182232), modo claro.
  Todo está en la sección 11 del documento de arquitectura.

**Archivos que te adjunto:**
- `ARQUITECTURA.md` — el documento maestro: idea, alcance, stack, modelo de datos,
  lógica del trigger y guía de diseño completa. **Leelo primero, es la fuente de verdad.**
- `base_de_datos_script.txt` — el script SQL real. Las tablas PLAZOS, PLAZO_DETALLES y
  CUENTAS_COBRAR están sin completar, y el trigger tiene huecos marcados con `?????`.
- `Modelo_Factura.xlsx` — ejemplo real de la factura y las cuotas (fuente de los datos).
- `Requerimiento_del_cliente.pdf` — el pedido original del cliente.
- `venta_credito.html` — el prototipo visual ya hecho. Abrilo en el navegador para ver
  el diseño y el comportamiento esperado. Su JavaScript implementa la misma lógica de
  cálculo de cuotas que el trigger SQL debe reproducir.

**En lo que necesito que me ayudes ahora (elegí vos según lo que te pida después):**
- Completar las tablas faltantes y el trigger SQL (rellenar los `?????`).
- O pasar el prototipo HTML a código real del front.
- O lo que te indique a continuación.

Antes de escribir código, leé el ARQUITECTURA.md completo y confirmame que entendiste
el objetivo, el alcance (qué entra y qué no) y la dirección de diseño. Después seguimos.

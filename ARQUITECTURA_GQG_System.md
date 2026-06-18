# GQG System — Módulo de Crédito con Vencimientos Regulares e Irregulares

> Documento de arquitectura, stack tecnológico y plan de avance.
> Proyecto: *Parametrización de Vencimientos de Cuotas Regulares e Irregulares para GQG System*
> Materia: Ingeniería de Software III — Énfasis en ASI — FP-UNA

---

## 1. La idea del proyecto en una frase

GQG System hoy solo factura **al contado**. Hay que agregarle la modalidad de **crédito**, donde una factura genera **varias cuotas (cuentas a cobrar)** con fechas de vencimiento que el sistema calcula automáticamente. Hay dos formas de calcular esas fechas:

- **Regular**: las cuotas vencen en intervalos mensuales fijos contados desde la fecha de factura. Ej.: `30 / 60 / 90 días`.
- **Irregular**: el usuario define manualmente en cuántos días vence cada cuota. Ej.: `30 / 45 / 60 días`.

El corazón de la solución es un **trigger de base de datos** que, al insertar una venta, genera solas las filas de cuotas en `CUENTAS_COBRAR`. La interfaz solo deja elegir contado/crédito y el plazo; el resto lo hace la base de datos.

### Ejemplo concreto (del modelo de factura)

Factura `001-001-0044685`, total **584.226 Gs**, plazo `CR-30-45-60 días` (irregular), 3 cuotas:

| Cuota | Importe | Vence |
|-------|--------:|-------|
| 1/3 | 194.742 | fecha_factura + 30 días |
| 2/3 | 194.742 | fecha_factura + 45 días |
| 3/3 | 194.742 | fecha_factura + 60 días |

La última cuota absorbe la diferencia de redondeo para que la suma de cuotas sea exactamente el total de la factura.

---

## 2. Alcance (qué entra y qué no)

**Entra:**
- Selección de modalidad (Contado / Crédito) al facturar.
- Configuración de plazos regulares e irregulares (cantidad de cuotas + días).
- Generación automática de cuotas vía trigger.
- Pantalla de consulta de cuentas a cobrar de una factura.
- Prototipo de interfaz gráfica.

**No entra (fuera de alcance):**
- Cobranza / registro de pagos de cuotas (solo se muestra el estado `cobrado`).
- Otros módulos del sistema (stock, compras detalladas, reportes contables).
- Despliegue en producción: el entregable es **análisis + diseño + prototipo**.

> Nota: el requerimiento habla de "compras y ventas". Para no duplicar trabajo, el diseño de **VENTAS** y **COMPRAS** es simétrico. El equipo implementa **VENTAS** completo como caso de referencia; COMPRAS se documenta como espejo (misma tabla de plazos, mismo trigger adaptado a `CUENTAS_PAGAR`).

---

## 3. Stack tecnológico — fácil pero efectivo para trabajar en equipo

La prioridad es: **baja curva de aprendizaje, que 4 personas trabajen en paralelo sin pisarse, y compatibilidad con el trigger SQL que ya empezaron** (usa sintaxis MySQL: `DELIMITER`, `SIGNAL SQLSTATE`).

| Capa | Tecnología | Por qué esta |
|------|-----------|--------------|
| **Base de datos** | **MySQL 8** (o MariaDB 10.6+) | El script y el trigger ya están escritos en MySQL. No cambiar de motor evita reescribir todo. |
| **Backend / API** | **Node.js + Express** | JS es lo más sencillo para empezar; un solo lenguaje en front y back baja la curva. |
| **Acceso a datos** | Driver `mysql2` (consultas SQL directas) | Sin ORM pesado. El trigger hace el trabajo duro; el backend solo inserta y consulta. |
| **Frontend** | **React + Vite** | Componentes claros, separa bien el trabajo por pantalla. Vite arranca en segundos. |
| **Estilos** | CSS plano o Tailwind (opcional) | No bloquea. Empezar con CSS simple. |
| **Control de versiones** | **Git + GitHub** | Imprescindible para 4 personas. Una rama por feature. |
| **Gestión de tareas** | GitHub Projects / Trello | Mapea directo a la EDT del TP. |
| **Diseño de prototipo** | Figma (gratis) | Para las pantallas antes de codear. |
| **Documentación** | Markdown en el repo | Este mismo archivo vive en `/docs`. |

### ¿Por qué NO usar algo más "moderno"?
- **Sin ORM (Sequelize/Prisma):** los ORM pelean con los triggers. Como la lógica vive en la BD, conviene SQL plano.
- **Sin microservicios:** es un módulo, no un sistema distribuido. Un backend monolítico simple alcanza.
- **Alternativa aún más simple:** si el equipo no domina React, se puede hacer todo el frontend con **HTML + JavaScript vanilla + Bootstrap** servido por el mismo Express. El backend y la BD no cambian.

### Versión "mínima viable" del stack (si hay poco tiempo)
```
MySQL  +  Node/Express  +  HTML/Bootstrap (sin React)
```
Esto cubre el 100% de los requerimientos del TP igual, porque lo evaluable es el modelo de datos y el trigger.

---

## 4. Arquitectura general

```
┌─────────────────────────────────────────────────┐
│                  NAVEGADOR                         │
│   React/Vite (o HTML+JS)                           │
│   - Pantalla "Nueva Venta" (Contado/Crédito)       │
│   - Selector de Plazo (regular/irregular)          │
│   - Vista "Cuentas a Cobrar" de una factura        │
└───────────────────────┬───────────────────────────┘
                        │  HTTP / JSON (REST)
┌───────────────────────▼───────────────────────────┐
│              BACKEND  (Node + Express)             │
│   GET  /plazos            -> lista plazos          │
│   POST /ventas            -> inserta en VENTAS     │
│   GET  /ventas/:id/cuotas -> lee CUENTAS_COBRAR    │
│   (solo orquesta: NO calcula cuotas)               │
└───────────────────────┬───────────────────────────┘
                        │  SQL (driver mysql2)
┌───────────────────────▼───────────────────────────┐
│                MySQL 8 / MariaDB                   │
│                                                    │
│   INSERT en VENTAS                                 │
│        │                                           │
│        ▼  dispara                                  │
│   ┌──────────────────────────────────────────┐    │
│   │  TRIGGER ins_ventas (AFTER INSERT)         │    │
│   │  1. valida tipo doc vs plazo               │    │
│   │  2. calcula importe de cada cuota          │    │
│   │  3. ajusta última cuota (redondeo)         │    │
│   │  4. calcula fecha de vencimiento:          │    │
│   │     - regular  -> +30, +60, +90 ...        │    │
│   │     - irregular-> +días de PLAZO_DETALLES  │    │
│   │  5. inserta N filas en CUENTAS_COBRAR      │    │
│   └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

**Decisión central:** la lógica de cuotas vive en el **trigger**, no en el backend. Esto es lo que pide el cliente (RF-05) y garantiza que cualquier inserción en `VENTAS` —venga del front, de un script o de otro sistema— genere las cuotas igual.

---

## 5. Modelo de datos

### 5.1 Tablas existentes (ya en el script)
`TIPOS_DOCUMENTO`, `CLIENTES`, `MONEDAS`, `EMPRESAS`, `DEPOSITOS`, `VENTAS`, `PRODUCTOS`, `PRODUCTO_DETALLE`, `VENTA_DETALLES`.

### 5.2 Tablas que faltan completar (el script las dejó vacías)

El script tiene `PLAZOS`, `PLAZO_DETALLES` y `CUENTAS_COBRAR` sin columnas. Hay que definirlas. Estas son las definiciones que **el trigger ya asume** (deducidas de cómo las consulta):

```sql
-- Cabecera del plazo: define la modalidad y cuántas cuotas
CREATE TABLE PLAZOS (
  id        INT NOT NULL,
  plazo     VARCHAR(100) NOT NULL,   -- 'CR-30/60/90 días'
  tipoid    INT NOT NULL,            -- 0=Contado, 1=Crédito (debe coincidir con TIPOS_DOCUMENTO.tipoid)
  cuotas    INT NOT NULL,            -- cantidad de cuotas (1 si es contado)
  irregular SMALLINT NOT NULL,       -- 0=regular (intervalos mensuales), 1=irregular (días manuales)
  CONSTRAINT pkplazo PRIMARY KEY (id)
);

-- Detalle del plazo: SOLO para irregulares. Define los días de cada cuota
CREATE TABLE PLAZO_DETALLES (
  id        INT NOT NULL,
  plazoid   INT NOT NULL,            -- FK a PLAZOS
  cuota     INT NOT NULL,            -- número de cuota (1, 2, 3...)
  dias      INT NOT NULL,            -- días desde la fecha de factura (25, 40, 55...)
  CONSTRAINT pkplazodet PRIMARY KEY (id),
  CONSTRAINT fkplazodet FOREIGN KEY (plazoid) REFERENCES PLAZOS(id)
);

-- Cuentas a cobrar: aquí el trigger inserta una fila por cuota
CREATE TABLE CUENTAS_COBRAR (
  id       INT NOT NULL AUTO_INCREMENT,
  tabla    VARCHAR(20) NOT NULL,     -- 'VENTAS' (permite reusar para COMPRAS)
  tablaid  INT NOT NULL,             -- id de la venta que la originó
  cuota    INT NOT NULL,             -- número de cuota
  importe  DECIMAL(18,5) NOT NULL,
  cobrado  DECIMAL(18,5) NOT NULL DEFAULT 0,
  vence    DATETIME NOT NULL,
  CONSTRAINT pkcc PRIMARY KEY (id)
);
```

### 5.3 Ajuste necesario en VENTAS
La tabla `VENTAS` necesita la columna `plazoid` (el trigger ya la usa como `NEW.plazoid`, pero el `CREATE TABLE` original no la tiene):

```sql
ALTER TABLE VENTAS ADD COLUMN plazoid INT NOT NULL;
ALTER TABLE VENTAS ADD CONSTRAINT fkvtaplazo FOREIGN KEY (plazoid) REFERENCES PLAZOS(id);
```

### 5.4 Justificación de atributos (lo pide el TP, RF-04)
- `PLAZOS.irregular`: distingue las dos lógicas de cálculo. Es la columna que decide qué rama del trigger se ejecuta.
- `PLAZOS.tipoid`: evita que se asigne un plazo de crédito a un documento de contado (el trigger lanza error si no coinciden).
- `PLAZO_DETALLES.dias`: solo tiene sentido en irregulares; en regulares el trigger usa `cuota * 30`.
- `CUENTAS_COBRAR.tabla` + `tablaid`: hacen la tabla reusable tanto para ventas (cobrar) como compras (pagar), sin duplicar estructura.
- `CUENTAS_COBRAR.cobrado`: deja preparado el futuro registro de pagos sin estar en alcance ahora.

---

## 6. Lógica del trigger (pseudocódigo claro)

```
AL INSERTAR una VENTA:
  1. Leer tipoid del documento y tipoid del plazo.
     Si no coinciden -> ERROR "Tipo de documentos y plazos no coinciden".

  2. Leer cuotas e irregular del PLAZO.
     Si cuotas = 0 -> ERROR "Ingrese cantidad de cuotas".

  3. Calcular importe base de cada cuota:
     importecuota = TRUNCATE(totalfactura / cuotas, decimales_de_la_moneda)
     Si importecuota = 0 -> ERROR.

  4. Calcular la última cuota (absorbe el redondeo):
     ultimacuota = totalfactura - importecuota * (cuotas - 1)

  5. SI es CONTADO (tipoid del documento = 0):
        insertar 1 sola cuota, vence = fecha_factura.

     SI es CRÉDITO:
        SI irregular = 0 (REGULAR):
           para cada cuota i de 1 a N:
              vence = fecha_factura + (i * 30) días
              importe = (i < N) ? importecuota : ultimacuota
              insertar fila en CUENTAS_COBRAR
        SI irregular = 1 (IRREGULAR):
           para cada cuota i de 1 a N:
              dias  = (SELECT dias FROM PLAZO_DETALLES WHERE plazoid=... AND cuota=i)
              vence = fecha_factura + dias
              importe = (i < N) ? importecuota : ultimacuota
              insertar fila en CUENTAS_COBRAR
```

Los huecos `?????` del script actual corresponden a los pasos 3, 4, 5 y al loop. Esa es la parte que falta programar.

### Datos de prueba (ya en el script)
```sql
INSERT INTO PLAZOS VALUES
(1,'CO-Contado',        0, 1, 0),   -- contado
(2,'CR-30/60/90 días',  1, 3, 0),   -- crédito regular, 3 cuotas
(3,'CR-25/40/55 días',  1, 3, 1);   -- crédito irregular, 3 cuotas

INSERT INTO PLAZO_DETALLES VALUES
(1, 3, 1, 25),
(2, 3, 2, 40),
(3, 3, 3, 55);
```

---

## 7. División de trabajo en equipo (mapeado a los roles del TP)

| Persona | Rol (según acta) | Se encarga de |
|---------|------------------|---------------|
| Ian Marco Delvalle | Jefe de Proyecto / Analista | Coordina, integra, repo Git, valida con el "cliente" |
| Alberto Malfitano | Diseñador / Programador | **Trigger** + tablas faltantes (la parte crítica) |
| Diego Duarte / Matias Gaona | Diseñador / Programador | **Backend Express** (endpoints) + datos de prueba |
| Matias Melgarejo | Analista / Tester | **Frontend** + casos de prueba |

**Regla de oro para no pisarse:** cada quien trabaja en su rama (`feature/trigger`, `feature/api`, `feature/ui`) y mergea a `develop` con pull request. La BD vive en un solo archivo `schema.sql` versionado.

---

## 8. Cómo avanzar — plan por fases

### Fase 0 — Arranque (semana 1)
- [ ] Crear repo en GitHub, invitar a los 4.
- [ ] Estructura de carpetas (ver sección 9).
- [ ] Cada uno instala MySQL local + Node.
- [ ] Cargar el `schema.sql` con las tablas ya corregidas (sección 5).

### Fase 1 — Base de datos y trigger (semanas 1–2) ← *lo más importante*
- [ ] Completar `CREATE TABLE` de PLAZOS, PLAZO_DETALLES, CUENTAS_COBRAR.
- [ ] Agregar `plazoid` a VENTAS.
- [ ] **Programar el trigger** (rellenar los `?????`).
- [ ] Probar las 3 modalidades: contado, regular, irregular.
- [ ] Verificar que la suma de cuotas = total factura (cuadre de redondeo).

### Fase 2 — Backend (semana 2–3)
- [ ] `GET /plazos` — alimenta el combo de la pantalla.
- [ ] `POST /ventas` — inserta venta (el trigger genera las cuotas solo).
- [ ] `GET /ventas/:id/cuotas` — devuelve las cuentas a cobrar.

### Fase 3 — Frontend / prototipo (semana 3–4)
- [ ] Pantalla de venta con selector Contado/Crédito.
- [ ] Al elegir crédito, mostrar combo de plazo (regular/irregular).
- [ ] Tabla de cuotas resultante (réplica del modelo de factura: Cuota / Importe / Vence / Cobrado).

### Fase 4 — Pruebas e integración (semana 4)
- [ ] Casos de prueba documentados (el del modelo: 584.226 / 3 cuotas / irregular).
- [ ] Pruebas de integración front + back + BD.
- [ ] Corrección de errores.

### Fase 5 — Documentación y cierre (semana 5)
- [ ] Documento final del proyecto.
- [ ] Capturas del prototipo.
- [ ] Presentación.

---

## 9. Estructura de carpetas sugerida

```
gqg-credito/
├── docs/
│   ├── ARQUITECTURA.md          (este archivo)
│   └── prototipo/               (imágenes de Figma)
├── db/
│   ├── schema.sql               (tablas + datos de prueba)
│   └── trigger_ins_ventas.sql   (el trigger)
├── backend/
│   ├── package.json
│   ├── server.js                (Express)
│   ├── db.js                    (conexión mysql2)
│   └── routes/
│       ├── plazos.js
│       └── ventas.js
├── frontend/                    (React/Vite o HTML+JS)
│   └── src/
│       ├── NuevaVenta.jsx
│       └── CuentasCobrar.jsx
└── README.md
```

---

## 10. Riesgos y recomendaciones

- **Riesgo #1 — el redondeo.** Es el bug clásico: si dividís 100.000 / 3 = 33.333 y sumás tres veces, da 99.999, falta 1 Gs. Por eso la última cuota se calcula aparte. **Probarlo siempre.**
- **Riesgo #2 — fechas en meses vs días.** "Regular 30-60-90" en la práctica suele ser "fin de mes a mes", pero el cliente lo definió en días (múltiplos de 30). Mantener días simplifica y es lo que dice el requerimiento.
- **Riesgo #3 — coherencia tipo documento vs plazo.** Ya está cubierto: el trigger valida y lanza error. No quitarlo.
- **Recomendación:** empezar por la BD y el trigger. Si eso funciona, el resto es "cableado". El 70% de la nota del TP está ahí (modelo de datos + trigger).
- **Recomendación:** no meter ORM, no meter autenticación, no meter Docker en la primera versión. Sumar complejidad solo si sobra tiempo.

---

## 11. Guía de diseño del frontend

Dirección visual definida para el proyecto: **moderno y sobrio orientado a datos** (estilo Linear/Notion, no landing llamativa), densidad equilibrada, modo claro. El objetivo es que se vea como software empresarial confiable, no como una app generada por IA.

### 11.1 Principios

1. **Monocromático + un acento.** Casi todo en tinta y grises. El color tinta (`#182232`) es el acento, usado solo para acción primaria, modalidad activa y foco. Nada compite con los datos.
2. **Los números son el protagonista.** Importes y fechas en fuente monoespaciada con figuras tabulares para que las columnas alineen perfecto. Una tabla financiera se lee de un vistazo.
3. **El resultado en vivo es el elemento firma.** El panel de cuentas a cobrar se reconstruye a medida que el operador carga datos, con una animación sutil de filas escalonadas (~65ms entre filas). Es el único movimiento de la app y refleja lo que hace el trigger: una venta → varias cuotas.
4. **Restricción ante todo.** Sin gradientes, sin sombras (salvo el anillo de foco), sin glow, sin esquinas redondeadas "burbuja". Radio máximo 6px. Sin emojis.
5. **Coherencia (RF-06).** La misma paleta, tipografía y tokens en todas las pantallas para que el sistema se sienta uno solo.

### 11.2 Paleta de colores

Derivada de la dirección sobria (paleta tinta/slate). Todos los valores son hex listos para usar.

| Rol | Hex | Uso |
|-----|-----|-----|
| Tinta (primary) | `#182232` | acción primaria, modalidad activa, texto de títulos, foco |
| Tinta hover | `#2d3748` | hover del botón primario |
| Slate | `#505f76` | etiquetas, texto secundario, íconos |
| Fondo | `#fbf8fa` | lienzo general, filas de total |
| Superficie | `#ffffff` | tarjetas, formularios, tabla |
| Superficie tenue | `#f0edef` | encabezado de tabla, toggle de modalidad |
| Borde | `#c5c6cd` | líneas finas, separadores, bordes de input |
| **Acento crédito** | `#d0e1fb` / texto `#38485d` | badge "CRÉDITO" |
| **Acento contado / positivo** | `#c0dd97` / texto `#27500a` | badge "CONTADO", estado aprobado, cuadre OK |
| Alerta | `#A32D2D` | diferencia de redondeo, errores |
| Positivo (texto) | `#0F6E56` | confirmación de cuadre |

Regla: el azul tinta apagado reemplaza cualquier azul eléctrico. El azul brillante es lo que más "delata" una UI generada por IA en una herramienta de datos.

### 11.3 Tipografía

| Rol | Familia | Tamaño / peso | Uso |
|-----|---------|---------------|-----|
| Display | Inter | 30px / 600, tracking -0.02em | títulos de página grandes |
| Headline md | Inter | 20px / 600 | nombre del sistema |
| Headline sm | Inter | 16px / 600 | títulos de tarjeta ("Datos de la venta") |
| Body | Inter | 14px / 400 | texto general, inputs |
| Body sm | Inter | 13px / 400 | notas al pie |
| Label caps | Inter | 11px / 600, tracking 0.05em, MAYÚSCULAS | etiquetas de campo ("CLIENTE", "PLAZO") |
| **Tabular num** | **JetBrains Mono** | 13px / 500 | **todos los importes y fechas** |

El detalle clave: importes y fechas SIEMPRE en JetBrains Mono (o cualquier mono con figuras tabulares). Esto hace que las columnas de la tabla de cuotas queden alineadas dígito con dígito.

Carga de fuentes (Google Fonts):
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
```

### 11.4 Tokens de espaciado y forma

| Token | Valor | Uso |
|-------|-------|-----|
| Radio base | 4px | inputs, botones, badges internos |
| Radio tarjeta | 6px | tarjetas y secciones |
| Borde | 0.5px–1px sólido `#c5c6cd` | siempre líneas finas |
| Altura de input | 40px | inputs y selects |
| Gap entre columnas | 18px | separación de paneles |
| Padding de tarjeta | ~1.1rem 1.2rem | interior de tarjetas |
| Ritmo vertical | 16px / 24px / 32px | separación entre bloques |

### 11.5 Estructura de la pantalla principal (venta a crédito)

```
┌─────────────────────────────────────────────────────────┐
│ GQG System │ Nueva venta a crédito          Operador      │  barra fina
├─────────────────────────────┬───────────────────────────┤
│ DATOS DE LA VENTA            │ CUENTAS A COBRAR  [CRÉDITO]│
│  Cliente   [____________]    │  CUOTA  IMPORTE     VENCE   │
│  Fecha [___]  Total [___]    │  01/03  194.742  18/07/2024 │
│  Modalidad [CONTADO|CRÉDITO] │  02/03  194.742  01/08/2024 │
│  Plazo     [30/45/60 ▾]      │  03/03  194.742  15/09/2024 │
│       [DESCARTAR][GENERAR]   │  Total  584.226             │
│                              │  ✓ La suma coincide...      │
├──────────────┬───────────────┴──────────┬─────────────────┤
│ LÍMITE CRÉD. │ ÚLTIMO PAGO              │ ESTADO [APROBADO]│  tarjetas
└──────────────┴──────────────────────────┴─────────────────┘    contexto
```

Comportamiento: el panel derecho es un **preview vivo**. Al cambiar modalidad, plazo o total, las cuotas se recalculan y reaniman. En contado se muestra una sola cuota que vence en la fecha de factura.

### 11.6 Lógica de cálculo (debe coincidir con el trigger)

El frontend calcula las cuotas igual que el trigger, para previsualizar. Esta es la especificación (el programador del trigger debe reproducir exactamente esto en SQL):

```
base    = TRUNCATE(total / cuotas, decimales_moneda)   // Guaraní: 0 decimales
ultima  = total - base * (cuotas - 1)                  // absorbe el redondeo

para cada cuota i (1..n):
    importe = (i < n) ? base : ultima
    SI contado:   vence = fecha_factura
    SI regular:   vence = fecha_factura + (i * 30) días
    SI irregular: vence = fecha_factura + PLAZO_DETALLES.dias[i]
```

El indicador de cuadre (verde si la suma de cuotas = total, rojo si hay diferencia) es una verificación visual del riesgo #1 del documento. Sirve también como caso de prueba: con 584.226 / 3 cuotas, da 194.742 × 3 = 584.226 exacto.

### 11.7 Stack de implementación del front

Dos caminos, según lo que domine el equipo:

- **React + Vite + shadcn/ui** (recomendado): los componentes de tabla, formulario, select y date picker ya vienen con buen gusto por defecto y son fáciles de tematizar con la paleta de arriba. Es el estándar actual para apps internas.
- **HTML + Tailwind + JS vanilla** (más simple): la versión que generó Stitch funciona directo. Se configura la paleta en `tailwind.config` con los hex de la sección 11.2.

En cualquier caso: definir los colores como variables CSS / tokens de Tailwind una sola vez, y que todas las pantallas los consuman. No hardcodear colores en cada componente.

### 11.8 Pantallas pendientes del prototipo (mismas reglas)

1. **Administración de plazos** — alta/edición de plazos: nombre, tipo (contado/crédito), cantidad de cuotas, regular/irregular, y para irregulares los días de cada cuota (alimenta `PLAZOS` y `PLAZO_DETALLES`).
2. **Consulta de cuentas a cobrar** — vista de las cuotas de una factura ya emitida, con su estado de cobro (lee `CUENTAS_COBRAR`). Replica el panel derecho de la pantalla principal, en modo solo lectura.

### 11.9 Qué evitar (para no recaer en el look "IA")

- Azul eléctrico, verde ácido, gradientes, glow.
- Animaciones por todos lados. Una sola: la generación de cuotas.
- Esquinas muy redondeadas, sombras marcadas, tarjetas "flotantes".
- Texto de marketing ("potente", "revolucionario"). Copy plano y funcional: un botón dice exactamente lo que hace ("Generar cuotas", no "Enviar").
- Íconos decorativos de relleno. Cada ícono debe aportar significado.

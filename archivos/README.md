# GQG System — Módulo de Crédito

Extensión del sistema de facturación **GQG System** para soportar ventas a **crédito** con
cuotas de vencimiento regular e irregular, además del contado existente.

> Proyecto académico — Ingeniería de Software III, Licenciatura en Ciencias Informáticas,
> Facultad Politécnica UNA.

---

## ¿De qué se trata?

Hoy el sistema solo factura al contado. Este módulo agrega la modalidad de **crédito**:
una factura genera varias **cuotas** (cuentas a cobrar) con fechas que el sistema calcula
solo, mediante un **trigger de base de datos**. Hay dos modos:

- **Regular** — cuotas mensuales fijas (ej: 30/60/90 días).
- **Irregular** — días definidos por el usuario (ej: 30/45/60 días).

La documentación completa está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## Estructura del repo

```
.
├── README.md                      (este archivo)
├── PROMPT_DE_ARRANQUE.md          ← cómo poner a Claude en contexto del proyecto
├── docs/
│   └── ARQUITECTURA.md            ← documento maestro (idea, stack, BD, diseño)
├── db/
│   └── base_de_datos_script.txt   ← script SQL (tablas + trigger a completar)
├── prototipo/
│   └── venta_credito.html         ← prototipo visual (abrir en navegador)
└── recursos/
    ├── Modelo_Factura.xlsx        ← ejemplo real de factura y cuotas
    └── Requerimiento_del_cliente.pdf
```

---

## Cómo empezar a trabajar

1. Cloná el repo.
2. Leé `docs/ARQUITECTURA.md` — es la fuente de verdad de todo el proyecto.
3. Abrí `prototipo/venta_credito.html` en el navegador para ver el diseño esperado.
4. Si vas a trabajar con Claude, seguí las instrucciones de `PROMPT_DE_ARRANQUE.md`.

### Prioridad de desarrollo

El 70% del valor del proyecto está en la base de datos y el trigger. Arrancar por ahí:

1. Completar las tablas `PLAZOS`, `PLAZO_DETALLES`, `CUENTAS_COBRAR` (ver doc, sección 5).
2. Programar el trigger (rellenar los `?????` del script).
3. Probar las 3 modalidades: contado, regular, irregular.
4. Recién después: backend y frontend.

---

## Stack

MySQL/MariaDB · Node.js + Express · React + Vite (o HTML + Tailwind) · Git/GitHub.

Justificación completa en el documento de arquitectura.

---

## Equipo

| Rol | Integrante |
|-----|-----------|
| Jefe de Proyecto / Analista | Ian Marco Delvalle |
| Diseñador / Programador | Alberto Malfitano |
| Diseñador / Programador | Diego Duarte |
| Diseñador / Programador | Matias Gaona |
| Analista / Tester | Matias Melgarejo |

# Respuestas - Primer Examen Final

**Proyecto:** GQG System - Modulo de Credito (parametrizacion de vencimientos de cuotas regulares e irregulares)
**Materia:** Ingenieria de Software III - Enfasis en ASI
**Facultad Politecnica - Universidad Nacional de Asuncion**

Este documento responde, criterio por criterio, la rubrica de la *Guia de actividad - Primer Examen Final*. El prototipo esta implementado: app full-stack Next.js 15 + MySQL/MariaDB, con un trigger de base de datos como nucleo de la logica de negocio.

---

## Alcance: el requerimiento menciona compras y ventas

El requerimiento del cliente dice que GQG System "cuenta con los procesos de compras y ventas, los cuales solo permiten facturaciones de contado". Sin embargo, el punto 3 del entregable acota el alcance:

> "Ensayar el codigo del trigger de la base de datos para **cualquiera** de los procesos (compras o ventas) que implemente esta solucion."

Por eso el prototipo implementa el proceso de **ventas** (cuentas a cobrar), que es representativo de toda la logica pedida. **Compras** es el proceso espejo (cuentas a pagar) y se resuelve reutilizando la misma estructura: por eso la tabla `CUENTAS_COBRAR` incluye las columnas `tabla` y `tablaid`, que la hacen polimorfica.

---

## 1. Comprension del requerimiento (20 pts)

### El problema
GQG System es un sistema de facturacion que hoy solo opera de contado. El negocio crecio, la cartera de clientes aumento y las reglas cambiaron: se necesita poder vender (y comprar) a credito de forma administrativa, eligiendo la modalidad de pago al registrar el comprobante.

### Las tres modalidades de pago
- **Contado (CO):** la cuenta es unica y se cancela en la misma fecha de la factura.
- **Credito Regular:** varias cuotas con vencimiento mensual regular a partir de la fecha de la factura. Ejemplo: CR-30/60/90 dias (3 cuotas a 30, 60 y 90 dias).
- **Credito Irregular:** varias cuotas, pero los dias de cada vencimiento se indican manualmente. Ejemplo: CR-30/45/60 dias.

### Que se implementa y como se justifica
Todos los datos por encima del detalle de cuotas ya existen en la factura; lo que faltaba es el detalle "Cuotas" de la cuenta (nro de cuota, importe, vencimiento, cobrado). La solucion es un **trigger** que, al registrar la venta, genera automaticamente esas cuotas segun el plazo elegido. Asi se garantiza consistencia (la suma de las cuotas es siempre igual al total) sin que el usuario las cargue a mano.

---

## 2. Diseno del sistema y base de datos (20 pts)

El modelo se organiza en catalogos, el nucleo de plazos, productos, ventas y cuentas a cobrar.

### Tablas y por que existen
- **MONEDAS:** moneda y su cantidad de `decimales`. El trigger lo usa para truncar/redondear el importe de cada cuota (Guarani = 0 decimales).
- **TIPOS_DOCUMENTO:** Contado/Credito/Nota Credito, con `tipoid` (0=Contado, 1=Credito) que debe coincidir con el del plazo.
- **EMPRESAS, DEPOSITOS, CLIENTES:** datos maestros de la cabecera de la factura.
- **PLAZOS (nucleo del requerimiento):** cabecera de la modalidad. Campos clave: `cuotas` (cantidad) e `irregular` (0=regular x30, 1=irregular con dias manuales).
- **PLAZO_DETALLES:** solo para plazos irregulares; guarda los `dias` de cada cuota desde la fecha de la factura.
- **PRODUCTOS / PRODUCTO_DETALLE:** catalogo de items, con IVA por producto, `precio` de venta y `activo` (baja logica).
- **VENTAS:** cabecera del comprobante. Se le agrego `plazoid` (no estaba en el script de catedra) porque es el dato que el trigger necesita para armar las cuotas.
- **VENTA_DETALLES:** lineas de la venta (precio, cantidad, IVA, total).
- **CUENTAS_COBRAR:** lo que genera el trigger (cuota, importe, vence, cobrado). `tabla`/`tablaid` la hacen reusable para ventas y, a futuro, compras.

### Entidades y relaciones clave
- VENTAS N:1 CLIENTES, N:1 PLAZOS, N:1 MONEDAS, N:1 TIPOS_DOCUMENTO, N:1 DEPOSITOS.
- PLAZO_DETALLES N:1 PLAZOS (el detalle de dias pertenece a un plazo irregular).
- VENTA_DETALLES N:1 VENTAS y N:1 PRODUCTO_DETALLE (por `codbarra`); PRODUCTO_DETALLE N:1 PRODUCTOS.
- CUENTAS_COBRAR se relaciona con VENTAS de forma logica via `(tabla='VENTAS', tablaid=VENTAS.id)`.

> El esquema completo (CREATE TABLE con todas las claves foraneas) se visualiza como diagrama entidad-relacion importando `db/azimutt_schema.sql` en [azimutt.app](https://azimutt.app).

---

## 3. Prototipo de interfaz grafica (15 pts)

Aplicacion web funcional, en espanol. Pantallas:
- **Login** (autenticacion basica por sesion).
- **Nueva venta:** selector de cliente, fecha, lineas de productos (el total se calcula de las lineas, no se tipea), toggle CONTADO/CREDITO, selector de plazo (regular o irregular) y **vista previa en vivo** de las cuotas con su importe y vencimiento.
- **Ventas:** listado de comprobantes emitidos.
- **Cuentas a cobrar:** detalle por venta con sus cuotas (cuota, importe, vence, cobrado).
- **ABM de Clientes** (crear / editar / desactivar / reactivar).
- **ABM de Productos** (crear / editar / desactivar / reactivar, con precio e IVA).
- **ABM de Plazos** (alta + listado), **Depositos** y edicion de **Empresa**.
- **Factura imprimible** (comprobante no fiscal con liquidacion de IVA y plan de cuotas).

### Controles para gestionar las modalidades de pago
- Toggle Contado/Credito que filtra los plazos validos para esa modalidad.
- Selector de plazo que distingue regular vs irregular.
- Preview de cuotas numeradas `01/03` (dos digitos) y fechas `DD/MM/AAAA`, con un indicador de que la suma "cuadra" con el total antes de confirmar.

### Funcionalidades implicitas (calidad)
Validaciones (cliente, plazo y al menos un producto obligatorios; el total surge de las lineas), control de secuencia (el boton CONFIRMAR VENTA esta deshabilitado hasta generar las cuotas), baja logica en los ABM de Clientes y Productos, campos numericos que filtran no-digitos y se revalidan en el backend, diseno amigable y responsive (uso en tablet en el mostrador).

---

## 4. Implementacion tecnica: el trigger (15 pts)

El nucleo de la logica de negocio es el trigger `ins_ventas` (`AFTER INSERT ON VENTAS`): al registrar una venta, genera las filas de `CUENTAS_COBRAR`. Pasos:

1. Valida que el `tipoid` del documento coincida con el `tipoid` del plazo; si no, aborta con `SIGNAL SQLSTATE '45000'` (no se puede registrar un credito con un plazo de contado).
2. Lee la cantidad de cuotas y si el plazo es irregular.
3. Lee los decimales de la moneda.
4. Importe base de cada cuota = `TRUNCATE(total / cuotas, decimales)`.
5. Ultima cuota = `total - base * (cuotas - 1)`: absorbe el redondeo para que la suma sea exacta.
6. Inserta las cuentas: contado -> 1 cuota que vence en la fecha de la factura; credito -> un bucle por cada cuota con `dias = i*30` (regular) o `PLAZO_DETALLES.dias` (irregular), usando `DATE_ADD` sobre la fecha de la factura.

```sql
SET importecuota = TRUNCATE(NEW.totalfactura / nCuotas, decimalesMon);
SET ultimacuota  = NEW.totalfactura - importecuota * (nCuotas - 1);
...
IF isIrregular = 1 THEN
   SELECT IFNULL(pd.dias, i*30) INTO dias FROM PLAZO_DETALLES pd
    WHERE pd.plazoid = NEW.plazoid AND pd.cuota = i;
ELSE SET dias = i * 30;
END IF;
INSERT INTO CUENTAS_COBRAR(tabla,tablaid,cuota,importe,cobrado,vence)
 VALUES('VENTAS',NEW.id,i,imp,0,DATE_ADD(NEW.fechafactura,INTERVAL dias DAY));
```

### Ejemplo verificado (caso del cliente)
Total 584.226, plazo CR irregular de 3 cuotas (30/45/60 dias): el trigger genera 194.742 + 194.742 + 194.742 = 584.226 (exacto), con vencimientos a 30, 45 y 60 dias de la fecha de la factura. La eleccion "Opcion A" (division simple, sin interes, ultima cuota absorbe el redondeo) mantiene el importe parejo y la suma cuadrada.

---

## 5. Presentacion oral y argumentacion (15 pts)

Guion sugerido para la defensa (de lo general a lo concreto):
1. Problema del cliente y las 3 modalidades (criterio 1).
2. Modelo de datos: mostrar el diagrama (Azimutt) y justificar PLAZOS, PLAZO_DETALLES, VENTAS.plazoid y CUENTAS_COBRAR.
3. Demo en vivo: cargar una venta a credito irregular y mostrar como el trigger arma las cuotas.
4. Explicar el trigger paso a paso (validacion, truncado por moneda, ultima cuota, DATE_ADD).
5. Cerrar con calidad: validaciones, ABM con baja logica, diseno.

Terminologia a usar: trigger, integridad referencial, regla de negocio, clave foranea, redondeo/truncado, prototipo, requerimiento funcional vs implicito.

---

## 6. Trabajo en equipo y coordinacion (10 pts)

- Trabajo sobre repositorio Git compartido del equipo, con cambios via **fork + Pull Request** para revision (PRs #1 y #2 mergeadas por el dueno del repo).
- Division de responsabilidades: modelo de datos y trigger, interfaz, ABM/CRUD, despliegue y documentacion.
- La defensa se reparte por criterios para que todos los integrantes expongan una parte.

---

## 7. Documentacion de apoyo (5 pts)

Entregables de documentacion en el repositorio (todo en `.md` + el codigo):
- `ARQUITECTURA_GQG_System.md`: arquitectura y decisiones de diseno.
- `DESIGN.md`: lineamientos visuales (diseno Stitch).
- `INFRA.md`: infraestructura y despliegue.
- `db/01_schema.sql`, `db/02_trigger.sql`, `db/03_pruebas.sql`: esquema, trigger y casos de prueba.
- `db/azimutt_schema.sql`: esquema limpio para visualizar el diagrama ER en Azimutt.
- Este documento (respuestas por criterio).

---

## Anexo: preguntas de diseno frecuentes

**1. Para que sirve la tabla MONEDAS?**
No es decorativa: la usa el trigger. El importe de cada cuota se calcula con `TRUNCATE(total / cuotas, MONEDAS.decimales)`. Ese campo define cuanto se redondea cada cuota (Guarani=0, Dolar=2); sin la tabla habria que hardcodearlo y se romperia al facturar en otra moneda.

**2. Faltan relaciones (PRODUCTO_DETALLE y CUENTAS_COBRAR)?**
PRODUCTO_DETALLE con VENTA_DETALLES: la relacion correcta es `VENTA_DETALLES.codbarra -> PRODUCTO_DETALLE.codbarra` (una linea de venta apunta a un producto, no al reves); esa FK esta en el esquema. CUENTAS_COBRAR con PLAZO: no hace falta y es a proposito; el plazo ya esta en `VENTAS.plazoid` y la cuota es un hecho consolidado (importe + vence) una vez generada.

**3. CUENTAS_COBRAR no tiene relacion fisica con otras tablas?**
Correcto: no tiene clave foranea fisica. Su relacion es logica/polimorfica via `(tabla, tablaid)` -> apunta a VENTAS. Asi el mismo modelo sirve para ventas (cobrar) y, a futuro, compras (pagar), sin duplicar la tabla. El trade-off: la integridad de esa relacion la garantiza la aplicacion y el trigger, no una FK.

**4. El cliente no pide modulo de compras?**
Si lo menciona, pero el entregable pide ensayar el trigger "para cualquiera de los procesos (compras o ventas)". Se implemento ventas, que es valido. Compras es el espejo (COMPRAS + COMPRA_DETALLES + cuentas a pagar) reutilizando `CUENTAS_COBRAR` con `tabla='COMPRAS'`: una extension chica, no un rediseno.

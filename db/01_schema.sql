-- ============================================================================
-- GQG System - Modulo de Credito  |  schema (MariaDB 10.6+ / MySQL 8)
-- Opcion A: cuotas por division simple + ultima cuota absorbe el redondeo.
-- Corrige el script de catedra: tablas completas, VENTAS.plazoid, sin INSERTs
-- duplicados, plazo irregular unificado a 30/45/60 (el caso del cliente).
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---- Catalogos --------------------------------------------------------------

CREATE TABLE MONEDAS (
  id          INT NOT NULL,
  moneda      VARCHAR(50) NOT NULL,        -- Guarani / Dolar
  abreviatura VARCHAR(5)  NOT NULL,        -- G / $
  decimales   INT NOT NULL,                -- 0 (Gs) / 2 (USD)  -> lo usa el trigger
  activo      SMALLINT NOT NULL,
  CONSTRAINT pk_monedas PRIMARY KEY (id)
);

CREATE TABLE TIPOS_DOCUMENTO (
  id          INT NOT NULL,
  tipo        VARCHAR(200) NOT NULL,       -- Contado / Credito / Nota Credito
  abreviatura VARCHAR(5)  NOT NULL,        -- CO / CR / NC
  tipoid      INT NOT NULL,                -- 0=Contado, 1=Credito
  activo      SMALLINT NOT NULL,
  CONSTRAINT pktipodoc PRIMARY KEY (id)
);

CREATE TABLE EMPRESAS (
  id        INT NOT NULL,
  empresa   VARCHAR(200) NOT NULL,
  direccion VARCHAR(150),
  telefono  VARCHAR(15),
  mail      VARCHAR(50),
  ruc       VARCHAR(50) NOT NULL,
  monedaid  INT NOT NULL,                  -- moneda local
  CONSTRAINT pk_empresa PRIMARY KEY (id),
  CONSTRAINT fkempmon FOREIGN KEY (monedaid) REFERENCES MONEDAS(id)
);

CREATE TABLE DEPOSITOS (
  id        INT NOT NULL,
  deposito  VARCHAR(200) NOT NULL,
  direccion VARCHAR(150),
  telefono  VARCHAR(15),
  CONSTRAINT pkdeposito PRIMARY KEY (id)
);

CREATE TABLE CLIENTES (
  id           INT NOT NULL,
  nombres      VARCHAR(200),
  apellidos    VARCHAR(200),
  documentonro VARCHAR(20),                -- CI o RUC
  direccion    VARCHAR(200),
  email        VARCHAR(200),
  telefono     VARCHAR(200),
  activo       SMALLINT,
  CONSTRAINT pkcli PRIMARY KEY (id)
);

-- ---- Plazos (lo que faltaba en el script de catedra) ------------------------

-- Cabecera del plazo: modalidad + cantidad de cuotas
CREATE TABLE PLAZOS (
  id        INT NOT NULL,
  plazo     VARCHAR(100) NOT NULL,         -- 'CR-30/45/60 dias'
  tipoid    INT NOT NULL,                  -- 0=Contado, 1=Credito (coincide con TIPOS_DOCUMENTO.tipoid)
  cuotas    INT NOT NULL,                  -- cantidad de cuotas (1 si contado)
  irregular SMALLINT NOT NULL,             -- 0=regular (x30), 1=irregular (dias manuales)
  CONSTRAINT pkplazo PRIMARY KEY (id)
);

-- Detalle del plazo: SOLO irregulares. Dias de cada cuota desde la fecha factura
CREATE TABLE PLAZO_DETALLES (
  id      INT NOT NULL,
  plazoid INT NOT NULL,
  cuota   INT NOT NULL,                    -- nro de cuota (1,2,3...)
  dias    INT NOT NULL,                    -- dias desde fecha factura
  CONSTRAINT pkplazodet PRIMARY KEY (id),
  CONSTRAINT fkplazodet FOREIGN KEY (plazoid) REFERENCES PLAZOS(id)
);

-- ---- Productos --------------------------------------------------------------

CREATE TABLE PRODUCTOS (
  id       INT NOT NULL,
  producto VARCHAR(200) NOT NULL,
  iva      DECIMAL(5,2) NOT NULL,          -- 0 / 5 / 10
  servicio INT NOT NULL,                   -- 0=mercaderia, 1=servicio
  precio   DECIMAL(18,5) NOT NULL DEFAULT 0, -- precio de venta unitario (IVA incluido)
  activo   SMALLINT NOT NULL DEFAULT 1,    -- baja logica (0=desactivado)
  CONSTRAINT pkprod PRIMARY KEY (id)
);

CREATE TABLE PRODUCTO_DETALLE (
  codbarra   VARCHAR(50) NOT NULL,
  productoid INT NOT NULL,
  colorid    INT NOT NULL,
  tamanoid   INT NOT NULL,
  disenoid   INT NOT NULL,
  uxb        DECIMAL(18,5),
  CONSTRAINT pkprodet PRIMARY KEY (codbarra),
  CONSTRAINT fkprod FOREIGN KEY (productoid) REFERENCES PRODUCTOS(id)
);

-- ---- Ventas (ahora SI con plazoid) ------------------------------------------

CREATE TABLE VENTAS (
  id             INT NOT NULL,
  fechaproceso   DATETIME,
  fechafactura   DATETIME,
  clienteid      INT NOT NULL,
  serie          VARCHAR(10),              -- 001-001
  nrofactura     INT NOT NULL,
  timbrado       VARCHAR(20),
  timbrado_vence DATE,
  totalexento    DECIMAL(18,5) NOT NULL,
  totalimpuesto  DECIMAL(18,5) NOT NULL,
  totalbase      DECIMAL(18,5) NOT NULL,
  totalfactura   DECIMAL(18,5) NOT NULL,
  depositoid     INT NOT NULL,
  monedaid       INT NOT NULL,
  tipodocid      INT NOT NULL,             -- coincide tipoid con el del plazo
  plazoid        INT NOT NULL,             -- <- agregado (el trigger lo usa)
  CONSTRAINT pkventa PRIMARY KEY (id),
  CONSTRAINT fkvtacli     FOREIGN KEY (clienteid)  REFERENCES CLIENTES(id),
  CONSTRAINT fkvtadpto    FOREIGN KEY (depositoid) REFERENCES DEPOSITOS(id),
  CONSTRAINT fkvtamoneda  FOREIGN KEY (monedaid)   REFERENCES MONEDAS(id),
  CONSTRAINT fkvtatipodoc FOREIGN KEY (tipodocid)  REFERENCES TIPOS_DOCUMENTO(id),
  CONSTRAINT fkvtaplazo   FOREIGN KEY (plazoid)    REFERENCES PLAZOS(id)
);

CREATE TABLE VENTA_DETALLES (
  ventaid    INT NOT NULL,
  codbarra   VARCHAR(50) NOT NULL,
  precio     DECIMAL(18,5) NOT NULL,
  cantidad   DECIMAL(18,5) NOT NULL,
  iva        DECIMAL(5,2)  NOT NULL,
  impuesto5  DECIMAL(18,5) NOT NULL,
  impuesto10 DECIMAL(18,5) NOT NULL,
  total      DECIMAL(18,5) NOT NULL,
  CONSTRAINT pkvtadet PRIMARY KEY (ventaid, codbarra),
  CONSTRAINT fkvtadetvta  FOREIGN KEY (ventaid)  REFERENCES VENTAS(id),
  CONSTRAINT fkvtadetprod FOREIGN KEY (codbarra) REFERENCES PRODUCTO_DETALLE(codbarra)
);

-- ---- Cuentas a cobrar (lo que genera el trigger) ----------------------------
-- tabla/tablaid -> reusable para VENTAS (cobrar) y, a futuro, COMPRAS (pagar)
CREATE TABLE CUENTAS_COBRAR (
  id      INT NOT NULL AUTO_INCREMENT,
  tabla   VARCHAR(20) NOT NULL,            -- 'VENTAS'
  tablaid INT NOT NULL,                    -- id de la venta que la origino
  cuota   INT NOT NULL,
  importe DECIMAL(18,5) NOT NULL,
  cobrado DECIMAL(18,5) NOT NULL DEFAULT 0,
  vence   DATETIME NOT NULL,
  CONSTRAINT pkcc PRIMARY KEY (id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Datos base (una sola vez, sin duplicados)
-- ============================================================================

INSERT INTO MONEDAS (id, moneda, abreviatura, decimales, activo) VALUES
  (1, 'Guarani', 'G', 0, 1),
  (2, 'Dolar',   '$', 2, 1);

INSERT INTO TIPOS_DOCUMENTO (id, tipo, abreviatura, tipoid, activo) VALUES
  (1, 'Contado',      'CO', 0, 1),
  (2, 'Credito',      'CR', 1, 1),
  (3, 'Nota Credito', 'NC', 0, 1);

INSERT INTO EMPRESAS (id, empresa, direccion, telefono, mail, ruc, monedaid) VALUES
  (1, 'GQG System', 'San Lorenzo', '0961894343', 'gqgsystem@gmail.com', '1280252-1', 1);

INSERT INTO DEPOSITOS (id, deposito, direccion, telefono) VALUES
  (1, 'Casa Central', 'Asuncion', '0961548652');

INSERT INTO CLIENTES (id, nombres, apellidos, documentonro, direccion, email, telefono, activo) VALUES
  (1, 'Gregorio', 'Quintana Gonzalez', '3419776-1', 'Asuncion', 'gregorio.quintana@pol.una.py', '0961894343', 1);

-- Plazos: 1 contado, 2 credito regular (30/60/90), 3 credito irregular (30/45/60)
INSERT INTO PLAZOS (id, plazo, tipoid, cuotas, irregular) VALUES
  (1, 'CO-Contado',        0, 1, 0),
  (2, 'CR-30/60/90 dias',  1, 3, 0),
  (3, 'CR-30/45/60 dias',  1, 3, 1);

-- Detalle del plazo irregular (id 3): dias de cada cuota (caso del cliente)
INSERT INTO PLAZO_DETALLES (id, plazoid, cuota, dias) VALUES
  (1, 3, 1, 30),
  (2, 3, 2, 45),
  (3, 3, 3, 60);

-- Productos de ejemplo (del Modelo Factura), ahora con precio de venta unitario
INSERT INTO PRODUCTOS (id, producto, iva, servicio, precio) VALUES
  (1, 'Producto 1 x Unid', 5,  0, 150000),
  (2, 'Producto 2 x Unid', 0,  0,  80000),
  (3, 'Producto 3 x Unid', 10, 0, 200000),
  (4, 'Producto 4 x Unid', 10, 0, 120000);

INSERT INTO PRODUCTO_DETALLE (codbarra, productoid, colorid, tamanoid, disenoid, uxb) VALUES
  ('7841617000662', 1, 1, 1, 1, 1),
  ('7842568000312', 2, 1, 1, 1, 1),
  ('7840036106030', 3, 1, 1, 1, 1),
  ('7793742000669', 4, 1, 1, 1, 1);

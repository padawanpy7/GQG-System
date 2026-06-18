-- ============================================================================
-- GQG System - Datos de prueba: una venta por cada modalidad.
-- Al insertar cada VENTA, el trigger ins_ventas genera sus CUENTAS_COBRAR.
-- ============================================================================
-- VENTAS columnas: id, fechaproceso, fechafactura, clienteid, serie, nrofactura,
--   timbrado, timbrado_vence, totalexento, totalimpuesto, totalbase,
--   totalfactura, depositoid, monedaid, tipodocid, plazoid

-- columnas explicitas (la tabla tiene cdc al final, se deja NULL)
-- 1) CONTADO (tipodoc 1, plazo 1) -> 1 cuota, vence = fecha factura
INSERT INTO VENTAS
  (id, fechaproceso, fechafactura, clienteid, serie, nrofactura, timbrado, timbrado_vence,
   totalexento, totalimpuesto, totalbase, totalfactura, depositoid, monedaid, tipodocid, plazoid)
VALUES
  (1, NOW(), '2024-06-18', 1, '001-001', 1, '12557031', '2025-12-31',
   0, 9091, 90909, 100000, 1, 1, 1, 1);

-- 2) CREDITO REGULAR (tipodoc 2, plazo 2 = 30/60/90) -> 3 cuotas
INSERT INTO VENTAS
  (id, fechaproceso, fechafactura, clienteid, serie, nrofactura, timbrado, timbrado_vence,
   totalexento, totalimpuesto, totalbase, totalfactura, depositoid, monedaid, tipodocid, plazoid)
VALUES
  (2, NOW(), '2024-06-18', 1, '001-001', 2, '12557031', '2025-12-31',
   0, 9091, 90909, 100000, 1, 1, 2, 2);

-- 3) CREDITO IRREGULAR (tipodoc 2, plazo 3 = 30/45/60) -> caso del cliente
--    total 584.226 -> 194.742 x 3 exacto (la ultima absorbe el redondeo)
INSERT INTO VENTAS
  (id, fechaproceso, fechafactura, clienteid, serie, nrofactura, timbrado, timbrado_vence,
   totalexento, totalimpuesto, totalbase, totalfactura, depositoid, monedaid, tipodocid, plazoid)
VALUES
  (3, NOW(), '2024-06-18', 1, '001-001', 44685, '12557031', '2025-12-31',
   125000, 40554, 418672, 584226, 1, 1, 2, 3);

-- ---- Verificacion -----------------------------------------------------------
-- Las cuotas generadas por el trigger:
SELECT v.id AS venta, td.abreviatura AS tipo, p.plazo,
       CONCAT(cc.cuota, '/', p.cuotas) AS cuota,
       cc.importe, cc.cobrado, DATE(cc.vence) AS vence
FROM CUENTAS_COBRAR cc
JOIN VENTAS v  ON v.id = cc.tablaid AND cc.tabla = 'VENTAS'
JOIN PLAZOS p  ON p.id = v.plazoid
JOIN TIPOS_DOCUMENTO td ON td.id = v.tipodocid
ORDER BY v.id, cc.cuota;

-- Cuadre: la suma de cuotas debe ser igual al total de cada factura
SELECT cc.tablaid AS venta, v.totalfactura,
       SUM(cc.importe) AS suma_cuotas,
       (v.totalfactura - SUM(cc.importe)) AS diferencia
FROM CUENTAS_COBRAR cc
JOIN VENTAS v ON v.id = cc.tablaid AND cc.tabla = 'VENTAS'
GROUP BY cc.tablaid, v.totalfactura;

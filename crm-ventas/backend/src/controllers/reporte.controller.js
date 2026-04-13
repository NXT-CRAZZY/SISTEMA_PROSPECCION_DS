const pool = require('../../config/database');
const ExcelJS = require('exceljs');
const { registrarLog, TipoAccion } = require('../../services/auditoria.service');

const generarReporteSeguimiento = async (req, res) => {
    try {
        const { vendedor_id, fecha_inicio, fecha_fin, estado_id } = req.query;

        let query = `
            SELECT 
                p.numero_prospecto,
                p.nombre_contacto,
                p.empresa,
                p.ruc_dni,
                p.telefono,
                p.email,
                co.nombre as canal_origen,
                co.codigo as canal_codigo,
                u.nombre as vendedor,
                ep.nombre as estado,
                ni.nombre as nivel_interes,
                
                COUNT(ic.id) as total_intentos,
                SUM(CASE WHEN rc.contacto_exitoso = TRUE THEN 1 ELSE 0 END) as contactos_exitosos,
                
                MIN(ic.fecha_contacto) as primer_contacto,
                MAX(ic.fecha_contacto) as ultimo_contacto,
                p.fecha_proxima_accion,
                
                COUNT(DISTINCT d.id) as total_demos,
                
                COUNT(DISTINCT cot.id) as total_cotizaciones,
                COALESCE(MAX(cot.monto_final), 0) as monto_cotizado,
                
                v.numero_venta,
                COALESCE(v.monto_neto, 0) as monto_venta,
                v.fecha_venta,
                prod.nombre as producto_vendido,
                CASE v.tipo_producto WHEN 'N' THEN 'Nuevo' WHEN 'A' THEN 'Actualización' END as tipo_venta,
                
                p.observaciones_generales,
                p.fecha_registro
            FROM prospectos p
            LEFT JOIN usuarios u ON u.id = p.vendedor_id
            LEFT JOIN canales_origen co ON co.id = p.canal_origen_id
            LEFT JOIN estados_prospecto ep ON ep.id = p.estado_id
            LEFT JOIN niveles_interes ni ON ni.id = p.nivel_interes_id
            LEFT JOIN intentos_contacto ic ON ic.prospecto_id = p.id
            LEFT JOIN resultados_contacto rc ON rc.id = ic.resultado_id
            LEFT JOIN demostraciones d ON d.prospecto_id = p.id
            LEFT JOIN cotizaciones cot ON cot.prospecto_id = p.id
            LEFT JOIN ventas v ON v.prospecto_id = p.id
            LEFT JOIN productos prod ON prod.id = v.producto_id
            WHERE p.activo = TRUE
        `;

        const params = [];
        if (vendedor_id) { query += ' AND p.vendedor_id = ?'; params.push(vendedor_id); }
        if (estado_id) { query += ' AND p.estado_id = ?'; params.push(estado_id); }
        if (fecha_inicio) { query += ' AND p.fecha_registro >= ?'; params.push(fecha_inicio); }
        if (fecha_fin) { query += ' AND p.fecha_registro <= ?'; params.push(fecha_fin); }

        query += ' GROUP BY p.id ORDER BY p.fecha_ultima_actividad DESC';

        const [prospectos] = await pool.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'CRM Ventas';
        workbook.created = new Date();

        const wsReporte = workbook.addWorksheet('Reporte de Seguimiento');
        
        wsReporte.columns = [
            { header: 'N°', key: 'numero', width: 8 },
            { header: 'N° Prospecto', key: 'numero_prospecto', width: 18 },
            { header: 'Cliente', key: 'nombre_contacto', width: 25 },
            { header: 'Empresa', key: 'empresa', width: 25 },
            { header: 'RUC/DNI', key: 'ruc_dni', width: 15 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Canal', key: 'canal_origen', width: 15 },
            { header: 'Vendedor', key: 'vendedor', width: 20 },
            { header: 'Estado', key: 'estado', width: 18 },
            { header: 'Interés', key: 'nivel_interes', width: 15 },
            { header: 'Total Intentos', key: 'total_intentos', width: 15 },
            { header: 'Contactos Exitosos', key: 'contactos_exitosos', width: 18 },
            { header: 'Primer Contacto', key: 'primer_contacto', width: 15 },
            { header: 'Último Contacto', key: 'ultimo_contacto', width: 15 },
            { header: 'Próxima Acción', key: 'fecha_proxima_accion', width: 15 },
            { header: 'Total Demos', key: 'total_demos', width: 12 },
            { header: 'Total Cotiz.', key: 'total_cotizaciones', width: 14 },
            { header: 'Monto Cotizado', key: 'monto_cotizado', width: 15 },
            { header: 'N° Venta', key: 'numero_venta', width: 15 },
            { header: 'Monto Venta', key: 'monto_venta', width: 15 },
            { header: 'Fecha Venta', key: 'fecha_venta', width: 12 },
            { header: 'Producto', key: 'producto_vendido', width: 20 },
            { header: 'Tipo Venta', key: 'tipo_venta', width: 15 },
            { header: 'Observaciones', key: 'observaciones_generales', width: 40 },
            { header: 'Fecha Registro', key: 'fecha_registro', width: 15 }
        ];

        const headerRow = wsReporte.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        headerRow.height = 30;

        let contador = 1;
        prospectos.forEach(p => {
            const row = wsReporte.addRow({
                numero: contador++,
                numero_prospecto: p.numero_prospecto || '',
                nombre_contacto: p.nombre_contacto || '',
                empresa: p.empresa || '',
                ruc_dni: p.ruc_dni || '',
                telefono: p.telefono || '',
                email: p.email || '',
                canal_origen: p.canal_origen || '',
                vendedor: p.vendedor || '',
                estado: p.estado || '',
                nivel_interes: p.nivel_interes || '',
                total_intentos: p.total_intentos || 0,
                contactos_exitosos: p.contactos_exitosos || 0,
                primer_contacto: p.primer_contacto ? new Date(p.primer_contacto).toISOString().split('T')[0] : '',
                ultimo_contacto: p.ultimo_contacto ? new Date(p.ultimo_contacto).toISOString().split('T')[0] : '',
                fecha_proxima_accion: p.fecha_proxima_accion ? new Date(p.fecha_proxima_accion).toISOString().split('T')[0] : '',
                total_demos: p.total_demos || 0,
                total_cotizaciones: p.total_cotizaciones || 0,
                monto_cotizado: p.monto_cotizado || 0,
                numero_venta: p.numero_venta || '',
                monto_venta: p.monto_venta || 0,
                fecha_venta: p.fecha_venta ? new Date(p.fecha_venta).toISOString().split('T')[0] : '',
                producto_vendido: p.producto_vendido || '',
                tipo_venta: p.tipo_venta || '',
                observaciones_generales: p.observaciones_generales || '',
                fecha_registro: p.fecha_registro ? new Date(p.fecha_registro).toISOString().split('T')[0] : ''
            });

            if (p.estado === 'Venta cerrada (Ganado)') {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
            } else if (p.estado === 'No concretó (Perdido)') {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCE4D6' } };
            }
        });

        wsReporte.getColumn('monto_cotizado').numFmt = '"S/. "#,##0.00';
        wsReporte.getColumn('monto_venta').numFmt = '"S/. "#,##0.00';

        const wsResumen = workbook.addWorksheet('Resumen');

        const [[totales]] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT p.id) as total_prospectos,
                COUNT(DISTINCT v.id) as total_ventas,
                COALESCE(SUM(v.monto_neto), 0) as monto_ventas,
                COUNT(DISTINCT cot.id) as total_cotizaciones,
                COALESCE(SUM(cot.monto_final), 0) as monto_cotizaciones
            FROM prospectos p
            LEFT JOIN ventas v ON v.prospecto_id = p.id
            LEFT JOIN cotizaciones cot ON cot.prospecto_id = p.id
            WHERE p.activo = TRUE
            ${vendedor_id ? ' AND p.vendedor_id = ?' : ''}
        `, vendedor_id ? [vendedor_id] : []);

        wsResumen.columns = [{ header: 'Métrica', key: 'metrica', width: 30 }, { header: 'Valor', key: 'valor', width: 20 }];
        
        const headerResumen = wsResumen.getRow(1);
        headerResumen.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerResumen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };

        wsResumen.addRow({ metrica: 'Total de Prospectos', valor: totales.total_prospectos });
        wsResumen.addRow({ metrica: 'Total de Ventas', valor: totales.total_ventas });
        wsResumen.addRow({ metrica: 'Monto Total Ventas (S/.)', valor: totales.monto_ventas });
        wsResumen.addRow({ metrica: 'Total de Cotizaciones', valor: totales.total_cotizaciones });
        wsResumen.addRow({ metrica: 'Monto Total Cotizaciones (S/.)', valor: totales.monto_cotizaciones });
        
        const tasaConversion = totales.total_prospectos > 0 ? ((totales.total_ventas / totales.total_prospectos) * 100).toFixed(2) + '%' : '0%';
        wsResumen.addRow({ metrica: 'Tasa de Conversión (%)', valor: tasaConversion });

        const buffer = await workbook.xlsx.writeBuffer();

        const nombreArchivo = `Reporte_Seguimiento_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        await pool.execute(
            'INSERT INTO reportes_generados (usuario_id, tipo_reporte, parametros, nombre_archivo) VALUES (?, ?, ?, ?)',
            [req.user.id, 'SEGUIMIENTO', JSON.stringify({ vendedor_id, fecha_inicio, fecha_fin, estado_id }), nombreArchivo]
        );

        await registrarLog(req.user.id, 'reportes', TipoAccion.EXPORT, null, { tipo: 'SEGUIMIENTO', filtros: { vendedor_id, fecha_inicio, fecha_fin } }, req.ip);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error al generar reporte' });
    }
};

const generarReporteVentas = async (req, res) => {
    try {
        const { vendedor_id, fecha_inicio, fecha_fin, producto_id } = req.query;

        let query = `
            SELECT 
                v.numero_venta,
                v.fecha_venta,
                p.nombre_contacto,
                p.empresa,
                p.ruc_dni as ruc,
                prod.nombre as producto,
                prod.codigo as producto_codigo,
                CASE v.tipo_producto WHEN 'N' THEN 'Nuevo' WHEN 'A' THEN 'Actualización' END as tipo_cliente,
                v.monto_bruto,
                v.descuento_porcentaje,
                v.monto_descuento,
                v.monto_neto,
                v.igv,
                v.monto_total,
                tc.nombre as tipo_comprobante,
                v.numero_comprobante,
                v.pagado,
                v.fecha_pago,
                u.nombre as vendedor,
                v.observaciones
            FROM ventas v
            JOIN prospectos p ON p.id = v.prospecto_id
            JOIN productos prod ON prod.id = v.producto_id
            JOIN usuarios u ON u.id = v.vendedor_id
            JOIN tipos_comprobante tc ON tc.id = v.tipo_comprobante_id
            WHERE 1=1
        `;

        const params = [];
        if (vendedor_id) { query += ' AND v.vendedor_id = ?'; params.push(vendedor_id); }
        if (producto_id) { query += ' AND v.producto_id = ?'; params.push(producto_id); }
        if (fecha_inicio) { query += ' AND v.fecha_venta >= ?'; params.push(fecha_inicio); }
        if (fecha_fin) { query += ' AND v.fecha_venta <= ?'; params.push(fecha_fin); }

        query += ' ORDER BY v.fecha_venta DESC';

        const [ventas] = await pool.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Ventas');

        ws.columns = [
            { header: 'N° Venta', key: 'numero_venta', width: 15 },
            { header: 'Fecha', key: 'fecha_venta', width: 12 },
            { header: 'Cliente', key: 'nombre_contacto', width: 25 },
            { header: 'Empresa', key: 'empresa', width: 25 },
            { header: 'RUC', key: 'ruc', width: 15 },
            { header: 'Producto', key: 'producto', width: 20 },
            { header: 'Tipo', key: 'tipo_cliente', width: 12 },
            { header: 'Subtotal', key: 'monto_bruto', width: 12 },
            { header: 'Dscto %', key: 'descuento_porcentaje', width: 10 },
            { header: 'Dscto S/', key: 'monto_descuento', width: 12 },
            { header: 'Neto', key: 'monto_neto', width: 12 },
            { header: 'IGV', key: 'igv', width: 12 },
            { header: 'Total', key: 'monto_total', width: 12 },
            { header: 'Comprobante', key: 'tipo_comprobante', width: 15 },
            { header: 'N° Comp.', key: 'numero_comprobante', width: 15 },
            { header: 'Pagado', key: 'pagado', width: 10 },
            { header: 'Vendedor', key: 'vendedor', width: 20 },
            { header: 'Obs.', key: 'observaciones', width: 30 }
        ];

        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };

        ventas.forEach(v => {
            ws.addRow({
                ...v,
                fecha_venta: new Date(v.fecha_venta).toISOString().split('T')[0],
                monto_bruto: v.monto_bruto,
                descuento_porcentaje: v.descuento_porcentaje + '%',
                monto_descuento: v.monto_descuento,
                monto_neto: v.monto_neto,
                igv: v.igv,
                monto_total: v.monto_total,
                pagado: v.pagado ? 'Sí' : 'No'
            });
        });

        ws.getColumn('monto_bruto').numFmt = '"S/. "#,##0.00';
        ws.getColumn('monto_descuento').numFmt = '"S/. "#,##0.00';
        ws.getColumn('monto_neto').numFmt = '"S/. "#,##0.00';
        ws.getColumn('igv').numFmt = '"S/. "#,##0.00';
        ws.getColumn('monto_total').numFmt = '"S/. "#,##0.00';

        const buffer = await workbook.xlsx.writeBuffer();
        const nombreArchivo = `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`;

        await pool.execute(
            'INSERT INTO reportes_generados (usuario_id, tipo_reporte, parametros, nombre_archivo) VALUES (?, ?, ?, ?)',
            [req.user.id, 'VENTAS', JSON.stringify({ vendedor_id, fecha_inicio, fecha_fin, producto_id }), nombreArchivo]
        );

        await registrarLog(req.user.id, 'reportes', TipoAccion.EXPORT, null, { tipo: 'VENTAS', filtros: { vendedor_id, fecha_inicio, fecha_fin } }, req.ip);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error al generar reporte' });
    }
};

const getHistorialReportes = async (req, res) => {
    try {
        const [reportes] = await pool.execute(`
            SELECT r.*, u.nombre as usuario_nombre
            FROM reportes_generados r
            JOIN usuarios u ON u.id = r.usuario_id
            ORDER BY r.creado_en DESC
            LIMIT 50
        `);

        res.json({ success: true, data: reportes });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

module.exports = {
    generarReporteSeguimiento,
    generarReporteVentas,
    getHistorialReportes
};

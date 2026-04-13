require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const canalOrigenRoutes = require('./routes/canalOrigen.routes');
const canalContactoRoutes = require('./routes/canalContacto.routes');
const resultadoContactoRoutes = require('./routes/resultadoContacto.routes');
const logroContactoRoutes = require('./routes/logroContacto.routes');
const modalidadRoutes = require('./routes/modalidad.routes');
const nivelInteresRoutes = require('./routes/nivelInteres.routes');
const estadoProspectoRoutes = require('./routes/estadoProspecto.routes');
const productoRoutes = require('./routes/producto.routes');
const prospectoRoutes = require('./routes/prospecto.routes');
const intentoContactoRoutes = require('./routes/intentoContacto.routes');
const demostracionRoutes = require('./routes/demostracion.routes');
const cotizacionRoutes = require('./routes/cotizacion.routes');
const ventaRoutes = require('./routes/venta.routes');
const reporteRoutes = require('./routes/reporte.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/canales-origen', canalOrigenRoutes);
app.use('/api/canales-contacto', canalContactoRoutes);
app.use('/api/resultados-contacto', resultadoContactoRoutes);
app.use('/api/logros-contacto', logroContactoRoutes);
app.use('/api/modalidades', modalidadRoutes);
app.use('/api/niveles-interes', nivelInteresRoutes);
app.use('/api/estados-prospecto', estadoProspectoRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/prospectos', prospectoRoutes);
app.use('/api/intentos-contacto', intentoContactoRoutes);
app.use('/api/demostraciones', demostracionRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CRM Ventas API funcionando', timestamp: new Date() });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  CRM VENTAS - Backend`);
    console.log(`  Servidor corriendo en puerto ${PORT}`);
    console.log(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
});

module.exports = app;

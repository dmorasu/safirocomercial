const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const excelJS = require('exceljs');
const path = require('path');

const app = express();
const port = 4000;

app.use('/resources',express.static('public'));
app.use('/resources',express.static(__dirname + 'public'));


// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bd_inmobilariogpa'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos MySQL');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    res.render('index');
});

// Ruta para buscar clientes por cédula
app.post('/buscar', (req, res) => {
    const cedula = req.body.cedula;
    const sql = "SELECT *, DATE_FORMAT(fecha_asignacion,'%d-%b-%y') AS fecha FROM  gestion_comercial WHERE usuario_comercial = ?";
    
    db.query(sql, [cedula], (err, results) => {
        if (err) throw err;
        res.render('resultados', { clientes: results });
    });
});

// Ruta para exportar los datos a Excel
app.get('/exportar/:cedula', (req, res) => {
    const cedula = req.params.cedula;
    const sql = 'SELECT * FROM gestion_comercial WHERE usuario_comercial = ?';

    db.query(sql, [cedula], async (err, results) => {
        if (err) throw err;

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        worksheet.columns = [
            { header: 'Cédula Cliente', key: 'cedula_cliente', width: 20 },
            { header: 'Nombre Cliente', key: 'nombre_cliente', width: 30 },
            { header: 'Fecha Asignación', key: 'fecha_asignacion', width: 20 },
            { header: 'Número Caso', key: 'numero_caso', width: 20 },
            { header: 'Valor Financiado', key: 'valor_financiado', width: 15 },
            { header: 'Matrícula', key: 'matricula', width: 20 },
            { header: 'Subclasificación', key: 'subclasificacion', width: 20 },
            { header: 'Regional', key: 'regional', width: 20 },
            { header: 'Responsable', key: 'responsable', width: 30 },
            { header: 'Estado', key: 'estado', width: 20 },
            { header: 'Comercial', key: 'comercial', width: 30 },
            { header: 'Resumen Gestión', key: 'resumen_gestion', width: 40 }
        ];

        worksheet.addRows(results);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=clientes.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    });
});


app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
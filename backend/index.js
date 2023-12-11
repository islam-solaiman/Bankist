const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Update with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions)); // Enable CORS with specific options

// Middleware
app.use(bodyParser.json());

// MSSQL Configuration
const config = {
    user: 'islam',
    password: 'Ii@123456',
    server: 'bankist.database.windows.net',
    database: 'bankist',
    options: {
    encrypt: true, // For security reasons
    trustServerCertificate: false
    }
};

// Endpoint to fetch all accounts
app.get('/accounts', async (req, res) => {
    try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM accounts');
    res.json(result.recordset);
    } catch (error) {
    console.error('Error fetching accounts:', error.message);
    res.status(500).json({ error: 'Error fetching accounts' });
    }
});

// Endpoint to fetch movements of a specific account by account_id
app.get('/movements/:accountId', async (req, res) => {
    const accountId = req.params.accountId;
    try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT * FROM movements WHERE account_id = ${accountId}`);
    res.json(result.recordset);
    } catch (error) {
    console.error('Error fetching movements:', error.message);
    res.status(500).json({ error: 'Error fetching movements' });
    }
});

// Other endpoints for transfers, loans, account closure, etc.
// ...


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
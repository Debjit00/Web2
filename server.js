require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'whotfru?',
    database: 'unravel',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.message);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Sign up route
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const query = 'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())';

    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error('Error inserting user: ' + err.message);
            return res.status(500).json({ error: 'Failed to sign up' });
        }
        res.redirect('/');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error during login: ' + err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length > 0) {
            res.status(200).json({ username: results[0].username });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
module.exports = {server};

const { pvpOn, pvpOff } = require('./myModule');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('A player connected.');
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if(data.page === 'online')
            pvpOn(data, ws);
    });

    ws.on('close', () => {
        pvpOff(ws);
    });
});
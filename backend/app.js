const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', //'database_username'''
    password: 'islam', //'database_password'
    database: 'bankist_db' //'database_name'
});

connection.connect(err => {
    if (err) {
    console.error('Error connecting to database:', err);
    return;
    }
    console.log('Connected to MySQL database');
});

// Create table for accounts
const createAccountsTable = `
    CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner VARCHAR(100) NOT NULL,
    pin INT NOT NULL
    )
`;

// Create table for movements
const createMovementsTable = `
    CREATE TABLE IF NOT EXISTS movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    movement DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
`;

// Execute table creation queries
connection.query(createAccountsTable, err => {
    if (err) {
    console.error('Error creating accounts table:', err);
    return;
    }
    console.log('Accounts table created');
});

connection.query(createMovementsTable, err => {
    if (err) {
    console.error('Error creating movements table:', err);
    return;
    }
    console.log('Movements table created');
});

// Express endpoints

// Endpoint to fetch all accounts
app.get('/accounts', (req, res) => {
    connection.query('SELECT * FROM accounts', (err, results) => {
    if (err) {
        res.status(500).json({ error: 'Error fetching accounts' });
        return;
    }
    res.json(results);
    });
});

// Endpoint to fetch movements of a specific account by account_id
app.get('/movements/:accountId', (req, res) => {
    const accountId = req.params.accountId;
    connection.query('SELECT * FROM movements WHERE account_id = ?', accountId, (err, results) => {
        if (err) {
        res.status(500).json({ error: 'Error fetching movements' });
        return;
        }
        res.json(results);
    });
    });


// Express endpoint for transferring money between accounts
app.post('/transfer', (req, res) => {
    const { senderId, receiverId, amount } = req.body;

    // Fetch sender's and receiver's accounts from the database
    connection.query('SELECT * FROM accounts WHERE id = ? OR id = ?', [senderId, receiverId], (err, results) => {
        if (err) {
        res.status(500).json({ error: 'Error fetching accounts' });
        return;
        }

        if (results.length !== 2) {
        res.status(404).json({ error: 'Accounts not found' });
        return;
        }

        const sender = results.find(acc => acc.id === senderId);
        const receiver = results.find(acc => acc.id === receiverId);

        if (!sender || !receiver) {
        res.status(404).json({ error: 'Sender or receiver account not found' });
        return;
        }

        if (sender.balance < amount) {
        res.status(400).json({ error: 'Insufficient balance for transfer' });
        return;
        }

        // Begin a transaction to ensure atomicity
        connection.beginTransaction(err => {
        if (err) {
            res.status(500).json({ error: 'Transaction failed to start' });
            return;
        }

        // Update sender's balance with deducted amount
        connection.query('INSERT INTO movements (account_id, movement) VALUES (?, ?)', [senderId, -amount], (err, result) => {
            if (err) {
            return connection.rollback(() => {
                res.status(500).json({ error: 'Error updating sender\'s balance' });
            });
            }

            // Update receiver's balance with added amount
            connection.query('INSERT INTO movements (account_id, movement) VALUES (?, ?)', [receiverId, amount], (err, result) => {
            if (err) {
                return connection.rollback(() => {
                res.status(500).json({ error: 'Error updating receiver\'s balance' });
                });
            }

            // Commit the transaction if both queries are successful
            connection.commit(err => {
                if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ error: 'Transaction failed to commit' });
                });
                }

                res.status(200).json({ message: 'Transfer successful' });
            });
            });
        });
        });
    });
    });


// Express endpoint for requesting a loan
app.post('/loan', (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || !amount || amount <= 0) {
        res.status(400).json({ error: 'Invalid request data' });
        return;
    }

    connection.beginTransaction(err => {
        if (err) {
            console.error('Transaction failed to start:', err);
            res.status(500).json({ error: 'Transaction failed to start' });
            return;
        }

        connection.query('SELECT balance FROM accounts WHERE id = ?', accountId, (err, results) => {
            if (err) {
                return connection.rollback(() => {
                    console.error('Error fetching account balance:', err);
                    res.status(500).json({ error: 'Error fetching account balance' });
                });
            }

            if (results.length !== 1) {
                return connection.rollback(() => {
                    res.status(404).json({ error: 'Account not found' });
                });
            }

            const accountBalance = results[0].balance;

            if (amount > accountBalance * 0.1) {
                return connection.rollback(() => {
                    res.status(400).json({ error: 'Loan amount exceeds 10% of account balance' });
                });
            }

            const updateMovementsQuery = 'INSERT INTO movements (account_id, movement) VALUES (?, ?)';
            const updateBalanceQuery = 'UPDATE accounts SET balance = balance + ? WHERE id = ?';

            connection.query(updateMovementsQuery, [accountId, amount], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error('Error updating account balance for loan:', err);
                        res.status(500).json({ error: 'Error updating account balance for loan' });
                    });
                }

                connection.query(updateBalanceQuery, [amount, accountId], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Error updating account balance for loan:', err);
                            res.status(500).json({ error: 'Error updating account balance for loan' });
                        });
                    }

                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error('Transaction failed to commit:', err);
                                res.status(500).json({ error: 'Transaction failed to commit' });
                            });
                        }

                        res.status(200).json({ message: 'Loan request successful' });
                    });
                });
            });
        });
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

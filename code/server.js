// server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); // <-- session store
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const morgan = require('morgan');
const Cron = require('node-cron');

const userRoutes = require('../routes/approutes.js');
const { TrackerDailyEarn } = require('../controllers/logical.controllers.js');
const conn = require('../conn/dbconn.js');


dotenv.config();

const app = express();
const port = process.env.PORT ;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
    credentials: true
}));

app.use(morgan('dev'));


const sessionStore = new MySQLStore({}, conn); 

app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.Isinproduction === 'production',
        httpOnly: true,
        sameSite: process.env.Isinproduction === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 365
    }
}));


app.use('/', userRoutes);

// Start server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


Cron.schedule("0 0 * * *", async () => {
    try {
        await TrackerDailyEarn();
        console.log("Daily tracker executed successfully.");
    } catch (err) {
        console.error("Error running daily tracker:", err);
    }
}, {
    timezone: 'Africa/Kigali'
});


process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => process.exit(1));
});

module.exports = app;

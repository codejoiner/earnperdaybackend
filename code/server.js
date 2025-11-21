// server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const morgan = require('morgan');
const Cron = require('node-cron');
const helmet = require('helmet');

const userRoutes = require('../routes/approutes.js');
const { TrackerDailyEarn } = require('../controllers/logical.controllers.js');
const conn = require('../conn/dbconn.js');

dotenv.config();

const app = express();
const port = process.env.PORT 

app.set('trust proxy', 1);

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const allowedOrigins = process.env.IS_IN_PRODUCTION === 'production'
    ? ['https://earnperday.vercel.app']
    : ['http://localhost:5173'];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
    credentials: true
}));

app.use(morgan(process.env.IS_IN_PRODUCTION === 'production' ? 'combined' : 'dev'));

const sessionStore = new MySQLStore({
    checkExpirationInterval: 900000,
    expiration: 31536000000
}, conn);

app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.IS_IN_PRODUCTION === 'production', 
        httpOnly: true,
        sameSite: process.env.IS_IN_PRODUCTION === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 365
    }
}));

app.use('/', userRoutes);

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

const gracefulShutdown = async (err) => {
    console.error('Server shutting down due to error:', err);
    server.close(async () => {
        try {
            await conn.end(); 
        } catch (dbErr) {
            console.error('Error closing DB pool:', dbErr);
        }
        process.exit(1);
    });
};

process.on('uncaughtException', gracefulShutdown);
process.on('unhandledRejection', gracefulShutdown);

module.exports = app;

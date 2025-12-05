/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: [Your Name] Student ID: [Your Student ID] Date: [Submission Date]
*
********************************************************************************/

require('dotenv').config();
// For Vercel deployment
const isVercel = process.env.VERCEL === '1';
const express = require('express');
const path = require('path');
const expressHandlebars = require('express-handlebars');
const session = require('client-sessions');

// Import database connections
const { connectMongoDB } = require('./config/database');
const { connectPostgreSQL } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Import middleware
const { requireLogin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8800;

// Configure Handlebars
app.engine('.hbs', expressHandlebars.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        formatDate: function(date) {
            if (!date) return 'No date';
            return new Date(date).toLocaleDateString('en-CA');
        },
        eq: function(a, b) {
            return a === b;
        }
    }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    cookieName: 'session',
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    duration: 30 * 60 * 1000, // 30 minutes
    activeDuration: 5 * 60 * 1000, // extend session by 5 minutes on activity
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        ephemeral: true
    }
}));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/tasks', requireLogin, taskRoutes);

// Home page
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/tasks');
    } else {
        res.redirect('/login');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found'
    });
});

// Connect to databases and start server
async function startServer() {
    try {
        await connectMongoDB();
        console.log('✅ MongoDB connected successfully');
        
        await connectPostgreSQL();
        console.log('✅ PostgreSQL connected successfully');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

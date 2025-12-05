const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
        
        if (!uri) {
            console.error('❌ MONGODB_URI is not set in environment variables');
            console.log('💡 For Vercel: Add MONGODB_URI in Environment Variables');
            console.log('💡 For local: Check your .env file');
            throw new Error('MONGODB_URI is required');
        }
        
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        
        // If local development, try fallback
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️  Trying local MongoDB fallback...');
            try {
                await mongoose.connect('mongodb://localhost:27017/taskmanager', {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                console.log('✅ Connected to local MongoDB');
            } catch (error2) {
                console.error('❌ Local MongoDB also failed:', error2.message);
                throw error;
            }
        } else {
            throw error;
        }
    }
};

// PostgreSQL Connection
let sequelize = null;

const connectPostgreSQL = async () => {
    try {
        // Method 1: Use POSTGRES_URL (for Vercel/Heroku)
        if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
            const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
            console.log('🔗 Connecting with POSTGRES_URL...');
            
            sequelize = new Sequelize(connectionString, {
                logging: false,
                dialectOptions: {
                    ssl: process.env.NODE_ENV === 'production' ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false
                }
            });
        }
        // Method 2: Use individual variables (for local development)
        else if (process.env.PG_HOST) {
            console.log('🔗 Connecting with PG_* variables...');
            
            sequelize = new Sequelize(
                process.env.PG_DATABASE || 'taskmanager',
                process.env.PG_USER || 'postgres',
                process.env.PG_PASSWORD || 'postgres',
                {
                    host: process.env.PG_HOST || 'localhost',
                    port: process.env.PG_PORT || 5432,
                    dialect: 'postgres',
                    logging: false,
                    dialectOptions: process.env.NODE_ENV === 'production' ? {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        }
                    } : {}
                }
            );
        }
        // Method 3: Use SQLite for testing (no setup needed)
        else if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
            console.log('⚠️  Using SQLite for testing/development...');
            const { Sequelize: SQLiteSequelize } = require('sequelize');
            sequelize = new SQLiteSequelize({
                dialect: 'sqlite',
                storage: './database.sqlite',
                logging: false
            });
        }
        else {
            throw new Error('No PostgreSQL configuration found. Set POSTGRES_URL or PG_* variables.');
        }
        
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected successfully');
        
        return sequelize;
    } catch (error) {
        console.error('❌ PostgreSQL connection error:', error.message);
        
        // For Vercel/Production, don't try fallback
        if (process.env.NODE_ENV === 'production') {
            console.log('💡 For Vercel: Add POSTGRES_URL in Environment Variables');
            throw error;
        }
        
        // For development, try SQLite fallback
        console.log('⚠️  Trying SQLite fallback for development...');
        try {
            const { Sequelize: SQLiteSequelize } = require('sequelize');
            sequelize = new SQLiteSequelize({
                dialect: 'sqlite',
                storage: './database.sqlite',
                logging: false
            });
            
            await sequelize.authenticate();
            console.log('✅ Connected to SQLite (PostgreSQL fallback)');
            return sequelize;
        } catch (error2) {
            console.error('❌ SQLite also failed:', error2.message);
            throw error;
        }
    }
};

// Get Sequelize instance
const getSequelize = () => {
    if (!sequelize) {
        throw new Error('Sequelize not initialized. Call connectPostgreSQL() first.');
    }
    return sequelize;
};

module.exports = {
    connectMongoDB,
    connectPostgreSQL,
    getSequelize
};

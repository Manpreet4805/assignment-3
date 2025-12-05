const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');

// MongoDB Connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

// PostgreSQL Connection
let sequelize = null;

const connectPostgreSQL = async () => {
    try {
        sequelize = new Sequelize(
            process.env.PG_DATABASE,
            process.env.PG_USER,
            process.env.PG_PASSWORD,
            {
                host: process.env.PG_HOST,
                port: process.env.PG_PORT,
                dialect: 'postgres',
                logging: false,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false  // IMPORTANT for Neon.tech
                    }
                }
            }
        );
        
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected successfully');
        
        return sequelize;
    } catch (error) {
        console.error('❌ PostgreSQL connection error:', error.message);
        
        // Try without SSL as fallback
        console.log('⚠️  Trying without SSL...');
        try {
            sequelize = new Sequelize(
                process.env.PG_DATABASE,
                process.env.PG_USER,
                process.env.PG_PASSWORD,
                {
                    host: process.env.PG_HOST,
                    port: process.env.PG_PORT,
                    dialect: 'postgres',
                    logging: false
                    // No SSL
                }
            );
            
            await sequelize.authenticate();
            console.log('✅ PostgreSQL connected without SSL');
            return sequelize;
        } catch (error2) {
            console.error('❌ PostgreSQL connection failed completely:', error2.message);
            throw error2;
        }
    }
};

// Get Sequelize instance
const getSequelize = () => sequelize;

module.exports = {
    connectMongoDB,
    connectPostgreSQL,
    getSequelize
};
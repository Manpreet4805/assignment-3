// models/Task.js - Simple working version
const { Sequelize, DataTypes } = require('sequelize');

// Don't create connection here, just export model definition
module.exports = (sequelize) => {
    return sequelize.define('Task', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        dueDate: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending'
        },
        userId: DataTypes.STRING
    }, {
        timestamps: true
    });
};
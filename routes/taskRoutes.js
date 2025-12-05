const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Dashboard
router.get('/', taskController.dashboard);

// Task list
router.get('/list', taskController.listTasks);

// Add task
router.get('/add', taskController.showAddTask);
router.post('/add', taskController.addTask);

// Edit task
router.get('/edit/:id', taskController.showEditTask);
router.post('/edit/:id', taskController.updateTask);

// Delete task
router.post('/delete/:id', taskController.deleteTask);

// Update status
router.post('/status/:id', taskController.updateStatus);

module.exports = router;
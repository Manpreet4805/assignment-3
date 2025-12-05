const Task = require('../models/Task');

// Dashboard
const dashboard = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Get task statistics
        const totalTasks = await Task.count({ where: { userId } });
        const pendingTasks = await Task.count({ 
            where: { 
                userId, 
                status: 'pending' 
            } 
        });
        const completedTasks = await Task.count({ 
            where: { 
                userId, 
                status: 'completed' 
            } 
        });
        
        // Get overdue tasks
        const today = new Date().toISOString().split('T')[0];
        const overdueTasks = await Task.count({
            where: {
                userId,
                status: 'pending',
                dueDate: {
                    [Task.sequelize.Op.lt]: today
                }
            }
        });
        
        // Get recent tasks
        const recentTasks = await Task.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });
        
        res.render('tasks/dashboard', {
            title: 'Dashboard',
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
            recentTasks
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('error', {
            message: 'Failed to load dashboard'
        });
    }
};

// List all tasks
const listTasks = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { status, sort = 'dueDate' } = req.query;
        
        // Build where clause
        const where = { userId };
        if (status && ['pending', 'completed'].includes(status)) {
            where.status = status;
        }
        
        // Build order clause
        let order = [['dueDate', 'ASC']];
        if (sort === 'title') {
            order = [['title', 'ASC']];
        } else if (sort === 'createdAt') {
            order = [['createdAt', 'DESC']];
        } else if (sort === 'status') {
            order = [['status', 'ASC'], ['dueDate', 'ASC']];
        }
        
        const tasks = await Task.findAll({
            where,
            order
        });
        
        res.render('tasks/list', {
            title: 'My Tasks',
            tasks,
            statusFilter: status || 'all',
            sortBy: sort
        });
        
    } catch (error) {
        console.error('List tasks error:', error);
        res.render('error', {
            message: 'Failed to load tasks'
        });
    }
};

// Show add task form
const showAddTask = (req, res) => {
    res.render('tasks/add', {
        title: 'Add New Task',
        error: null,
        formData: {}
    });
};

// Add new task
const addTask = async (req, res) => {
    try {
        const { title, description, dueDate, status } = req.body;
        const userId = req.session.user.id;
        
        // Validation
        const errors = [];
        
        if (!title || title.trim().length < 3) {
            errors.push('Title must be at least 3 characters long');
        }
        
        if (dueDate && new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
            errors.push('Due date cannot be in the past');
        }
        
        if (errors.length > 0) {
            return res.render('tasks/add', {
                title: 'Add New Task',
                error: errors.join(', '),
                formData: { title, description, dueDate, status }
            });
        }
        
        // Create task
        const task = await Task.create({
            title: title.trim(),
            description: description?.trim(),
            dueDate: dueDate || null,
            status: status || 'pending',
            userId
        });
        
        res.redirect('/tasks');
        
    } catch (error) {
        console.error('Add task error:', error);
        res.render('tasks/add', {
            title: 'Add New Task',
            error: 'Failed to create task. Please try again.',
            formData: req.body
        });
    }
};

// Show edit task form
const showEditTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        const task = await Task.findOne({
            where: {
                id,
                userId
            }
        });
        
        if (!task) {
            return res.status(404).render('error', {
                message: 'Task not found'
            });
        }
        
        res.render('tasks/edit', {
            title: 'Edit Task',
            task: task.toJSON(),
            error: null
        });
        
    } catch (error) {
        console.error('Edit task error:', error);
        res.render('error', {
            message: 'Failed to load task'
        });
    }
};

// Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, status } = req.body;
        const userId = req.session.user.id;
        
        // Validation
        const errors = [];
        
        if (!title || title.trim().length < 3) {
            errors.push('Title must be at least 3 characters long');
        }
        
        if (dueDate && new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
            errors.push('Due date cannot be in the past');
        }
        
        if (errors.length > 0) {
            const task = await Task.findByPk(id);
            return res.render('tasks/edit', {
                title: 'Edit Task',
                task: task.toJSON(),
                error: errors.join(', ')
            });
        }
        
        // Update task
        const [updated] = await Task.update(
            {
                title: title.trim(),
                description: description?.trim(),
                dueDate: dueDate || null,
                status: status || 'pending'
            },
            {
                where: {
                    id,
                    userId
                }
            }
        );
        
        if (!updated) {
            return res.status(404).render('error', {
                message: 'Task not found or you do not have permission to edit it'
            });
        }
        
        res.redirect('/tasks');
        
    } catch (error) {
        console.error('Update task error:', error);
        res.render('error', {
            message: 'Failed to update task'
        });
    }
};

// Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        const deleted = await Task.destroy({
            where: {
                id,
                userId
            }
        });
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete task' 
        });
    }
};

// Update task status
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.session.user.id;
        
        if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }
        
        const [updated] = await Task.update(
            { status },
            {
                where: {
                    id,
                    userId
                }
            }
        );
        
        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update status' 
        });
    }
};

module.exports = {
    dashboard,
    listTasks,
    showAddTask,
    addTask,
    showEditTask,
    updateTask,
    deleteTask,
    updateStatus
};
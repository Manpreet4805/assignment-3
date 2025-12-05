/**
 * WEB322 Assignment 3 - Main JavaScript File
 * Handles client-side functionality for the Task Manager application
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Task Manager JS loaded');
    
    // Initialize all functionality
    initPasswordStrengthChecker();
    initPasswordMatchChecker();
    initTaskInteractions();
    initFormValidations();
    initResponsiveMenu();
});

/**
 * Initialize password strength checker for registration form
 */
function initPasswordStrengthChecker() {
    const passwordInput = document.getElementById('password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            displayPasswordStrength(strength);
        });
        
        // Also check on page load if there's already a value
        if (passwordInput.value) {
            const strength = checkPasswordStrength(passwordInput.value);
            displayPasswordStrength(strength);
        }
    }
}

/**
 * Check password strength and return a score (0-5)
 * @param {string} password - The password to check
 * @returns {number} Strength score from 0 to 5
 */
function checkPasswordStrength(password) {
    if (!password) return 0;
    
    let score = 0;
    
    // Length checks
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) score++;          // Uppercase letters
    if (/[a-z]/.test(password)) score++;          // Lowercase letters
    if (/[0-9]/.test(password)) score++;          // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score++;   // Special characters
    
    return Math.min(score, 5); // Cap at 5
}

/**
 * Display password strength indicator
 * @param {number} strength - Strength score from 0 to 5
 */
function displayPasswordStrength(strength) {
    const strengthLabels = [
        'Very Weak',
        'Weak', 
        'Fair',
        'Good',
        'Strong',
        'Very Strong'
    ];
    
    const strengthColors = [
        '#e74c3c', // Very Weak - Red
        '#e67e22', // Weak - Orange
        '#f1c40f', // Fair - Yellow
        '#2ecc71', // Good - Light Green
        '#27ae60', // Strong - Green
        '#1abc9c'  // Very Strong - Teal
    ];
    
    let strengthText = strengthLabels[strength];
    let color = strengthColors[strength];
    
    // Create or update the strength indicator
    let indicator = document.getElementById('password-strength');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'password-strength';
        indicator.className = 'password-strength-indicator';
        
        const passwordInput = document.getElementById('password');
        passwordInput.parentNode.appendChild(indicator);
    }
    
    // Create strength meter
    let meterHTML = `
        <div class="strength-meter">
            ${Array.from({length: 5}, (_, i) => `
                <div class="strength-bar ${i < strength ? 'active' : ''}" 
                     style="background-color: ${i < strength ? color : '#ecf0f1'}"></div>
            `).join('')}
        </div>
        <div class="strength-text" style="color: ${color}">
            <i class="fas fa-${strength >= 4 ? 'shield-alt' : 'exclamation-triangle'}"></i>
            ${strengthText}
        </div>
    `;
    
    indicator.innerHTML = meterHTML;
    
    // Add styles if not already present
    if (!document.getElementById('password-strength-styles')) {
        const style = document.createElement('style');
        style.id = 'password-strength-styles';
        style.textContent = `
            .password-strength-indicator {
                margin-top: 8px;
            }
            .strength-meter {
                display: flex;
                gap: 4px;
                margin-bottom: 4px;
            }
            .strength-bar {
                height: 6px;
                flex: 1;
                border-radius: 3px;
                transition: all 0.3s ease;
            }
            .strength-bar.active {
                transform: scaleY(1.2);
            }
            .strength-text {
                font-size: 0.9rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Initialize password match checker for registration form
 */
function initPasswordMatchChecker() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput && confirmPasswordInput) {
        const checkMatch = () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (!password || !confirmPassword) return;
            
            let indicator = document.getElementById('password-match');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'password-match';
                indicator.className = 'password-match-indicator';
                confirmPasswordInput.parentNode.appendChild(indicator);
            }
            
            if (password === confirmPassword) {
                indicator.innerHTML = `
                    <span style="color: #27ae60;">
                        <i class="fas fa-check-circle"></i> Passwords match
                    </span>
                `;
            } else {
                indicator.innerHTML = `
                    <span style="color: #e74c3c;">
                        <i class="fas fa-times-circle"></i> Passwords do not match
                    </span>
                `;
            }
        };
        
        passwordInput.addEventListener('input', checkMatch);
        confirmPasswordInput.addEventListener('input', checkMatch);
        
        // Check on page load if values exist
        if (passwordInput.value || confirmPasswordInput.value) {
            checkMatch();
        }
    }
}

/**
 * Initialize task interactions (status toggles, deletions)
 */
function initTaskInteractions() {
    // Add event listeners for task checkboxes
    document.querySelectorAll('.status-form .checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTaskStatus(this);
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('[onclick^="deleteTask"]').forEach(button => {
        // Extract task ID from onclick attribute
        const match = button.getAttribute('onclick').match(/'([^']+)'/);
        if (match) {
            const taskId = match[1];
            button.setAttribute('data-task-id', taskId);
            button.removeAttribute('onclick');
            button.addEventListener('click', () => deleteTask(taskId));
        }
    });
    
    // Add hover effects to task items
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Toggle task status between pending and completed
 * @param {HTMLElement} checkbox - The checkbox element that was clicked
 */
async function toggleTaskStatus(checkbox) {
    const form = checkbox.closest('.status-form');
    const url = form.action;
    const statusInput = form.querySelector('input[name="status"]');
    const newStatus = statusInput.value;
    
    // Show loading state
    const originalHTML = checkbox.innerHTML;
    checkbox.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    checkbox.style.pointerEvents = 'none';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update UI immediately for better UX
            const taskItem = checkbox.closest('.task-item');
            const statusBadge = taskItem.querySelector('.task-status');
            
            // Toggle status
            const currentStatus = newStatus === 'completed' ? 'pending' : 'completed';
            const nextStatus = newStatus;
            
            // Update checkbox
            checkbox.classList.toggle('completed', nextStatus === 'completed');
            checkbox.innerHTML = nextStatus === 'completed' ? '<i class="fas fa-check"></i>' : '';
            
            // Update status badge
            if (statusBadge) {
                statusBadge.textContent = nextStatus;
                statusBadge.className = `task-status ${nextStatus}`;
            }
            
            // Update task item border
            taskItem.classList.toggle('completed', nextStatus === 'completed');
            taskItem.classList.toggle('pending', nextStatus === 'pending');
            
            // Update form for next toggle
            statusInput.value = currentStatus;
            
            // Show success message
            showToast('Task status updated successfully!', 'success');
            
            // Update dashboard stats if on dashboard
            updateDashboardStats();
            
        } else {
            showToast(data.message || 'Failed to update task status', 'error');
            checkbox.innerHTML = originalHTML;
        }
        
    } catch (error) {
        console.error('Error updating task status:', error);
        showToast('An error occurred while updating the task', 'error');
        checkbox.innerHTML = originalHTML;
    } finally {
        checkbox.style.pointerEvents = 'auto';
    }
}

/**
 * Delete a task
 * @param {string} taskId - The ID of the task to delete
 */
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }
    
    const deleteButton = document.querySelector(`[data-task-id="${taskId}"]`);
    if (deleteButton) {
        deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        deleteButton.disabled = true;
    }
    
    try {
        const response = await fetch(`/tasks/delete/${taskId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove task from DOM with animation
            const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`) || 
                               deleteButton?.closest('.task-item');
            
            if (taskElement) {
                taskElement.style.opacity = '0';
                taskElement.style.transform = 'translateX(-100px)';
                taskElement.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    taskElement.remove();
                    showToast('Task deleted successfully!', 'success');
                    
                    // If no tasks left, show empty state
                    if (document.querySelectorAll('.task-item').length === 0) {
                        showEmptyState();
                    }
                    
                    // Update dashboard stats
                    updateDashboardStats();
                }, 300);
            }
        } else {
            showToast(data.message || 'Failed to delete task', 'error');
            if (deleteButton) {
                deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
                deleteButton.disabled = false;
            }
        }
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('An error occurred while deleting the task', 'error');
        if (deleteButton) {
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
            deleteButton.disabled = false;
        }
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                min-width: 300px;
                max-width: 400px;
                z-index: 9999;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .toast-success {
                border-left-color: #2ecc71;
                background: linear-gradient(to right, #d4edda, white);
            }
            .toast-error {
                border-left-color: #e74c3c;
                background: linear-gradient(to right, #f8d7da, white);
            }
            .toast-warning {
                border-left-color: #f39c12;
                background: linear-gradient(to right, #fff3cd, white);
            }
            .toast-info {
                border-left-color: #3498db;
                background: linear-gradient(to right, #d1ecf1, white);
            }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            .toast-content i {
                font-size: 1.2rem;
            }
            .toast-success .toast-content i { color: #2ecc71; }
            .toast-error .toast-content i { color: #e74c3c; }
            .toast-warning .toast-content i { color: #f39c12; }
            .toast-info .toast-content i { color: #3498db; }
            .toast-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #7f8c8d;
                font-size: 1rem;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            .toast-close:hover {
                background: rgba(0,0,0,0.1);
                color: #2c3e50;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Show empty state when no tasks are found
 */
function showEmptyState() {
    const taskListContainer = document.querySelector('.task-list');
    if (taskListContainer && !document.querySelector('.empty-state')) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-clipboard-list"></i>
            <h3>No tasks found</h3>
            <p>You don't have any tasks yet. Start by adding one!</p>
            <a href="/tasks/add" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add Your First Task
            </a>
        `;
        taskListContainer.appendChild(emptyState);
    }
}

/**
 * Update dashboard statistics (if on dashboard page)
 */
async function updateDashboardStats() {
    // Only update if we're on the dashboard
    if (!document.querySelector('.stats-grid')) return;
    
    try {
        // Show loading state
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('loading');
        });
        
        // In a real app, you would fetch updated stats from the server
        // For now, we'll just reload the page to get fresh data
        // You could implement AJAX updates here if needed
        
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

/**
 * Initialize form validations
 */
function initFormValidations() {
    // Add real-time validation for due dates
    const dueDateInputs = document.querySelectorAll('input[type="date"]');
    dueDateInputs.forEach(input => {
        input.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                this.setCustomValidity('Due date cannot be in the past');
                this.reportValidity();
            } else {
                this.setCustomValidity('');
            }
        });
    });
    
    // Add character counters for textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const maxLength = textarea.getAttribute('maxlength') || 1000;
        
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            const remaining = maxLength - currentLength;
            
            let counter = this.nextElementSibling;
            if (!counter || !counter.classList.contains('char-counter')) {
                counter = document.createElement('div');
                counter.className = 'char-counter';
                this.parentNode.appendChild(counter);
            }
            
            counter.textContent = `${remaining} characters remaining`;
            counter.style.color = remaining < 50 ? '#e74c3c' : remaining < 100 ? '#f39c12' : '#7f8c8d';
            counter.style.fontSize = '0.85rem';
            counter.style.marginTop = '4px';
        });
        
        // Trigger on page load if there's content
        if (textarea.value) {
            textarea.dispatchEvent(new Event('input'));
        }
    });
}

/**
 * Initialize responsive menu for mobile
 */
function initResponsiveMenu() {
    // Create mobile menu toggle button
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && window.innerWidth <= 768) {
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        toggleButton.className = 'mobile-menu-toggle';
        toggleButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            display: none;
        `;
        
        const navbarContainer = document.querySelector('.navbar .container');
        if (navbarContainer) {
            navbarContainer.insertBefore(toggleButton, navLinks);
        }
        
        // Add styles for mobile menu
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: block !important;
                }
                .nav-links {
                    display: none;
                    flex-direction: column;
                    width: 100%;
                    margin-top: 1rem;
                    padding: 1rem;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                }
                .nav-links.show {
                    display: flex;
                }
                .nav-links a {
                    width: 100%;
                    justify-content: center;
                    padding: 12px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Toggle menu on button click
        toggleButton.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            toggleButton.innerHTML = navLinks.classList.contains('show') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !toggleButton.contains(e.target)) {
                navLinks.classList.remove('show');
                toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

/**
 * Format date to display in a user-friendly way
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    
    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    // Otherwise, return formatted date
    return date.toLocaleDateString('en-CA', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make some functions available globally
window.toggleTaskStatus = toggleTaskStatus;
window.deleteTask = deleteTask;
window.showToast = showToast;
window.formatDate = formatDate;

console.log('All JavaScript functions initialized successfully!');
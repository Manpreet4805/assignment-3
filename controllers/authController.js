const User = require('../models/User');

// Display registration form
const showRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        error: null,
        formData: {}
    });
};

// Handle registration
const register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        
        // Validation
        const errors = [];
        
        if (!username || username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        
        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        if (errors.length > 0) {
            return res.render('auth/register', {
                title: 'Register',
                error: errors.join(', '),
                formData: { username, email }
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Username or email already exists',
                formData: { username, email }
            });
        }
        
        // Create new user
        const user = new User({
            username,
            email,
            password
        });
        
        await user.save();
        
        // Set session
        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };
        
        res.redirect('/tasks');
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Register',
            error: 'An error occurred during registration. Please try again.',
            formData: req.body
        });
    }
};

// Display login form
const showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        error: null,
        formData: {}
    });
};

// Handle login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Email and password are required',
                formData: { email }
            });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                formData: { email }
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                formData: { email }
            });
        }
        
        // Set session
        req.session.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };
        
        // Redirect to original URL or dashboard
        const returnTo = req.session.returnTo || '/tasks';
        delete req.session.returnTo;
        res.redirect(returnTo);
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occurred during login. Please try again.',
            formData: req.body
        });
    }
};

// Handle logout
const logout = (req, res) => {
    req.session.reset();
    res.redirect('/login');
};

module.exports = {
    showRegister,
    register,
    showLogin,
    login,
    logout
};
// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
};

// Middleware to redirect logged-in users away from auth pages
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/tasks');
    }
    next();
};

module.exports = {
    requireLogin,
    redirectIfLoggedIn
};
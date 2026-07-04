/**
 * RBAC Middleware - Restricts route access to specific roles.
 * Usage: router.post('/admin-action', restrictTo('admin'), handler);
 */
function restrictTo(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/user/signin');
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).render('home', {
                user: req.user,
                blogs: [],
                error: "You do not have permission to perform this action.",
            });
        }
        return next();
    };
}

/**
 * Middleware to ensure a user is logged in.
 */
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.redirect('/user/signin');
    }
    return next();
}

module.exports = {
    restrictTo,
    requireAuth,
};

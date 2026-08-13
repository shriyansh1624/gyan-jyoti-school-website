const adminOnly = (req, res, next) => {

    if (
        !req.session ||
        !req.session.admin ||
        !req.session.admin.id
    ) {
        return res.redirect('/admin/login');
    }

    if (
        req.session.admin.role !== 'admin' &&
        req.session.admin.role !== 'superadmin'
    ) {
        return res.status(403).send('Access Denied');
    }

    return next();
};

module.exports = adminOnly;
module.exports = {
    get: function(msg, $meta) {
        return this.bus.importMethod('user.permission.get')(msg, $meta);
    }
};

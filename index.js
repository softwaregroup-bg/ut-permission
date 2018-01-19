'use strict';
var utTemplate = require('ut-template');
var assign = require('lodash.assign');
var defaults = require('lodash.defaults');
var path = require('path');

module.exports = function(templates) {
    templates = assign({
        getUserPermissions: utTemplate.load(path.join(__dirname, '/ut/getUserPermissions.sql.marko'))
    }, templates || {});

    function getParams(params) {
        var config = assign({ // merge only once

        }, (this.config && this.config.permission) || {});
        var getParamsReturn = function(params) { // lazy initialization
            params.random = Math.random().toString(36).substring(5).toUpperCase();
            return defaults(params, config);
        };
        return getParamsReturn(params);
    }

    function getPermissions(session, $meta) {
        if (session && session.permissions) {
            return Promise.resolve(session.permissions);
        } else if (session) {
            return this.execTemplateRows(templates.getUserPermissions, getParams.call(this, {userId: session.userId}), true)
                .then(function(result) {
                    session.permissions = [];
                    for (var n = 0, len = result.length; n < len; n++) {
                        if (result[n].code) {
                            session.permissions.push(result[n].code);
                        }
                    }
                    return Promise.resolve(session.permissions);
                });
        } else if (!session && this.config && this.config.permission && this.config.permission.requireSession) {
            var e = new Error('There is no active session.');
            Object.assign(e, {
                code: 401,
                errorPrint: 'There is no active session.'
            });
            return Promise.reject(e);
        } else {
            return this.execTemplateRows(templates.getUserPermissions, getParams.call(this, {name: 'anonymous'}), true)
                .then(function(result) {
                    session = session || {};
                    session.permissions = [];
                    for (var n = 0, len = result.length; n < len; n++) {
                        if (result[n].code) {
                            session.permissions.push(result[n].code);
                        }
                    }
                    return Promise.resolve(session.permissions);
                });
        }
    }

    return {
        check: function(method, $meta) {
            var session = $meta.session;
            if (typeof method !== 'string') {
                method = $meta.method;
            }
            return getPermissions.call(this, session, $meta)
                .then(function(permissions) {
                    if (!method) {
                        return Promise.resolve(permissions);
                    } else if ((Array.isArray(permissions) && permissions.indexOf(method) !== -1) || method === 'permission.check') {
                        return Promise.resolve(permissions);
                    } else {
                        var e = new Error('Access is denied. You do not have permission to perform the requested operation.');
                        Object.assign(e, {
                            code: 403,
                            errorPrint: 'Access is denied. You do not have permission to perform the requested operation.',
                            permissions: permissions
                        });
                        return Promise.reject(e);
                    }
                });
        },
        getPermissions: getPermissions
    };
};

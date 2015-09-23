'use strict';
var utTemplate = require('ut-template');
var _ = require('lodash');
var when = require('when');

module.exports = function(templates) {
    templates = _.assign({
        getUserPermissions :utTemplate.load(require.resolve('./ut/getUserPermissions.sql.marko'))
    }, templates || {});

    function getParams(params) {
        var config =  _.assign({ // merge only once

        }, (this.config && this.config.identity) || {});
        getParams = function(params) { // lazy initialization
            params.random = Math.random().toString(36).substring(5).toUpperCase();
            return _.defaults(params, config);
        }
        return getParams(params);
    }

    function checkPermission(session, method){
        if(session.permissions.indexOf(method) !== -1){
            return when.resolve(session.permissions);
        } else {
            return when.reject({
                code: 403,
                message: "Access is denied. You do not have permission to perform the requested operation.",
                errorPrint: "Access is denied. You do not have permission to perform the requested operation.",
                permissions: session.permissions
            });
        }
    }

    return {
        check:function(session, method){
            if(session && session.permissions ){
                return checkPermission(session, method);
            } else if(session) {
                return this.execTemplateRows(templates.getUserPermissions, getParams.call(this, {
                        userId: session.userId
                    }), true)
                    .then(function(result){
                        session.permissions = [];
                        for(var n= 0, len = result.length; n<len;n++){
                            session.permissions.push(result[n].code);
                        }
                        return checkPermission(session, method);
                    });
            } else {
                return when.reject({
                    code: 401,
                    message: "There is no active session.",
                    errorPrint: "There is no active session."
                });
            }
        }
    };
};
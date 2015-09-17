var when = require('when');

module.exports = {
    check:function(session, method){
        if(session && session.permissions && session.permissions.indexOf && session.permissions.indexOf(method) >= 0){
            return true;
        } else {
            return when.reject({
                code: 403,
                message: "Access is denied. You do not have permission to perform the requested operation.",
                errorPrint: "Access is denied. You do not have permission to perform the requested operation."
            });
        }

    }
}

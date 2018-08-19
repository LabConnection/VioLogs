var mysql = require('mysql');
var fs = require('fs');
class MYSQLConstructor {
    constructor() {
        this._setup();
    }
    _setup() {
        var self = this;
        console.log("MYSQL ISNTANCE");
        self._connectionPool = mysql.createPool({
            host: "localhost",
            user: "root",
            password: "",
            database: "viov_test",
            multipleStatements: true
        });
        self._connectionPool.getConnection(function(err, connection) {
            connection.release();
            if (err) {
                process.exit();
            }
        });
    }
    get sessionStore() {
        return this._sessionStore;
    }
    query(sql, data) {
        var self = this;
        //console.log(self);
        return new Promise(function(fulfill, reject) {
            self._connectionPool.getConnection(function(err, connection) {
                if (err) {
                    if (connection) {
                        connection.release();
                    }
                    return reject(err);
                }
                connection.query(sql, data, function(error, results, fields) {
                    if (error) {
                        connection.release();
                        return reject(error);
                    }
                    connection.release();
                    return fulfill({
                        error: error,
                        results: results,
                        fields: fields
                    });
                });
            });
        });
    }
}
module.exports = new MYSQLConstructor();
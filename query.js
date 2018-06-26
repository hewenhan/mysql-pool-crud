module.exports = function (mysqlConfig) {
	var mysql = require('mysql');
	var pool  = mysql.createPool(mysqlConfig);
	var transAction = require ('./transAction')(mysqlConfig);

	return function (sql, callback, isStream) {
		if (typeof sql == 'object' && typeof sql.length == 'number') {
			transAction(sql, callback);
		} else {	
			pool.getConnection(function(err, connection) {
				if (err) {
					console.log(err);
				} else {
					if (sql == 'transAction') {
						connection.doneCallback = function (callback) {
							if (typeof callback !== 'function') {
								callback = function () {};
							}
							if (connection.released) {
								return;
							}
							connection.release();
							connection.released = true;
							callback();
						};
						connection.autoRollback = function (callback) {
							connection.rollback(function () {
								connection.doneCallback(callback);
								return;
							});
						};

						connection.autoCommit = function (callback) {
							connection.commit(function () {
								connection.doneCallback(callback);
								return;
							});
						};
						connection.transQuery = function (sql, callback) {
							if (typeof callback != 'function') {
								callback = function () {};
							}
							connection.query({
								sql: sql,
								timeout: 5000
							}, function (err, results) {
								if (err) {
									return connection.autoRollback(function () {
										console.log('MYSQL_ERROR: ' + new Date());
										console.log(sql);
										console.log(err);
										callback(err, results);
										return;
									});
								}
								callback(err, results, sql);
							});
							return connection;
						};
						connection.beginTransaction(function(err) {
							if (err) {
								console.log(err);
								return;
							}
							connection.released = false;
							if (typeof callback == 'function') {
								callback(connection);
							}
						});
						return;
					}
					if (isStream) {
						// callback(err, row, next, success);
						connection.query(sql).on('error', function(err) {
							console.log('MYSQL_ERROR: ' + new Date());
							console.log(sql);
							console.log(err);
							callback(err, null, sql, function(){}, false);
						}).on('fields', function(fields) {

						}).on('result', function(row) {
							connection.pause();
							callback(null, row, sql, connection.resume, false);
						}).on('end', function() {
							callback(err, null, sql, function(){}, true);
						});
						return;
					}
					connection.query(sql, function(err, results) {
						connection.release();
						if (err) {
							console.log('MYSQL_ERROR: ' + new Date());
							console.log(sql);
							console.log(err);
						}
						if (typeof callback == 'function') {
							callback(err, results, sql);
						}
					});
				}
			});
		}
	};
};

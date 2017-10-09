module.exports = function (mysqlConfig) {
	var mysql = require('mysql');
	var pool  = mysql.createPool(mysqlConfig);
	var async = require('async');
	var _ = require('lodash');

	return function (queryArr, cb) {
		if (typeof cb != 'function') {
			cb = function () {};
		}
		pool.getConnection(function (err, connection) {
			connection.beginTransaction(function(err) {  
				if (err) {
					return cb(err, null);  
				}

				var taskArr = [];
				_.each(queryArr, function(item) {
					var temp = function(callback){
						connection.query(item, function(err, result) {  
							if (err) {
								connection.rollback(function() {
									connection.release();
								});
								console.log(item);
								return cb(err, null);
							} else {
								callback(null, result);
							}
						});
					}
					taskArr.push(temp);
				});

				async.series(taskArr, function(err,result){
					if (err) {
						connection.rollback(function() { 
							connection.release();
						});
						return cb(err, null);
					} else {
						connection.commit(function(err, result) {
							if (err) {
								connection.rollback(function() {  
									connection.release();
								});
								return cb(err, null);
							}
							connection.release();
							return cb(null, result);
						});
					}
				});
			});
		});
	}
};

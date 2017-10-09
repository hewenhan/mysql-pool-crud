var mysqlConfig = {
	connectionLimit: 20,
	host: "127.0.0.1",
	port: 3306,
	user: 'hewenhan',
	password: '123456',
	database: 'uu'
};
require("./index.js")(mysqlConfig);

var selectJson = {
	tableName: "test.users"
};

select(selectJson, function (err, rows, sql) {
	if (err) {
		console.log(sql);
		console.log(err);
		return;
	}
	console.log(rows);
});

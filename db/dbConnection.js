const mysql = require("mysql");
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "librarybackend",
    port: "3306"
});
connection.connect((err) => {
    if (err) throw err;
    console.log("DB CONNECTED");
});
module.exports = connection;
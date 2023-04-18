const conn = require("../db/dbConnection");
const util = require("util");

const reader = async (req, res, next) => {
    const query = util.promisify(conn.query).bind(conn);
    const { tokens } = req.headers;
    const reader = await query("select * from users where tokens = ?", [tokens])
    if (reader[0] && reader[0].type == "0") {
        res.locals.reader = reader[0];
        next();
    }
    else {
        res.status(403).json({
            msg: "you are not authorized to access this route !",
        })
    }

}
module.exports = reader;
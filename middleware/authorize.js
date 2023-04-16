const conn = require("../db/dbConnection");
const util = require("util");

const authorized = async (req, res, next) => {
    const query = util.promisify(conn.query).bind(conn);
    const { tokens } = req.headerxs;
    const user = await query("select * from users where tokens = ?", [tokens])
    if (user[0]) {
        next();
    }
    else {
        res.status(403).json({
            msg: "you are not authorized to access this route !",
        })
    }

}
module.exports = authorized;
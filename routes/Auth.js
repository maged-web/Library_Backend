const router = require("express").Router();
const conn = require("../db/dbConnection");
const { body, validationResult } = require('express-validator');
const util = require("util");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//LOGIN
router.post(
    "/login",
    body("email").isEmail().withMessage("please enter a valid email !"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    async (req, res) => {
        try {
            //VALIDATION REQUEST
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //CHECK IF EMAIL EXISTS
            const query = util.promisify(conn.query).bind(conn); //transform query mysql -> promise to use [await/async]
            const user = await query("select * from users where email = ?", [req.body.email]);
            if (user.length == 0) {
                res.status(404).json(
                    {
                        errors: [
                            {
                                "msg": "email or password not found !",
                            }
                        ]
                    }
                )
            }
            //COMPARE HASHED PASSWORD
            const checkPassword = await bcrypt.compare(req.body.password, user[0].password);
            if (checkPassword) {
                delete user[0].password
                res.status(200).json(user[0]);
            }
            else {
                res.status(404).json(
                    {
                        errors: [
                            {
                                "msg": "email or password not found !",
                            }
                        ]
                    }
                )
            }
        } catch (err) {
            res.status(500).json({ err: err });
        }

    }

);
// REGISTRATION
router.post(
    "/register",
    body("email").isEmail().withMessage("please enter a valid email !"),
    body("name").isString().withMessage("please enter a valid name").isLength({ min: 10, max: 20 }).withMessage("name should be between (10-20) character"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    body("phone").isLength({ min: 6 }).withMessage("phone must be at least 6 chars long"),
    async (req, res) => {
        try {
            //VALIDATION REQUEST
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //CHECK IF EMAIL
            const query = util.promisify(conn.query).bind(conn); //transform query mysql -> promise to use [await/async]
            const checkEmailExists = await query("select * from users where email = ?", [req.body.email]);
            const checkPhoneExists = await query("select * from users where phone = ?", [req.body.phone]);
            if (checkEmailExists.length > 0) {
                res.status(400).json(
                    {
                        errors: [
                            {
                                "msg": "email alredy exists !"
                            }
                        ]
                    }
                )
            }
            else if (checkPhoneExists.length > 0) {
                res.status(400).json(
                    {
                        errors: [
                            {
                                "msg": "phone alredy exists !"
                            }
                        ]
                    }
                )
            }
            //PREPARE OBJECT USER TO -> SAVE
            const userData =
            {
                name: req.body.name,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 10),
                phone: req.body.phone,
                tokens: crypto.randomBytes(16).toString("hex"), //RANDOM ENCRYPTION STANDARD
            }
            //INSERT USER OBJECT INTO DB
            await query("insert into users set ? ", userData)
            delete userData.password;
            res.status(200).json(userData);
            res.json("success");

        } catch (err) {
            res.status(500).json({ err: err });
        }

    }

);


module.exports = router;
const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { body, validationResult } = require('express-validator');
const uplode = require("../middleware/uploadImages");
const { query } = require("express");
const util = require("util");
const fs = require("fs");

//ADMIN
//CREATE BOOK
router.post("",
    admin,
    uplode.single("image"),
    //uplode.single("file"),
    body("name").isString()
        .withMessage("please enter a valid movie name").
        isLength({ min: 10 }).
        withMessage("movie name should be at least 10 characters"),

    body("description").
        isString()
        .withMessage("please enter a valid description ")
        .isLength({ min: 20 })
        .withMessage("description name should be at least 20 characters"),

    body("author").
        isString()
        .withMessage("please enter a valid author ")
        .isLength({ min: 5 })
        .withMessage("author name should be at least 5 characters"),

    body("field").
        isString()
        .withMessage("please enter a valid field ")
        .isLength({ min: 5 })
        .withMessage("field name should be at least 5 characters"),

    body("puplication_date")
        .isString()
        .withMessage("please enter a valid puplication_date ")
        .isLength({ min: 5 })
        .withMessage("puplication_date should be at least 5 characters"),
    async (req, res) => {
        try {
            //VALIDATION REQUEST
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //VALIDATE THE IMAGE
            if (!req.file) {
                return res.status(400).json(
                    {
                        errors: [
                            {
                                msg: "Image is Required",
                            },
                        ],
                    },
                )
            }
            //PREPARE BOOK OBJECT
            const book =
            {
                name: req.body.name,
                description: req.body.description,
                author: req.body.author,
                field: req.body.field,
                image_url: req.file.filename,
                puplication_date: req.body.puplication_date,
            }
            //INSERT BOOK TO DB
            const query = util.promisify(conn.query).bind(conn); //transform query mysql -> promise to use [await/async]
            await query("insert into books set ? ", book);

            res.status(200).json({
                msg: "book created successfully !",
            });
        } catch (err) {
            res.status(500).json(err);
        }

    });
//UPDATE BOOK
router.put("/:id", admin,
    uplode.single("image"),
    //uplode.single("file"),
    body("name").isString()
        .withMessage("please enter a valid movie name").
        isLength({ min: 10 }).
        withMessage("movie name should be at least 10 characters"),

    body("description").
        isString()
        .withMessage("please enter a valid description ")
        .isLength({ min: 20 })
        .withMessage("description name should be at least 20 characters"),

    body("author").
        isString()
        .withMessage("please enter a valid author ")
        .isLength({ min: 5 })
        .withMessage("author name should be at least 5 characters"),

    body("field").
        isString()
        .withMessage("please enter a valid field ")
        .isLength({ min: 5 })
        .withMessage("field name should be at least 5 characters"),

    body("puplication_date")
        .isString()
        .withMessage("please enter a valid puplication_date ")
        .isLength({ min: 5 })
        .withMessage("puplication_date should be at least 5 characters"),
    async (req, res) => {
        try {
            //VALIDATION REQUEST
            const query = util.promisify(conn.query).bind(conn); //transform query mysql -> promise to use [await/async]
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //CHECK IF MOVIE EXIST
            const book = await query("select * from books where id = ?", [req.params.id]);
            if (!book[0]) {
                res.status(404).json({ msg: "book not found !" });
            }
            //PREPARE BOOK OBJECT
            const bookObj =
            {
                name: req.body.name,
                description: req.body.description,
                author: req.body.author,
                field: req.body.field,
                puplication_date: req.body.puplication_date,
            }
            if (req.file) {
                bookObj.image_url = req.file.filename;
                fs.unlinkSync("./upload/" + book[0].image_url);

            }
            //UPDATE BOOK
            await query("update books set ? where id = ?", [
                bookObj,
                book[0].id
            ])
            res.status(200).json(
                {
                    msg: "book updated succsessfully"
                }
            )
        } catch (err) {
            res.status(500).json(err);
        }

    });
//DELETE BOOK
router.delete("/:id", admin,
    async (req, res) => {
        try {
            //CHECK IF MOVIE EXIST
            const query = util.promisify(conn.query).bind(conn); //transform query mysql -> promise to use [await/async]
            const book = await query("select * from books where id = ?", [req.params.id]);
            if (!book[0]) {
                res.status(404).json({ msg: "book not found !" });
            }
            //REMOVE IMAGE
            fs.unlinkSync("./upload/" + book[0].image_url);

            //UPDATE BOOK
            await query("delete from books where id = ?", [book[0].id])
            res.status(200).json(
                {
                    msg: "book deleted succsessfully"
                }
            )
        } catch (err) {
            res.status(500).json(err);
        }

    });
//LIST FOR USER AND ADMIN
router.get("", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    let search = "";
    if (req.query.search) {
        search = `where name LIKE '%${req.query.search}%' or description LIKE '%${req.query.search}%'`
    }
    const books = await query(`select * from books ${search}`)
    books.map((book) => {
        book.image_url = "http://" + req.hostname + ":4000/" + book.image_url;
    })
    res.status(200).json(books)
})
//SHOW BOOK
router.get("/:id", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const book = await query("select * from books where id = ?", req.params.id);
    if (!book[0]) {
        res.status(404).json({ msg: "book not found !" });
    }
    book[0].image_url = "http://" + req.hostname + ":4000/" + book[0].image_url;
    res.status(200).json(book[0])
})
//USER
router.post("/request", authorized, (req, res) => {
    res.status(200).json(
        {
            msg: "book requested"
        }
    )
})
router.post('/books/:bookId/chapters', async (req, res) => {
    try {
        const bookId = req.params.bookId;
        const { title, description } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const chapter = {
            title: req.body.title,
            description: req.body.description,
            book_id: req.params.bookId
        };
        const query = util.promisify(conn.query).bind(conn)
        //const sql = 'INSERT INTO chapters SET ?';
        await query("insert into book-chapters set ? ", chapter);
        res.status(200).json({
            msg: "book created successfully !",
        });
    } catch (err) {
        console.log(err)
        res.status(500).json(err);
    }
    //connection.query(sql, [book_id, title, description], (err, result) => {
    /* if (err) console.log(err);

    res.send('Chapter created successfully'); */
});

module.exports = router;
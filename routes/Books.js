const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const reader = require("../middleware/reader");
const { body, validationResult } = require('express-validator');
const uplode = require("../middleware/uploadImages");
const { query, Router } = require("express");
const util = require("util");
const fs = require("fs");
const { title } = require("process");
const bcrypt = require("bcrypt");
const crypto = require("crypto");



//ADMIN
//1-MANAGE BOOKS
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
//LIST AND SEARCH A BOOK FOR READER AND ADMIN
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
//2-MANAGE CHAPTERS
//CREATE CHAPTER
router.post('/:book_id/chapters', admin,
    body("title").isString()
        .withMessage("please enter a valid title").
        isLength({ min: 5 }).
        withMessage("title should be at least 5 characters"),
    body("description").
        isString()
        .withMessage("please enter a valid description ")
        .isLength({ min: 7 })
        .withMessage("description name should be at least 7 characters"),

    async (req, res) => {
        try {
            /* const bookId = req.params.bookId;
            const { title, description } = req.body; */
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const chapter = {
                title: req.body.title,
                description: req.body.description,
                book_id: req.params.book_id
            };
            const query = util.promisify(conn.query).bind(conn)
            //const sql = 'INSERT INTO chapters SET ?';
            await query("insert into bookchapters set ? ", chapter);
            res.status(200).json({
                msg: "Chapter created successfully !",
            });
        } catch (err) {
            console.log(err)
            res.status(500).json(err);
        }
        //connection.query(sql, [book_id, title, description], (err, result) => {
        /* if (err) console.log(err);
    
        res.send('Chapter created successfully'); */
    });
//LIST CHAPTER
router.get('/:bookId/chapters', (req, res) => {
    const bookId = req.params.bookId;
    const query = util.promisify(conn.query).bind(conn);
    query(
        'SELECT bookchapters.id, bookchapters.title, bookchapters.description, books.name AS books_name FROM bookchapters JOIN books ON bookchapters.book_id = books.id WHERE books.id = ?',
        [bookId],
        (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error retrieving chapters');
            } else {
                res.status(200).json(results);
            }
        }
    );
});
//UPDATE CHAPTER
router.put('/:bookId/chapters/:chapterId', admin, async (req, res) => {
    const { title, description } = req.body;
    const bookId = req.params.bookId;
    const chapterId = req.params.chapterId;
    const query = util.promisify(conn.query).bind(conn)

    await query(
        'UPDATE bookchapters SET title = ?, description = ? WHERE id = ? AND book_id = ?',
        [title, description, chapterId, bookId],
        (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error updating chapter');
            } else if (results.affectedRows === 0) {
                res.status(404).send('Chapter not found for the given book');
            } else {
                res.status(200).send('Chapter updated successfully');
            }
        }
    );
});
//DELETE CHAPTER
router.delete('/:bookId/chapters/:chapterId', admin, async (req, res) => {
    const bookId = req.params.bookId;
    const chapterId = req.params.chapterId;
    const query = util.promisify(conn.query).bind(conn)
    await query(
        'DELETE FROM bookchapters WHERE id = ? AND book_id = ?',
        [chapterId, bookId],
        (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error deleting chapter');
            } else if (results.affectedRows === 0) {
                res.status(404).send('Chapter not found for the given book');
            } else {
                res.status(200).send('Chapter deleted successfully');
            }
        }
    );
});
//3- MANAGE READER
//CREATE READER
router.post('/readers', admin,
    body("email").isEmail().withMessage("please enter a valid email !"),
    body("name").isString().withMessage("please enter a valid name").isLength({ min: 5 }).withMessage("name should be between (10-20) character"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    body("phone").isLength({ min: 6 }).withMessage("phone must be at least 6 chars long"), async (req, res) => {
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
            const reader =
            {
                name: req.body.name,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 10),
                phone: req.body.phone,
                tokens: crypto.randomBytes(16).toString("hex"), //RANDOM ENCRYPTION STANDARD
            }
            //INSERT USER OBJECT INTO DB
            await query("insert into users set ? ", reader)
            delete reader.password;
            res.status(200).json(reader);
            res.json("success");

        } catch (err) {
            console.log(err)
            res.status(500).json({ err: err });
        }

    }

);
//UPDATE READER
router.put('/readers/:id', admin,
    body("email").isEmail().withMessage("please enter a valid email !"),
    body("name").isString().withMessage("please enter a valid name").isLength({ min: 5 }).withMessage("name should be between (10-20) character"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
    body("phone").isLength({ min: 6 }).withMessage("phone must be at least 6 chars long"), async (req, res) => {
        try {
            //VALIDATION REQUEST
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //CHECK IF EMAIL
            const query = util.promisify(conn.query).bind(conn);
            const reader = await query("select * from users where id = ?", [req.params.id]);
            if (!reader[0]) {
                res.status(404).json({ msg: "book not found !" });
            }
            //transform query mysql -> promise to use [await/async]
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
            const readerObj =
            {
                name: req.body.name,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 10),
                phone: req.body.phone,
                tokens: crypto.randomBytes(16).toString("hex"), //RANDOM ENCRYPTION STANDARD
            }
            //INSERT USER OBJECT INTO DB
            await query("update users set ? where id = ?", [
                readerObj,
                reader[0].id
            ])
            res.status(200).json(
                {
                    msg: "reader updated succsessfully"
                }
            )

        } catch (err) {
            console.log(err)
            res.status(500).json({ err: err });
        }

    }

);
//DELETE READER
router.delete('/readers/:readerId', admin, async (req, res) => {
    const readerId = req.params.readerId;
    const query = util.promisify(conn.query).bind(conn); //transform query mysql -> promise to use [await/async]
    /*     const reader = await query("select * from users where id = ?", [req.params.id]);
        if (!reader[0]) {
            res.status(404).json({ msg: "reader not found !" });
        } */


    await query(
        'DELETE FROM users WHERE id = ? AND type = "0"',
        [readerId],
        (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error deleting reader');
            } else if (results.affectedRows === 0) {
                res.status(404).send('Reader not found');
            } else {
                res.status(200).send('Reader deleted successfully');
            }
        }
    );
});
//LIST READERS
router.get('/readers', admin, async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    await query(
        'SELECT * FROM users WHERE type = "0"',
        (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error retrieving readers');
            } else {
                res.status(200).json(results);
            }
        }
    );
});
//SHOW A SPECEFIC BOOK
router.get("/:id", async (req, res) => {
    const query = util.promisify(conn.query).bind(conn);
    const book = await query("select * from books where id = ?", req.params.id);
    if (!book[0]) {
        res.status(404).json({ msg: "book not found !" });
    }
    book[0].image_url = "http://" + req.hostname + ":4000/" + book[0].image_url;
    res.status(200).json(book[0])
})

//READER SEND A REQUEST
router.post('/requests', reader,
    body("book_id").
        isNumeric()
        .withMessage("please enter a valid book id"),
    async (req, res) => {
        const status = 'pending';
        const query = util.promisify(conn.query).bind(conn);
        //VALIDATION REQUEST
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const book = await query("select * from books where id = ?", [req.body.book_id]);
        if (!book[0]) {
            res.status(404).json({ msg: "book not found !" });
        }
        // Insert new book request into book_request table
        await query('INSERT INTO userbookrequest (book_id, user_id, request) VALUES (?, ?, ?)',
            [book[0].id, res.locals.reader.id, status],
            (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send('Error creating book request');
                }
                return res.status(200).send('Book request created successfully');
            }
        );
    });
//LIST THE REQUEST
router.get('/requests/pending', async (req, res) => {
    // Retrieve all pending book requests
    const query = util.promisify(conn.query).bind(conn);
    await query('SELECT * FROM userbookrequest WHERE request = "pending"',
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Error retrieving book requests');
            }
            return res.status(200).json(results);
        }
    );
});
//ADMIN ACCEPT A REQUEST
router.put('/requests/:id/accepted', admin, async (req, res) => {
    const requestId = req.params.id;

    // Update book request status in book_request table
    const query = util.promisify(conn.query).bind(conn);
    await query('UPDATE userbookrequest SET request = "accepted" WHERE id = ?',
        [requestId],
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Error updating book request');
            }
            return res.status(200).send('Book request accepted successfully');
        }
    );
});
//ADMIN decline A REQUEST
router.put('/requests/:id/declined', admin, async (req, res) => {
    const requestId = req.params.id;

    // Update book request status in book_request table
    const query = util.promisify(conn.query).bind(conn);
    await query('UPDATE userbookrequest SET request = "declined" WHERE id = ?',
        [requestId],
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Error updating book request');
            }
            return res.status(200).send('Book request declined successfully');
        }
    );
});
module.exports = router;
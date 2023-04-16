//===================== INITIALIZE EXPRESS APP
const express = require("express");
const app = express();

//=====================GLOBAL MIDDLE WARE
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // TO ACCESS URL FORM ENCODED
app.use(express.static('upload'));
const cors = require("cors");
app.use(cors());  //ALLOW HTTP REQUESTS LOCAL HOSTS
//======================REQUIRED MODULE
const auth = require("./routes/Auth");
const books = require("./routes/Books");
//======================RUN THE APP
app.listen("4000", "localhost", () => {
    console.log("SERVER IS RUNNING");
})
//======================API ROUTES [END POINTS]
app.use("/auth", auth);
app.use("/books", books);


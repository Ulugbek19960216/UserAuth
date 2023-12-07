const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");


const app = express();
const port = 4000;



app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}))

app.get("/", (req, res) => {
    res.send("home");
})


app.get("/login", (req, res) => {
    res.send("login");
})


app.get("/register", (req, res) => {
    res.send("register");
})









app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


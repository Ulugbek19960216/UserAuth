const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");

const app = express();
const port = 3000;

app.set("views", path.join(__dirname, "server", "views"));


app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", 'ejs');

app.use(bodyParser.urlencoded({
    extended:true
}));

app.get('/home', (req, res) => {
    res.render("home");
});


app.get('/login', (req, res) => {
    res.render("login");
})


app.get("/register", (req, res) => {
    res.render("register");
})









app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


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










app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


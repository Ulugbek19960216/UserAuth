const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
const port = 3000;

const templatePath = path.join(__dirname, "./server/views");


app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended:true
}));

app.set("view engine", 'ejs');
app.set("views", templatePath);


// Connect to the MongoDB database using the specified URL
mongoose
  .connect("mongodb://127.0.0.1:27017/userDB")
  .then(() => {
    console.log('Mongoose connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });


const userSchema = new mongoose.Schema ({
    firstName: String,
    lastName: String,
    address: String,
    phoneNumber: String,
    email: String,
    password: String
});
const secret = "Thisishowencryptionworks";
userSchema.plugin(encrypt, { secret:secret, encryptedFields:["password"] });
// 
const User = new mongoose.model("User", userSchema);

// user registration, saving password and name on database
app.post("/register", function(req, res) {
    const newUser = new User({
        firstName: req.body.firstName,
        lastName:   req.body.lastName,
        address:    req.body.address,
        phoneNumber: req.body.phone,
        email: req.body.email,
        password: req.body.password
    });

    newUser.save() 
        .then (() => {
            res.render("home")
        }) 
        .catch(err =>  {
            console.log(err);
        })
    
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email})
        .then((foundUser) => {
            if(foundUser && foundUser.password === password) {
                res.render("home");
                console.log("successfully logged in");
            }
        })
        .catch((err) => {
            res.render("login", { error: "Incorrect password" });
        });
})



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


require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
const port = 3000;

const templatePath = path.join(__dirname, "./server/views");


app.use(express.static("public"));
app.set("view engine", 'ejs');
app.set("views", templatePath);
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret: "Master computer science.",
    resave: false,
    saveUninitialized: false
}));
// using cookies and session
app.use(passport.initialize());
app.use(passport.session());


// Connect to the MongoDB database using the specified URL
mongoose
  .connect("mongodb://127.0.0.1:27017/userDB")
  .then(() => {
    console.log("Mongoose connected successfully");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });


const userSchema = new mongoose.Schema ({
    firstName: String,
    lastName: String,
    address: String,
    phoneNumber: String,
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(findOrCreate)
 
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"]})
);

app.get("/auth/google/home", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
  });

app.get("/login", (req, res) => {
    res.render("login");
})


app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/admin", (req, res) => {
    res.render("admin_page");
})

app.get("/home", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("home");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if(err) {
            console.log(err);
        }
        res.redirect("/home");
    });
});

// user registration, saving password and name on database
app.post("/register", function(req, res) {

   User.register({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address: req.body.address,
        phoneNumber: req.body.phone,
        email: req.body.email
    }, req.body.password, function (err,user) {
    if(err) {
        console.log(err);
        res.redirect("/register");
    } else {
        passport.authenticate("local")(req, res, function() {
            res.redirect("/home");
        })
    }
   })
});
    

app.post("/login", function(req, res) {

   const user = new User({
     email: req.body.email,
     password: req.body.password
   });

   req.login(user, function(err) {
    if(err) {
        console.log(err);
    } else {
        passport.authenticate("local") (req, res, function() {
            res.redirect("/home");
        });
    }
   });
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


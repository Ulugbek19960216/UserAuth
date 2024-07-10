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
    password: String,
    googleId: String,
    googleEmail: String,
    role: {type: String, default: 'user'}
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
        picture: user.picture,
        role: user.role,
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
    User.findOrCreate(
      { googleId: profile.id, googleEmail: profile.emails[0].value },
      {role: "user"},
      function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"]})
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

app.get("/home", function(req, res) {
  if(req.isAuthenticated()) {
    console.log("User", req.user, req.user.role);
      res.render("home", {user: req.user});
      
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
        email: req.body.email,
        role: "user"
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

// checking if user is Admin

function isAdmin(req, res, next) {
  if(req.isAuthenticated() && req.user.role === "admin") {
      return next();
  }
  res.redirect("/home");
}


app.get("/admin", isAdmin, (req, res) => {
  res.render("admin");
});


// this function is manually assign the role of admin to certain users who registred by filling input fill by updating their role in the database.

User.findOneAndUpdate({ email: "alexcline@gmail.com"}, { role: "admin"}) 
  .exec()
  .then(user => {
      console.log("User via input form assigned admin role.");
  })
  .catch(err => {
    console.log(err);
  });


// this function is manually assign the role of admin to certain users who registred by their google account by updating their role in the database.

User.findOneAndUpdate({ googleEmail: "sherovulugbek04@gmail.com"}, { role: "admin"}) 
  .exec()
  .then(user => {
      console.log("Google account assigned admin role.");
  })
  .catch(err => {
    console.log(err);
  });


  app.get('/admin/users', isAdmin, async (req, res) => {
    try {
      // Fetch all users and admins from the database
      const users = await User.find({}, 'firstName lastName address phoneNumber email role');
  
      // Separate users and admins
      const allUsers = users.filter(user => user.role === 'user');
      const allAdmins = users.filter(user => user.role === 'admin');
  
      // Send the data back as a JSON response
      res.json({ allUsers, allAdmins });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


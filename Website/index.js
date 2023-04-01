const express = require("express");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.engine(".ejs", require("ejs").__express);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", __dirname + "/views");

app.use(
    session({
      store: new MemoryStore({ checkPeriod: 86400000 }),
      secret:
        "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
      resave: false,
      saveUninitialized: false,
    })
  );

app.use(express.json());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(
    express.urlencoded({
        extended: true,
    })
);

app.set("trust proxy", true);

mongoose
    .connect('mongodb://127.0.0.1:27017/AI', { //mongodb+srv://root:Fighting35a@cluster0.zz0dqtn.mongodb.net/?retryWrites=true&w=majority
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Unable to connect to MongoDB Database.\nError: " + err);
    });
mongoose.connection.on("err", (err) => {
    console.error(`Mongoose connection error: \n ${err.stack}`);
});
mongoose.connection.on("disconnected", () => {
    console.log("Mongoose connection disconnected");
});

///////////////////////////////////////////////////////////////////////////////////////////////
// API/docker
///////////////////////////////////////////////////////////////////////////////////////////////
fs.readdirSync("./API/docker").forEach((file) => {
    app.use("/api/docker", router);
    require(`./API/docker/${file}`)(router);
    console.log(`${file} loaded!`);
});

///////////////////////////////////////////////////////////////////////////////////////////////
// API
///////////////////////////////////////////////////////////////////////////////////////////////
fs.readdirSync("./API/general").forEach((file) => {
    app.use("/api/general", router);
    require(`./API/general/${file}`)(router);
    console.log(`${file} loaded!`);
});


///////////////////////////////////////////////////////////////////////////////////////////////
// Website
///////////////////////////////////////////////////////////////////////////////////////////////

const UserCheck = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

app.get("/", function (req, res) {
    res.render("index", {
    });
});

app.get("/login", function (req, res) {
    res.render("login", {
    });
});

app.get("/logout", (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    if (req.user) {
        req.user = null;
    }
    res.redirect("/");
});



app.get("/dashboard", UserCheck, function (req, res) {
    res.render("dashboard", {
        user: req.session.user,
    });
});

app.get("/dashboard/:id/ai", UserCheck, function (req, res) {
    res.render("ai", {
        user: req.session.user,
    });
});


app.get("*", function (req, res) {
    res.render("404", {
    });
});
const server = app.listen(8080, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});
require("dotenv").config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;

const { ObjectId } = require("mongodb");

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

app.use("/public", express.static("public"));

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(session({ secret: "XXXX", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const flash = require("connect-flash");

app.use(flash());

// app.get("/flash", function (req, res) {
//   console.log("d");
//   req.flash("message", "Welcome to Blog");
//   res.redirect("/display-message");
// });

// app.get("/display-message", (req, res) => {
//   res.send(req.flash("message"));
// });

var db;

MongoClient.connect(process.env.DB_URL, function (error, client) {
  if (error) {
    return console.log(error);
  }

  db = client.db("todoapp");

  app.listen(process.env.PORT, function () {
    console.log("listening");
  });
});

//// SignIn & SignUp

app.get("/login", function (req, res) {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  function (req, res) {
    res.redirect("/");
  }
);

function Login(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.render("login.ejs");
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (inputId, inputPs, done) {
      db.collection("login").findOne({ id: inputId }, function (error, result) {
        console.log(result, inputId, inputPs);
        if (error) return done(error);
        if (!result) return done(null, false, { message: "There is no ID" });
        if (inputPs == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "Wrong Password" });
        }
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (?????????, done) {
  db.collection("login").findOne({ id: ????????? }, function (??????, ??????) {
    done(null, ??????);
  });
});

app.post("/register", function (req, res) {
  db.collection("login").insertOne(
    { id: req.body.id, pw: req.body.pw },
    function (error, result) {
      res.redirect("/");
    }
  );
});

app.get("/mypage", Login, function (req, res) {
  res.render("mypage.ejs", { User: req.user });
});

///

app.get("/", Login, function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      res.render("list.ejs", { posts: result });
    });
});

app.get("/list", Login, function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      res.render("list.ejs", { posts: result });
    });
});

app.get("/write", Login, function (req, res) {
  res.render("write.ejs");
});

app.get("/detail/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (error, result) {
      console.log(result);
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (error, result) {
      if (error) {
        return console.log(error);
      }
      res.render("edit.ejs", { post: result });
    }
  );
});

app.put("/edit", function (req, res) {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    function (error, result) {
      if (error) {
        return console.log(error);
      }
      console.log("complete!");
      res.redirect("/list");
    }
  );
});

app.post("/add", function (req, res) {
  req.user._id;
  res.send("Submission Finished");
  db.collection("counter").findOne(
    { name: "the number of posts" },
    function (error, result) {
      var totalPosts = result.totalPost;
      var data = {
        _id: totalPosts + 1,
        title: req.body.title,
        date: req.body.date,
        writer: req.user._id,
      };
      db.collection("post").insertOne(data, function (error, result) {
        console.log("Finished storing");
        db.collection("counter").updateOne(
          { name: "the number of posts" },
          { $inc: { totalPost: 1 } },
          function (error, result) {
            if (error) {
              return console.log(error);
            }
          }
        );
      });
    }
  );
});

app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);

  var data = { _id: req.body._id, ?????????: req.user._id };

  db.collection("post").deleteOne(data, function (error, result) {
    if (error) {
      return console.log(error);
    }
    res.status(200).send({ message: "Success to delete" });
  });
});

app.get("/search", (req, res) => {
  var condition = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: req.query.value,
          path: "title",
        },
      },
    },
    { $sort: { _id: -1 } },
  ];
  db.collection("post")
    .aggregate(condition)
    .toArray((error, result) => {
      res.render("search.ejs", { posts: result });
    });
});

//// Chatting

app.post("/chatroom", Login, function (req, res) {
  var data = {
    title: "?????? ?????? ?????????",
    memeber: { receive: ObjectId(req.body.????????????), send: req.user._id },
    data: new Date(),
  };
  db.collection("chatroom")
    .insertOne(data)
    .then(function (result) {
      res.send("Send");
    });
});

// app.get("/chat", function (req, res) {
//   db.collection("chatroom")
//     .find({ member: req.user._id })
//     .toArray()
//     .then(function (error, result) {
//       console.log(result.length);
//       res.render("chat.ejs", { data: result });
//     });
// });

app.get("/chat", Login, function (??????, ??????) {
  db.collection("chatroom")
    .find({ title: "?????? ?????? ?????????" })
    .toArray(function (error, result) {
      console.log(??????.user._id);
      console.log(result);
      ??????.render("chat.ejs", { data: result });
    });
});

app.post("/message", Login, function (??????, ??????) {
  var ???????????? = {
    parent: ??????.body.parent,
    userid: ??????.user._id,
    content: ??????.body.content,
    date: new Date(),
  };
  db.collection("message")
    .insertOne(????????????)
    .then((??????) => {
      ??????.send(??????);
    });
});

// const changeStream = db.collection('message').watch(????????????);

// changeStream.on('change', (result) => {
//   console.log(result.fullDocument);
// });

app.get("/message/:parentid", Login, function (??????, ??????) {
  ??????.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection("message")
    .find({ parent: ??????.params.parentid })
    .toArray()
    .then((??????) => {
      console.log(??????);
      console.log("hi");
      ??????.write("event: test\n");
      ??????.write(`data: ${JSON.stringify(??????)}\n\n`);
    });

  const ???????????? = [
    { $match: { "fullDocument.parent": ??????.params.parentid } },
  ];

  const changeStream = db.collection("message").watch(????????????);
  changeStream.on("change", (result) => {
    console.log(result.fullDocument);
    var ??????????????? = [result.fullDocument];
    ??????.write(`data: ${JSON.stringify(???????????????)}\n\n`);
  });
});

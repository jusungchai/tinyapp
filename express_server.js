const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

function generateRandomString() {
  let result = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  chars += chars.toLowerCase() + "0123456789";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function emailLookUp(emailAddress) {
  let usersValueArray = Object.values(users);
  for (userValue of usersValueArray) {
    if (userValue.email === emailAddress) {
      return true;
    }
  }
  return false;
}

function passwordLookUp(emailAddress, emailPassword) {
  let usersValueArray = Object.values(users);
  for (userValue of usersValueArray) {
    if (userValue.email === emailAddress) {
      if (userValue.password === emailPassword) {
        return true;
      }
    }
  }
  return false;
}

function returnUserID(emailAddress, emailPassword) {
  let usersValueArray = Object.values(users);
  for (userValue of usersValueArray) {
    if (userValue.email === emailAddress) {
      if (userValue.password === emailPassword) {
        return userValue.id;
      }
    }
  }
  return false;
}

function urlsForUser(id) {
  let urlDatabaseForUser = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlDatabaseForUser[url] = urlDatabase[url];
    }
  }
  return urlDatabaseForUser;
}

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "asdf123" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "asdf123" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "asdf123": {
    id: "asdf123",
    email: "chunsaa@gmail.com",
    password: "123123"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let userInfo = users[req.cookies["user_id"]];
  //console.log(urlDatabase);
  //console.log(urlsForUser(userInfo.id));
  let templateVars = {
    user: userInfo,
    urls: userInfo ? urlsForUser(userInfo.id) : {}
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  }
  console.log(req.cookies);
  if (req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  console.log(users[req.cookies["user_id"]]);
  console.log(urlsForUser(req.cookies["user_id"]));
  let templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, userURL: urlsForUser(req.cookies["user_id"]) };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = { longURL: `http://${req.body.longURL}`, userID: req.cookies["user_id"] };
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send(400);
  }
});

app.post("/urls/update/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.id].userID) {
    urlDatabase[res.req.params.id].longURL = `http://${req.body.longURL}`;
    res.redirect("/urls");    
  } else {
    res.send(400);
  }
});

app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.send(403);
  } else if (!emailLookUp(req.body.email)) {
    res.send(403);
  } else if (!passwordLookUp(req.body.email, req.body.password)) {
    res.send(403);
  } else {
    let userID = returnUserID(req.body.email, req.body.password);
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: undefined
  }
  res.render("login_page", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: undefined
  }
  res.render("signup_page", templateVars);
});

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.send(400);
  } else if (emailLookUp(req.body.email)) {
    res.send(400);
  } else {
    let user = { id: userID, email: req.body.email, password: req.body.password };
    users[userID] = user;
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
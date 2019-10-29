const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ["yolo"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const getUserByEmail = require('./helpers');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcrypt');

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
      if (bcrypt.compareSync(emailPassword, userValue.password)) {
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
      if (bcrypt.compareSync(emailPassword, userValue.password)) {
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

const users = {};

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
  let userInfo = users[req.session.user_id];
  let templateVars = {
    user: userInfo,
    urls: userInfo ? urlsForUser(userInfo.id) : {}
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }  
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, userURL: urlsForUser(req.session.user_id) };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = { longURL: `http://${req.body.longURL}`, userID: req.session.user_id };
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
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
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
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
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = undefined;
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
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    let user = { id: userID, email: req.body.email, password: hashedPassword };
    users[userID] = user;
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
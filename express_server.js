const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

function generateRandomString() {
  let result = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  chars += chars.toLowerCase() + "0123456789";
  for (let i = 0; i < 6; i++){
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function emailLookUp(emailAddress){
  let usersValueArray = Object.values(users);
  for (userValue of usersValueArray){
    if (userValue.email === emailAddress){
      return true;
    }
  }
  return false;
}

function passwordLookUp(emailAddress, emailPassword){
  let usersValueArray = Object.values(users);
  for (userValue of usersValueArray){
    if (userValue.email === emailAddress){
      if (userValue.password === emailPassword){
        return true;
      }
    }
  }
  return false;
}

function returnUserID(emailAddress, emailPassword){
  let usersValueArray = Object.values(users);
  for (userValue of usersValueArray){
    if (userValue.email === emailAddress){
      if (userValue.password === emailPassword){
        return userValue.id;
      }
    }
  }
  return false;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = {
    user: userInfo,
    urls: urlDatabase
  }    
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: undefined    
  } 
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {  
  let templateVars = { user: undefined, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = `http://${req.body.longURL}`;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/update/:shortURL", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[res.req.params.id] = `http://${req.body.longURL}`;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  if (req.body.email === "" || req.body.password === ""){
    res.send(403);
  } else if (!emailLookUp(req.body.email)) {
    res.send(403);
  } else if (!passwordLookUp(req.body.email, req.body.password)){
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
  if (req.body.email === "" || req.body.password === ""){
    res.send(400);
  } else if (emailLookUp(req.body.email)) {
    res.send(400);
  } else {
    let user = {id: userID, email: req.body.email, password: req.body.password};
    users[userID] = user;
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
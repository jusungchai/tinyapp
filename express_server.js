//Declare requires
const express = require("express");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const methodOverride = require('method-override');

//Declare port for server
const PORT = 8080;

//Declare variable for express server
const app = express();

//Allow express to use api
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["yolo"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

//Allow ejs for express
app.set("view engine", "ejs");


//---------------------------------FUNCTIONS---------------------------------//
/**
 * @return [string] 6 randomly generated alphanumeric string
 **/
const generateRandomString = function() {
  let result = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  chars += chars.toLowerCase() + "0123456789";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @param  [string]  emailAddress email address to look up
 * @return [boolean] true if email is found in database
 **/
const emailLookUp = function(emailAddress) {
  let usersValueArray = Object.values(users);
  for (let userValue of usersValueArray) {
    if (userValue.email === emailAddress) {
      return true;
    }
  }
  return false;
};

/**
 * @param  [string]  emailAddress  email address to look up
 * @param  [hashed]  emailPassword hashed value of password
 * @return [boolean] true if email and password match
 **/
const passwordLookUp = function(emailAddress, emailPassword) {
  let usersValueArray = Object.values(users);
  for (let userValue of usersValueArray) {
    if (userValue.email === emailAddress) {
      if (bcrypt.compareSync(emailPassword, userValue.password)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * @param  [string] emailAddress  email address to look up
 * @param  [hashed] emailPassword hashed value of password
 * @return [string] user id
 **/
const returnUserID = function(emailAddress, emailPassword) {
  let usersValueArray = Object.values(users);
  for (let userValue of usersValueArray) {
    if (userValue.email === emailAddress) {
      if (bcrypt.compareSync(emailPassword, userValue.password)) {
        return userValue.id;
      }
    }
  }
  return false;
};

/**
 * @param  [string]  id user id to look up in database
 * @return [object]  url database that belongs to the user
 **/
const urlsForUser = function(id) {
  let urlDatabaseForUser = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlDatabaseForUser[url] = urlDatabase[url];
    }
  }
  return urlDatabaseForUser;
};
//---------------------------------FUNCTIONS---------------------------------//


//---------------------------------DATABASE----------------------------------//
//Initialize global url database
const urlDatabase = {
  //"b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "asdf123", totalCount: 0 },
  //"9sm5xK": { longURL: "http://www.google.com", userID: "asdf123", totalCount: 0 }
};

//Initialize database for user information
const users = {};
//---------------------------------DATABASE----------------------------------//


//-----------------------------------GET-------------------------------------//
app.get("/urls", (req, res) => {
  let userInfo = users[req.session.user_id];
  let templateVars = {
    user: userInfo,
    urls: userInfo ? urlsForUser(userInfo.id) : {}
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send(404, "Page Not Found");
  } else {
    let templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, userURL: urlsForUser(req.session.user_id), totalCount: urlDatabase[req.params.shortURL].totalCount, uniqueVisitorLength: urlDatabase[req.params.shortURL].uniqueVisitor.length, visitorInfo: urlDatabase[req.params.shortURL].visitorInfo };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.send(404, "Page Not Found");
  } else {
    if (req.session.user_id === undefined){
      urlDatabase[req.params.shortURL].uniqueVisitor.push("unreg user");      
      const date = new Date();
      urlDatabase[req.params.shortURL].visitorInfo.push(`Unregistered User: ${date}`);      
    } else if (urlDatabase[req.params.shortURL].uniqueVisitor.indexOf(req.session.user_id) === -1){
      urlDatabase[req.params.shortURL].uniqueVisitor.push(req.session.user_id);
      const id = req.session.user_id;
      const date = new Date();
      urlDatabase[req.params.shortURL].visitorInfo.push(`${id}: ${date}`); 
    } else {
      const id = req.session.user_id;
      const date = new Date();
      urlDatabase[req.params.shortURL].visitorInfo.push(`${id}: ${date}`); 
    }
    urlDatabase[req.params.shortURL].totalCount++;
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: undefined
  };
  res.render("login_page", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: undefined
  };
  res.render("signup_page", templateVars);
});
//-----------------------------------GET-------------------------------------//


//-----------------------------------POST------------------------------------//
app.post("/urls", (req, res) => {
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = { longURL: `http://${req.body.longURL}`, userID: req.session.user_id, totalCount: 0, uniqueVisitor: [], visitorInfo: [] };
  res.redirect("/urls");
});

app.delete("/urls/:shortURL", (req, res) => {
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
    res.send(403, "Field missing");
  } else if (!emailLookUp(req.body.email)) {
    res.send(403, "Email not registered");
  } else if (!passwordLookUp(req.body.email, req.body.password)) {
    res.send(403, "Wrong password");
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

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  if (req.body.email === "" || req.body.password === "") {
    res.send(400, "Field missing");
  } else if (emailLookUp(req.body.email)) {
    res.send(400, "Account with associated email already exists");
  } else {    
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    let user = { id: userID, email: req.body.email, password: hashedPassword };
    users[userID] = user;
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});
//-----------------------------------POST------------------------------------//


//Server Running
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
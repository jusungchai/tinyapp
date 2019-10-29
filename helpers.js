const getUserByEmail = function(email, database) {
  let user = {};
  for (let userId in database){
    if (database[userID].email === email){
      return database[userID];
    }
  }
  return user;
};

module.exports = { getUserByEmail };
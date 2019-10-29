/**
 * @param  [string] email    email address to look up
 * @param  [object] database database holding all users
 * @return [object] matching user object or undefined if email not found       
 **/
const getUserByEmail = function(email, database) {  
  for (let userID in database){
    if (database[userID].email === email){
      return userID;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail };
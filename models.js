const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


let gameSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Price: {type: String, required: true},
    ImgPath: String,
  });
  
  let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
  });

  userSchema.statics.hashPassword = (Password) => {
    return bcrypt.hashSync(Password, 10);
  };
  
  userSchema.methods.validatePassword = function(Password) {
    return bcrypt.compareSync(Password, this.Password);
  };
  

  
  let Game = mongoose.model('Game', gameSchema);
  let User = mongoose.model('User', userSchema);
  
  module.exports.Game = Game;
  module.exports.User = User;
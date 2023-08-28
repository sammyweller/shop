const mongoose = require('mongoose');


let gameSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Price: String,
    ImgPath: String,
  });
  
  let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
  });

  
  let Game = mongoose.model('Game', gameSchema);
  let User = mongoose.model('User', userSchema);
  
  module.exports.Game = Game;
  module.exports.User = User;
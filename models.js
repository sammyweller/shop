const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


let gameSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Price: {type: String, required: true},
    ImgPath: {type: String}
  });
  
  let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
  });

  let cartSchema = mongoose.Schema({
    items: [
      {
          game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
          quantity: { type: Number },
      },
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user (if logged in)
});
  

  userSchema.statics.hashPassword = (Password) => {
    return bcrypt.hashSync(Password, 10);
  };
  
  userSchema.methods.validatePassword = function(Password) {
    return bcrypt.compareSync(Password, this.Password);
  };
  
  
  let Game = mongoose.model('Game', gameSchema);
  let User = mongoose.model('User', userSchema);
  let Cart = mongoose.model('Cart', cartSchema);

  
  module.exports.Game = Game;
  module.exports.User = User;
  module.exports.Cart = Cart;

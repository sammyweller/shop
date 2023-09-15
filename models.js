const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


let gameSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Price: { type: String, required: true },
  ImgPath: { type: String }
});

let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  Played: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
});


let playedSchema = mongoose.Schema({
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

let wishlistSchema = mongoose.Schema({
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


userSchema.statics.hashPassword = (Password) => {
  return bcrypt.hashSync(Password, 10);
};

userSchema.methods.validatePassword = function (Password) {
  return bcrypt.compareSync(Password, this.Password);
};


let Game = mongoose.model('Game', gameSchema);
let User = mongoose.model('User', userSchema);
let Played = mongoose.model('Played', playedSchema);
let Wishlist = mongoose.model('Wishlist', wishlistSchema);


module.exports.Game = Game;
module.exports.User = User;
module.exports.Played = Played;
module.exports.Wishlist = Wishlist;


//Cart for all users: 

let cartSchema = mongoose.Schema({
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
});

let Cart = mongoose.model('Cart', cartSchema);

module.exports.Cart = Cart;
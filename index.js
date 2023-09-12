const mongoose = require('mongoose');
const Models = require('./models.js');

const Games = Models.Game;
const Users = Models.User;
const Cart = Models.Cart;

//allows Mongoose to connect to that database so it can perform CRUD operations: 
//mongoose.connect('mongodb://localhost:27017/shopDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });



const express = require('express'); //imports the express module locally so it can be used within the file
morgan = require('morgan');
bodyParser = require('body-parser'),
    uuid = require('uuid');
const { check, validationResult } = require('express-validator');



const app = express(); //declares a variable that encapsulates Express’s functionality to configure your web server


//Allow requests from certain domains:
const cors = require('cors');

app.use(cors({
    origin: '*'
}));

/*
const cors = require('cors');

let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'http://testsite.com', 'https://cozy-shopper-24251c3233dc.herokuapp.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));
*/


app.use(morgan('common')); //logging - middleware for Express with common format
app.use(express.static('public'));
app.use(bodyParser.json()); //data will be expected to be in JSON format (and read as such).



let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');




// Endpoints

//homepage - works in postman
app.get('/', (req, res) => {
    res.send('Welcome to the Cozy Shopper!');
});


// Get list of all games - works in postman
app.get('/games', async (req, res) => {
    await Games.find()
        .then((games) => {
            res.status(201).json(games);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Get list of single game by title - works in postman
app.get('/games/:Title', async (req, res) => {
    await Games.findOne({ Title: req.params.Title })
        .then((game) => {
            res.json(game);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});



// Get all users - works in postman 
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


// Get a user by username - works in post
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


//Add a user - works in postman
app.post('/users',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ],
    async (req, res) => {

        // check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }


        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + 'already exists');
                } else {
                    Users
                        .create({
                            Username: req.body.Username,
                            Password: hashedPassword,
                            Email: req.body.Email,
                        })
                        .then((user) => { res.status(201).json(user) })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        })
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

// Delete a user by username - works in postman
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


// Update a user's info, by username - works in postman
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ],
    async (req, res) => {
        let errors = validationResult(req);
        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email
            }
        },
            { new: true }) // This line makes sure that the updated document is returned
            .then((user) => {
                if (!user) {
                    return res.status(404).send('Error: No user was found');
                } else {
                    res.json(user);
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });



/*
// Add game to cart - works in postman
app.post('/users/:Username/games/:GameID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate(
        { Username: req.params.Username }, 
        { $push: { Cart: req.params.GameID } },
        { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});



// Remove game from user's cart - works in postman
app.delete('/users/:Username/games/:GameID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate(
        { Username: req.params.Username },
        { $pull: { Cart: req.params.GameID } },
        { new: true }
    )
    .then((updatedUser) => {
        res.json(updatedUser);
      })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
*/


//Create a new anonymous cart when a user adds an item to the cart - works in postman
app.post('/cart/add/:GameID', async (req, res) => {
    const gameID = req.params.GameID;
    const sessionID = req.sessionID; // session ID for anonymous users

    // Find or create the cart for the anonymous user
    let cart = await Cart.findOne({ anonymousUser: sessionID });

    if (!cart) {
        cart = new Cart({ anonymousUser: sessionID });
    }

    cart.items.push({ game: gameID });

    await cart.save();

    res.json(cart);
});


// Get cart - works in postman
app.get('/cart', async (req, res) => {
    const sessionID = req.sessionID; // Use the same identifier for anonymous users

    // Find the cart for the anonymous user
    const cart = await Cart.findOne({ anonymousUser: sessionID }).populate('items.game');

    if (!cart) {
        return res.status(404).send('Cart not found');
    }
    res.json(cart);
});



//Merge the anonymous cart with the user's cart when they log in or create an account 
app.post('/users/:Username/merge-cart', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const username = req.params.Username;
    const sessionID = req.sessionID; // Use the session ID of the anonymous user

    // Find the user
    const user = await Users.findOne({ Username: username });

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Find the carts for the user and the anonymous user
    const userCart = await Cart.findOne({ user: user._id });
    const anonymousCart = await Cart.findOne({ anonymousUser: sessionID });

    if (!anonymousCart) {
        return res.status(404).send('Anonymous cart not found');
    }

    // Merge the items from the anonymous cart into the user's cart
    userCart.items.push(...anonymousCart.items);

    // Remove the anonymous cart
    await anonymousCart.remove();

    await userCart.save();

    res.json(userCart);
});


// Remove a Game from Cart
app.delete('/cart/remove/:GameID', async (req, res) => {
    const gameID = req.params.GameID;
    const sessionID = req.sessionID; // Use the same identifier for anonymous users

    // Find the cart for the anonymous user
    const cart = await Cart.findOne({ anonymousUser: sessionID });

    if (!cart) {
        return res.status(404).send('Cart not found');
    }

    // Remove the game from the cart
    cart.items = cart.items.filter((item) => item.game.toString() !== gameID);

    await cart.save();

    res.json(cart);
});





//error-handling:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});
const mongoose = require('mongoose');
const Models = require('./models.js');

const Games = Models.Game;
const Users = Models.User;
const Cart = Models.Cart;

//allows Mongoose to connect to that database so it can perform CRUD operations: 
// mongoose.connect('mongodb://localhost:27017/shopDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });



const express = require('express'); //imports the express module locally so it can be used within the file
const cookieParser = require('cookie-parser'); // Import cookie-parser
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
app.use(cookieParser());




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





// CREATE: Allow users to add a game to wishlist
app.post('/users/:Username/wishlist/:gameId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $push: { Wishlist: req.params.gameId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        return res.json(updatedUser);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error: ' + err);
    }
});

// DELETE: Allow users to remove a game from wishlist
app.delete('/users/:Username/wishlist/:gameId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $pull: { Wishlist: req.params.gameId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        return res.json(updatedUser);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error: ' + err);
    }
});




//add to played
app.post('/users/:Username/played/:gameId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const game = await Games.findOne({ _id: req.params.gameId });

        if (!game) {
            return res.status(404).send('Game not found');
        }

        const isInWishlist = user.Wishlist.some(item => item.equals(game._id));

        if (isInWishlist) {
            user.Wishlist = user.Wishlist.filter(item => !item.equals(game._id));
        }

        user.Played.push(game._id);
        await user.save();

        return res.status(201).json(user.Played);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error: ' + error);
    }
});



// Remove a game from the user's played list
app.delete('/users/:Username/played/:gameId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const game = await Games.findOne({ _id: req.params.gameId });

        if (!game) {
            return res.status(404).send('Game not found');
        }

        const isInPlayed = user.Played.some(item => item.equals(game._id));

        if (!isInPlayed) {
            return res.status(400).send('Game is not in the played list');
        }

        user.Played = user.Played.filter(item => !item.equals(game._id));
        await user.save();

        return res.status(200).json(user.Played);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error: ' + error);
    }
});


// Add a game to the cart
app.post('/cart/:gameId', async (req, res) => {
    try {
        const game = await Games.findOne({ _id: req.params.gameId });

        if (!game) {
            return res.status(404).send('Game not found');
        }

        const cart = req.cookies.cart || [];

        const isInCart = cart.includes(req.params.gameId); 
        if (isInCart) {
            return res.status(400).send('Game is already in the cart');
        }

        cart.push(req.params.gameId);

        res.cookie('cart', cart);

        return res.status(201).json(cart);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error: ' + error);
    }
});


// Remove a game from the cart
app.delete('/cart/:gameId', async (req, res) => {
    try {
        let cart = req.cookies.cart || [];

        const gameIdToRemove = req.params.gameId;

        const indexOfGameToRemove = cart.indexOf(gameIdToRemove);

        if (indexOfGameToRemove === -1) {
            return res.status(404).send('Game is not in the cart');
        }

        cart.splice(indexOfGameToRemove, 1);

        res.cookie('cart', cart);

        return res.status(200).json(cart);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error: ' + error);
    }
});

// Get the contents of the cart
app.get('/cart', async (req, res) => {
    try {
        const cart = req.cookies.cart || [];


        const gameDetails = [];

        for (const gameId of cart) {
            const game = await Games.findOne({ _id: gameId });
            if (game) {
                gameDetails.push(game);
            }
        }

        return res.status(200).json(gameDetails);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error: ' + error);
    }
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
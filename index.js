const mongoose = require('mongoose');
const Models = require('./models.js');

const Games = Models.Game;
const Users = Models.User;

//allows Mongoose to connect to that database so it can perform CRUD operations: 
mongoose.connect('mongodb://localhost:27017/shopDB', { useNewUrlParser: true, useUnifiedTopology: true });


const express = require('express'); //imports the express module locally so it can be used within the file
morgan = require('morgan');
bodyParser = require('body-parser'),
    uuid = require('uuid');


const app = express(); //declares a variable that encapsulates Express’s functionality to configure your web server

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


// Get a user by username - works in postman
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
app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: req.body.Password,
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
app.put('/users/:Username',  passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Condition to make sure user can't edit other user's info
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    // Condition ends
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email
        }
    },
        { new: true }) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send('Error: ' + err);
        })
});



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
        res.status(200).send(
          'The game with ID ' +
            req.params.GameID +
            ' was successfully deleted from the cart. ' +
            'Cart of ' +
            updatedUser.Username +
            ': ' +
            updatedUser.Cart
        );
      })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});


//error-handling:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


// listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
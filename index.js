const express = require('express'); // import Express package
const morgan = require('morgan');
const fs = require('fs'); // import built in node modules fs and path 
const path = require('path');

const app = express();
// create a write stream (in append mode - a ‘log.txt’ file is created in root directory:
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})


app.use(morgan('combined', {stream: accessLogStream})); // setup the logger



let users = [
    {
      username: "sammyweller",
      password: "password1",
      email: "",
      cart: "Animal Crossing"
    },
  
    {
      username: "johnsmith",
      password: "password2",
      email: "",
      cart: "Cozy Grove"
    },
  
    {
      username: "janedoe",
      password: "password3",
      email: "",
      cart: "A Short Hike"
    }

  ]

let games = [
  {
    title: 'Animal Crossing',
    price: '$59.99'
  },
  {
    title: 'Cozy Grove',
    price: '$29.99'
  },
  {
    title: 'A Short Hike',
    price: '$29.99'
  }
];


  /* automatically routes all requests for static files to their 
  corresponding files within a certain folder on the server: */
  app.use(express.static('public')); 


// Endpoints

app.get('/', (req, res) => {
  res.send('Welcome to the Cozy Shopper!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/games', (req, res) => {
  res.json(games);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });


// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
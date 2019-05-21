const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan');
const reachableCells = require('./reachable-cells');
const game = require('./game');

const app = express();
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler,
} = require('./handlers.js');

app.set('port', process.env.PORT || 9001);

app.enable('verbose errors');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(poweredByHandler);

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  game.start().then(data => {
    response.json(data);
  });
});

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  game.move(request.body).then(data => {
    response.json(data);
  });
});

app.post('/end', (request, response) => {
  game.start().then(data => {
    response.json(data);
  });
});

app.post('/ping', (request, response) => response.json({}));

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'));
});

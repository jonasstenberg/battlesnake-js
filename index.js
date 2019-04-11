const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan');

const app = express();
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler,
} = require('./handlers.js');

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001));

app.enable('verbose errors');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(poweredByHandler);

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

const validDirections = ['up', 'down', 'left', 'right'];
const coordinates = [
  {
    x: 0,
    y: -1,
    name: 'up',
  },
  {
    x: 0,
    y: 1,
    name: 'down',
  },
  {
    x: -1,
    y: 0,
    name: 'left',
  },
  {
    x: 1,
    y: 0,
    name: 'right',
  },
];

const distance = (x1, y1, x2, y2) => Math.sqrt(((x1 - x2) ** 2) + ((y1 - y2) ** 2));

const isWall = (board, testPosition) => (testPosition.x < 0
  || testPosition.y < 0
  || testPosition.x >= board.width
  || testPosition.y >= board.height);

const isSnake = (snakes, testPosition) => snakes
  .map(snake => snake.body)
  .reduce((a, b) => a.concat(b), [])
  .find(snake => snake.x === testPosition.x && snake.y === testPosition.y);

const isEnemySnakeHead = (snakes, you, testPosition) => {
  if (snakes.length === 1) {
    return false;
  }

  const enemySnakes = snakes.filter(snake => snake.id !== you.id);

  return enemySnakes
    .map(snake => snake.body[0])
    .find(snakeHead => distance(snakeHead.x, snakeHead.y, testPosition.x, testPosition.y) === 1);
};

const reachableCells = (board, testPosition) => {
  const grid = new Array(board.width);
  for (let x = 0; x < grid.length; x += 1) {
    grid[x] = new Array(board.height);

    for (let y = 0; y < grid[x].length; y += 1) {
      grid[x][y] = {
        visited: false,
        obstacle: false,
      };
    }
  }

  board.snakes
    .map(snake => snake.body)
    .reduce((a, b) => a.concat(b), [])
    .forEach((snake) => {
      grid[snake.x][snake.y].obstacle = true;
    });

  const recursive = (cell) => {
    if (isWall(board, cell)) {
      return 0;
    }

    const gridCell = grid[cell.x][cell.y];
    if (gridCell.visited || gridCell.obstacle) {
      return 0;
    }

    let numVisited = 1;
    gridCell.visited = true;

    numVisited += recursive({ x: cell.x, y: cell.y - 1 });
    numVisited += recursive({ x: cell.x, y: cell.y + 1 });
    numVisited += recursive({ x: cell.x - 1, y: cell.y });
    numVisited += recursive({ x: cell.x + 1, y: cell.y });

    return numVisited;
  };

  const numVisited = recursive(testPosition);

  // for (let x = 0; x < grid.length; x += 1) {
  //   let s = '';
  //   for (let y = 0; y < grid[x].length; y += 1) {
  //     const gridCell = grid[x][y];
  //
  //     if (gridCell.obstacle) {
  //       s += 'X';
  //       continue;
  //     }
  //     if (gridCell.visited) {
  //       s += 'O';
  //       continue;
  //     }
  //     s += '.';
  //   }
  //   console.log(s);
  // }

  return numVisited;
};

const foodScore = (board, testPosition) => board.food
  .map(food => distance(food.x, food.y, testPosition.x, testPosition.y))
  .map(d => distance(0, 0, board.width, board.height) - d)
  .sort((o1, o2) => o2 - o1);

const calculateDirectionScore = (body) => {
  const scores = coordinates.map((direction) => {
    const currentPosition = body.you.body[0];
    const testPosition = {
      x: direction.x + currentPosition.x,
      y: direction.y + currentPosition.y,
    };

    const result = {
      name: direction.name,
      numVisited: 0,
    };

    if (isWall(body.board, testPosition)) {
      return Object.assign({}, result, {
        score: 0,
      });
    }

    if (isSnake(body.board.snakes, testPosition)) {
      return Object.assign({}, result, {
        score: 0,
      });
    }

    if (isEnemySnakeHead(body.board.snakes, body.you, testPosition)) {
      return Object.assign({}, result, {
        score: 1,
      });
    }

    const fs = foodScore(body.board, testPosition);
    const numVisited = reachableCells(body.board, testPosition);

    return Object.assign({}, result, {
      score: fs[0],
      numVisited,
    });
  });

  if (scores.every(score => scores[0].numVisited === score.numVisited)) {
    return scores;
  }

  return scores
    .sort((o1, o2) => o2.numVisited - o1.numVisited)
    .map((score) => {
      if (scores[0].numVisited > score.numVisited) {
        return Object.assign({}, score, {
          score: 0,
        });
      }

      return score;
    });
};

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game

  // Response data
  const data = {
    color: '#000000',
    move: validDirections[Math.floor(Math.random() * Math.floor(4))],
  };

  return response.json(data);
});

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  const directions = calculateDirectionScore(request.body);
  directions.sort((o1, o2) => o2.score - o1.score);

  // Response data
  const data = {
    move: directions[0].name,
  };

  return response.json(data);
});

app.post('/end', (request, response) => {
  console.log('end', request.body.you);
  // NOTE: Any cleanup when a game is complete.
  return response.json({});
});

app.post('/ping', (request, response) => response.json({}));

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'));
});

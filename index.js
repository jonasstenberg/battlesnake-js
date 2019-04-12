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

app.set('port', (process.env.PORT || 9001));

app.enable('verbose errors');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(poweredByHandler);

let justAte = false;

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

const isSnake = (snakes, you, testPosition) => {
  const ourTail = you.body[you.body.length - 1];
  if (!justAte && testPosition.x === ourTail.x && testPosition.y === ourTail.y) {
    return false;
  }

  return snakes
    .map(snake => snake.body)
    .reduce((a, b) => a.concat(b), [])
    .find(snake => snake.x === testPosition.x && snake.y === testPosition.y);
};

const getEnemySnake = (snakes, you, testPosition) => {
  if (snakes.length === 1) {
    return false;
  }

  const enemySnakes = snakes.filter(snake => snake.id !== you.id);

  const closeEnemySnake = enemySnakes
    .filter(snake => distance(snake.body[0].x, snake.body[0].y, testPosition.x, testPosition.y) === 1) // eslint-disable-line
    .sort((snake1, snake2) => snake1.body.length - snake2.body.length);

  if (closeEnemySnake && closeEnemySnake.length > 0) {
    return closeEnemySnake[0];
  }

  return false;
};

const reachableCells = (board, testPosition) => {
  const grid = new Array(board.width);
  for (let x = 0; x < grid.length; x += 1) {
    grid[x] = new Array(board.height);

    for (let y = 0; y < grid[x].length; y += 1) {
      grid[x][y] = {
        visited: false,
        obstacle: false,
        tail: false,
      };
    }
  }

  board.snakes
    .forEach((snake) => {
      snake.body.forEach((snakePart, index) => {
        if (snake.body.length > 2 && index > snake.body.length - 2) {
          grid[snakePart.x][snakePart.y].tail = true;
        }
        grid[snakePart.x][snakePart.y].obstacle = true;
      });
    });

  const recursive = (cell) => {
    if (isWall(board, cell)) {
      return 0;
    }

    const gridCell = grid[cell.x][cell.y];
    if (gridCell.tail) {
      return 100;
    }

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

const getFoodScore = (board, testPosition) => board.food
  .map(food => distance(food.x, food.y, testPosition.x, testPosition.y))
  .map(d => distance(0, 0, board.width, board.height) - d)
  .sort((o1, o2) => o2 - o1)[0];

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
      score: 2,
    };

    if (isWall(body.board, testPosition)) {
      return Object.assign({}, result, {
        score: 0,
      });
    }

    if (isSnake(body.board.snakes, body.you, testPosition)) {
      return Object.assign({}, result, {
        score: 0,
      });
    }

    const numVisited = reachableCells(body.board, testPosition);

    const enemySnake = getEnemySnake(body.board.snakes, body.you, testPosition);
    if (enemySnake && enemySnake.body.length >= body.you.body.length) {
      return Object.assign({}, result, {
        score: 1,
        numVisited,
      });
    }

    let enemyScore = 0;
    if (enemySnake && enemySnake.body.length < body.you.body.length) {
      enemyScore = 500;
    }

    const foodScore = getFoodScore(body.board, testPosition);

    return Object.assign({}, result, {
      score: foodScore + enemyScore,
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
        if (score.numVisited > body.you.body.length * 2) {
          return Object.assign({}, score, {
            score: 10,
          });
        }

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
  };

  return response.json(data);
});

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  try {
    const directions = calculateDirectionScore(request.body);
    directions.sort((o1, o2) => o2.score - o1.score);

    // Response data
    const data = {
      move: directions[0].name,
    };

    const ourHead = request.body.you.body[0];
    const delta = coordinates.find(coordinate => coordinate.name === directions[0].name);
    const newPosition = {
      x: ourHead.x + delta.x,
      y: ourHead.y + delta.y,
    };

    justAte = false;
    for (let i = 0; i < request.body.board.food.length; i += 1) {
      const food = request.body.board.food[i];
      if (newPosition.x === food.x && newPosition.y === food.y) {
        justAte = true;
        break;
      }
    }

    return response.json(data);
  } catch (err) {
    console.log(err);
  }
});

app.post('/end', (request, response) => {
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

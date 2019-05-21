const reachableCells = require('./reachable-cells');
const isWall = require('./is-wall');

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

const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const isSnake = (snakes, you, testPosition) => {
  if (you != null) {
    const ourTail = you.body[you.body.length - 1];
    if (
      you.body.length > 4 &&
      !justAte &&
      testPosition.x === ourTail.x &&
      testPosition.y === ourTail.y
    ) {
      console.log('Follow tail');
      return false;
    }
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
    .filter(
      snake => distance(snake.body[0].x, snake.body[0].y, testPosition.x, testPosition.y) === 1,
    ) // eslint-disable-line
    .sort((snake1, snake2) => snake1.body.length - snake2.body.length);

  if (closeEnemySnake && closeEnemySnake.length > 0) {
    return closeEnemySnake[0];
  }

  return false;
};

const getFoodScore = (board, testPosition, health) =>
  board.food
    .map(food => distance(food.x, food.y, testPosition.x, testPosition.y))
    .map(d => distance(0, 0, board.width, board.height) - d)
    .map(d => (d * (130 - health)) / 100)
    .sort((o1, o2) => o2 - o1)[0];

const willDirectionTrapOpponent = (board, testPosition, xDiff, yDiff, you) => {
  const futureSnake = { body: [] };
  let obstacleHit = false;
  let currentPos = testPosition;
  while (!obstacleHit) {
    if (isWall(board, currentPos) || isSnake(board.snakes, null, currentPos)) {
      obstacleHit = true;
    } else {
      futureSnake.body.push({
        x: currentPos.x,
        y: currentPos.y,
      });
    }

    currentPos = {
      x: currentPos.x + xDiff,
      y: currentPos.y + yDiff,
    };
  }

  const newBoard = {
    ...board,
    snakes: [...board.snakes, futureSnake],
  };

  const anyWasTrapped = board.snakes
    .filter(snake => snake.id !== you.id)
    .map(snake => {
      const numVisited = reachableCells(newBoard, snake.body[0], snake.body[0]);
      console.log(`Num visisted for ${snake.name}: ${numVisited}`);
      return numVisited < snake.body.length;
    })
    .reduce((acc, curr) => acc || curr, false);

  return anyWasTrapped;
};

const calculateDirectionScore = body => {
  const scores = coordinates.map(direction => {
    const currentPosition = body.you.body[0];
    const testPosition = {
      x: direction.x + currentPosition.x,
      y: direction.y + currentPosition.y,
      diff: direction,
    };

    const result = {
      name: direction.name,
      numVisited: 0,
      score: 2,
    };

    if (isWall(body.board, testPosition)) {
      return Object.assign({}, result, {
        score: 0,
        why: 'Wall',
      });
    }

    if (isSnake(body.board.snakes, body.you, testPosition)) {
      return Object.assign({}, result, {
        score: 0,
        why: 'Other snake',
      });
    }

    const numVisited = reachableCells(body.board, testPosition);

    const enemySnake = getEnemySnake(body.board.snakes, body.you, testPosition);
    if (enemySnake && enemySnake.body.length >= body.you.body.length) {
      return Object.assign({}, result, {
        score: 1,
        numVisited,
        why: 'Is enamy head, but no other option',
      });
    }

    let enemyScore = 0;
    if (enemySnake && enemySnake.body.length < body.you.body.length) {
      enemyScore = 500;
    }

    const couldTrapEnemy = willDirectionTrapOpponent(
      body.board,
      testPosition,
      testPosition.diff.x,
      testPosition.diff.y,
      body.you,
    );
    const trapEnemyScore = couldTrapEnemy ? 10 : 0;

    const foodScore = getFoodScore(body.board, testPosition, body.you.health);

    return Object.assign({}, result, {
      score: foodScore + enemyScore + trapEnemyScore,
      numVisited,
      why: `Food: ${foodScore.toFixed(1)}\tKill enemy: ${enemyScore.toFixed(
        1,
      )}\tTrap enemy: ${trapEnemyScore.toFixed(1)}`,
    });
  });

  if (scores.every(score => scores[0].numVisited === score.numVisited)) {
    return scores;
  }

  return scores
    .sort((o1, o2) => o2.numVisited - o1.numVisited)
    .map(score => {
      if (scores[0].numVisited > score.numVisited) {
        if (score.numVisited > body.you.body.length * 2) {
          return Object.assign({}, score, {
            score: 0,
            why: `${score.why}\tTrapped but ok: true`,
          });
        }

        return Object.assign({}, score, {
          score: 0,
          why: 'Trapped area',
        });
      }

      return score;
    });
};

// Handle POST request to '/start'
const start = () => {
  // NOTE: Do something here to start the game

  console.log('========================================');
  // Response data
  const data = {
    color: '#000000',
  };

  return Promise.resolve(data);
};

const move = body => {
  try {
    const directions = calculateDirectionScore(body);
    directions.sort((o1, o2) => o2.score - o1.score);

    console.log(body);
    console.log(`${body.you.name} turn: ${body.turn}`);
    directions.forEach(d => {
      console.log(`${d.name} based on \t${d.score.toFixed(1)}\t${d.why}`);
    });

    // Response data
    const data = {
      move: directions[0].name,
    };

    const ourHead = body.you.body[0];
    const delta = coordinates.find(coordinate => coordinate.name === directions[0].name);
    const newPosition = {
      x: ourHead.x + delta.x,
      y: ourHead.y + delta.y,
    };

    justAte = false;
    for (let i = 0; i < body.board.food.length; i += 1) {
      const food = body.board.food[i];
      if (newPosition.x === food.x && newPosition.y === food.y) {
        justAte = true;
        break;
      }
    }

    return Promise.resolve(data);
  } catch (err) {
    console.log(err);
    return Promise.resolve({ error: err });
  }
};

const end = () => ({});

module.exports = {
  move,
  start,
  end,
};

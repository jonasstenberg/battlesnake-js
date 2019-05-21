const isWall = require('./is-wall');

const reachableCells = (board, testPosition, head) => {
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

  board.snakes.forEach(snake => {
    snake.body.forEach((snakePart, index) => {
      if (snake.body.length > 2 && index + 1 >= snake.body.length) {
        grid[snakePart.x][snakePart.y].tail = true;
        grid[snakePart.x][snakePart.y].obstacle = true;
      }

      if (head != null && snakePart.x === head.x && snakePart.y === head.y) {
        // Own head. Don't count
        console.log('Don´t count own head');
        grid[snakePart.x][snakePart.y].obstacle = false;
      } else {
        grid[snakePart.x][snakePart.y].obstacle = true;
      }
    });
  });

  const recursive = cell => {
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

module.exports = reachableCells;

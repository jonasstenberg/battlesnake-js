const readline = require('readline');
const fs = require('fs');

const writeToFile = (file, content) => {
  return new Promise((res, rej) => {
    fs.writeFile(file, content, err => {
      if (err) {
        rej(err);
      }
      res();
    });
  });
};

const codeBoard = stringBoard => {
  let all = '';
  stringBoard.forEach((row, index) => {
    let stringRow = `\t\t\t"`;
    row.forEach(character => {
      stringRow += character;
    });

    all += `${stringRow}"`;
    if (index < stringBoard.length - 1) {
      all += `,\r\n`;
    }
  });
  return all;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const inputPromise = new Promise(res => {
  rl.question('Paste the request body from wanted turn? ', bodyAnswer => {
    rl.question('Name of test case? ', nameAnswer => {
      rl.question(
        'Accepted directions, comma separeted (up, right, down, left)? ',
        directionsAnswer => {
          res({ nameInput: nameAnswer, bodyInput: bodyAnswer, directionsInput: directionsAnswer });
          rl.close();
        },
      );
    });
  });
});

inputPromise.then(({ nameInput, bodyInput, directionsInput }) => {
  const body = JSON.parse(bodyInput);

  const board = [];
  for (let row = 0; row < body.board.height; row += 1) {
    const rowCells = [];
    for (let col = 0; col < body.board.width; col += 1) {
      rowCells.push(' ');
    }
    board.push(rowCells);
  }

  // Add snakes
  const youId = body.you.id;
  body.board.snakes.forEach(snake => {
    for (let i = snake.body.length - 1; i >= 0; i -= 1) {
      let currentChar = ' ';
      if (i > 0) {
        const xDiff = snake.body[i].x - snake.body[i - 1].x;
        const yDiff = snake.body[i].y - snake.body[i - 1].y;

        if (snake.id === youId) {
          if (i === 0) {
            currentChar = 'O';
          } else if (xDiff === 1) {
            currentChar = '<';
          } else if (xDiff === -1) {
            currentChar = '>';
          } else if (yDiff === 1) {
            currentChar = 'A';
          } else if (yDiff === -1) {
            currentChar = 'v';
          }
        } else if (i === 0) {
          currentChar = 'X';
        } else if (xDiff === 1) {
          currentChar = '⇇';
        } else if (xDiff === -1) {
          currentChar = '⇉';
        } else if (yDiff === 1) {
          currentChar = '⇈';
        } else if (yDiff === -1) {
          currentChar = '⇊';
        }

        board[snake.body[i].y][snake.body[i].x] = currentChar;
      } else if (snake.id === youId) {
        board[snake.body[i].y][snake.body[i].x] = 'O';
      } else {
        board[snake.body[i].y][snake.body[i].x] = 'X';
      }
    }
  });

  // Add food
  body.board.food.forEach(food => {
    board[food.y][food.x] = '.';
  });

  const directions = directionsInput.replace(/\s/g, '').split(',');
  const directionsOutput = directions.map((d, index) => {
    const val = `"${d}"`;

    if (index < directions.length - 1) {
      return `${val},`;
    }
    return val;
  });

  const output = `
  {
    "board": [
${codeBoard(board)}
    ],
    "name": "${nameInput}",
    "acceptedOutcomes": [
      ${directionsOutput}
    ]
  }`;

  writeToFile(
    `test/generated/${nameInput
      .replace(/\s/g, '-')
      .replace(/\./g, '_')
      .toLowerCase()}.json`,
    output,
  );
});

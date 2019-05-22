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

const fileContentStart = `const chai = require('chai');
const buildRequest = require('./test-case-helper');
const { start, end, move } = require('../game');

const { expect } = chai;

describe('Generated test case', () => {
  beforeEach(() => {
    start();
  });

  afterEach(() => {
    end();
  });

  it('`;

const fileContentEnd = `
    move(body)
      .then(result => {
        expect(result.move).to.equal('left');
        done();
      })
      .catch(done);
  });
});`;

const printBoard = stringBoard => {
  let all = '';
  stringBoard.forEach(row => {
    let stringRow = '';
    row.forEach(character => {
      stringRow += character;
    });
    all += `${stringRow}\r\n`;
  });
  return all;
};

const codeBoard = stringBoard => {
  let all = '';
  stringBoard.forEach(row => {
    let stringRow = `'`;
    row.forEach(character => {
      stringRow += character;
    });
    all += `${stringRow}',\r\n`;
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
      res({ nameInput: nameAnswer, bodyInput: bodyAnswer });
      rl.close();
      /* res({
        nameInput: 'Simple test',
        bodyInput:
          '{"game":{"id":"f2019822-59f4-49c2-9a8d-42a10b495ba1"},"turn":6,"board":{"height":5,"width":5,"food":[{"x":2,"y":0},{"x":4,"y":2},{"x":4,"y":0},{"x":3,"y":4},{"x":3,"y":0},{"x":3,"y":2},{"x":4,"y":3},{"x":4,"y":1},{"x":3,"y":1},{"x":1,"y":0}],"snakes":[{"id":"6e1cb990-9e88-456a-bd48-bff203200137","name":"Test","health":100,"body":[{"x":3,"y":3},{"x":2,"y":3},{"x":1,"y":3},{"x":1,"y":2},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":1}]},{"id":"bb20ce8d-2b03-409f-bd08-ec749f9b7286","name":"Test2","health":98,"body":[{"x":2,"y":4},{"x":1,"y":4},{"x":0,"y":4},{"x":0,"y":3},{"x":0,"y":2},{"x":0,"y":1}]}]},"you":{"id":"6e1cb990-9e88-456a-bd48-bff203200137","name":"Test","health":100,"body":[{"x":3,"y":3},{"x":2,"y":3},{"x":1,"y":3},{"x":1,"y":2},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":1}]}}',
      }); */
    });
  });
});

inputPromise.then(({ nameInput, bodyInput }) => {
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
    const lastChar = '<';

    for (let i = snake.body.length - 1; i >= 0; i -= 1) {
      let currentChar = lastChar;
      if (i > 0) {
        const xDiff = snake.body[i].x - snake.body[i - 1].x;
        const yDiff = snake.body[i].y - snake.body[i - 1].y;

        if (snake.id === youId) {
          if (xDiff === 1) {
            currentChar = '<';
          } else if (xDiff === -1) {
            currentChar = '>';
          } else if (yDiff === 1) {
            currentChar = 'A';
          } else if (yDiff === -1) {
            currentChar = 'v';
          }
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
      }
    }
  });

  // Add food
  body.board.food.forEach(food => {
    board[food.y][food.x] = '.';
  });

  console.log(printBoard(board));

  const output = `${fileContentStart}${nameInput}', done => {
    // prettier-ignore
    const body = buildRequest(100, [
${codeBoard(board)}
    ]);
    ${fileContentEnd}`;

  writeToFile(`test/generated-${nameInput.replace(/\s/g, '-').toLowerCase()}.test.js`, output);
});

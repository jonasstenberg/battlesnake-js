const fs = require('fs');

const getLinkedPart = (coord, diff, width, height) => {
  if (!diff) {
    return null;
  }

  const targetCoord = {
    x: coord.x + diff.x,
    y: coord.y + diff.y,
  };

  if (targetCoord.x < 0 || targetCoord.y < 0 || targetCoord.x >= width || targetCoord.y >= height) {
    return null;
  }

  return targetCoord;
};

const findHeadForPlayer = (player, board) => {
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[0].length; x += 1) {
      const cell = board[y][x];
      if (cell.player === player && cell.isHead) {
        return cell;
      }
    }
  }
  return null;
};

const convertCharsToBoardModel = charMap => {
  const objectMap = [];

  charMap.forEach((row, y) => {
    const width = row.length;
    const rowMap = [];
    for (let x = 0; x < width; x += 1) {
      const mainChar = row.charAt(x).toUpperCase();

      if (mainChar === 'A') {
        rowMap.push({ coord: { x, y }, player: 1, nextDiff: { x: 0, y: -1 } });
      } else if (mainChar === 'V') {
        rowMap.push({ coord: { x, y }, player: 1, nextDiff: { x: 0, y: 1 } });
      } else if (mainChar === '<') {
        rowMap.push({ coord: { x, y }, player: 1, nextDiff: { x: -1, y: 0 } });
      } else if (mainChar === '>') {
        rowMap.push({ coord: { x, y }, player: 1, nextDiff: { x: 1, y: 0 } });
      } else if (mainChar === '⇈') {
        rowMap.push({ coord: { x, y }, player: 2, nextDiff: { x: 0, y: -1 } });
      } else if (mainChar === '⇊') {
        rowMap.push({ coord: { x, y }, player: 2, nextDiff: { x: 0, y: 1 } });
      } else if (mainChar === '⇇') {
        rowMap.push({ coord: { x, y }, player: 2, nextDiff: { x: -1, y: 0 } });
      } else if (mainChar === '⇉') {
        rowMap.push({ coord: { x, y }, player: 2, nextDiff: { x: 1, y: 0 } });
      } else if (mainChar === '.') {
        rowMap.push({ coord: { x, y }, food: true });
      } else if (mainChar === 'O') {
        rowMap.push({ coord: { x, y }, player: 1, isHead: true });
      } else if (mainChar === 'X') {
        rowMap.push({ coord: { x, y }, player: 2, isHead: true });
      } else {
        rowMap.push({ coord: { x, y } });
      }
    }

    objectMap.push(rowMap);
  });

  return objectMap;
};

const buildRequest = (health, charMap) => {
  const height = charMap.length;
  const width = height;
  const snakes = [];
  const food = [];

  const objectMap = convertCharsToBoardModel(charMap);

  const nextLinkedMap = objectMap.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (cell.player === null || cell.player === undefined) {
        return cell;
      }

      const linkedCoord = getLinkedPart({ x: colIndex, y: rowIndex }, cell.nextDiff, width, height);

      if (linkedCoord == null) {
        return {
          ...cell,
          isHead: true,
        };
      }

      const targetCell = objectMap[linkedCoord.y][linkedCoord.x];
      if (cell.player !== targetCell.player) {
        return {
          ...cell,
          isHead: true,
        };
      }

      return {
        ...cell,
        nextPart: linkedCoord,
      };
    }),
  );

  const board = nextLinkedMap;
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[0].length; x += 1) {
      const cell = board[y][x];

      if (cell.player !== null && cell.player !== undefined && !cell.isHead) {
        const nextPart = board[cell.nextPart.y][cell.nextPart.x];
        if (
          nextPart.player === null ||
          nextPart.player === undefined ||
          nextPart.player !== cell.player
        ) {
          // cell.isHead = true;
        } else {
          nextPart.prevPart = cell.coord;
        }
      }
    }
  }

  for (let i = 1; i <= 5; i += 1) {
    const head = findHeadForPlayer(i, board);
    if (head) {
      let current = head;
      const snake = {
        body: [],
        id: `${i}`,
        name: `${i}`,
      };

      do {
        snake.body.push(current);
        if (current.prevPart) {
          current = board[current.prevPart.y][current.prevPart.x];
        } else {
          current = null;
        }
      } while (current != null);

      snakes.push(snake);
    }
  }

  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[0].length; x += 1) {
      const cell = board[y][x];
      if (cell.food) {
        food.push({ x: cell.coord.x, y: cell.coord.y });
      }
    }
  }

  const realSnakes = snakes.map(snake => ({
    ...snake,
    body: snake.body.map(part => ({
      x: part.coord.x,
      y: part.coord.y,
    })),
  }));

  const you = {
    ...realSnakes[0],
    health,
  };

  const body = {
    board: {
      width,
      height,
      snakes: realSnakes,
      food,
    },
    you,
  };

  return body;
};

const getGeneratedTestData = () => {
  const generatedDir = 'test/generated/';
  const generatedInputPromises = new Promise((res, rej) => {
    fs.readdir(generatedDir, (err, files) => {
      if (err) {
        rej(err);
      }

      const promises = files.map(fileName => {
        const file = generatedDir + fileName;
        return new Promise((fileRes, fileRej) => {
          fs.stat(file, (statErr, stats) => {
            if (statErr) {
              fileRej(statErr);
            }

            if (!stats.isDirectory()) {
              fs.readFile(file, (readFileError, content) => {
                if (readFileError) {
                  fileRej(err);
                }
                fileRes(JSON.parse(content));
              });
            }
          });
        });
      });

      res(Promise.all(promises));
    });
  });

  return generatedInputPromises;
};

module.exports = {
  buildRequest,
  getGeneratedTestData,
};

import chai from 'chai';
import { start, end, move } from '../game';

const { expect } = chai;

const getLinkedPart = (coord, diff, width, height) => {
  const targetCoord = {
    x: coord.x + diff.x,
    y: coord.y + diff.y
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

const buildRequest2 = (health, charMap) => {
  const height = charMap.length;
  let width = height;
  const snakes = [];
  const food = [];

  const objectMap = [];

  charMap.forEach((row, y) => {
    width = row.length;
    const rowMap = [];
    for (let x = 0; x < width; x += 1) {
      const mainChar = row.charAt(x);

      if (mainChar === 'A') {
        rowMap.push({ coord: { x, y }, player: 1, nextDiff: { x: 0, y: -1 } });
      } else if (mainChar === 'v') {
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
      } else {
        rowMap.push({ coord: { x, y } });
      }
    }

    objectMap.push(rowMap);
  });

  const nextLinkedMap = objectMap.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (cell.player === null || cell.player === undefined) {
        return cell;
      }

      const linkedCoord = getLinkedPart({ x: colIndex, y: rowIndex }, cell.nextDiff, width, height);

      if (linkedCoord == null) {
        return {
          ...cell,
          isHead: true
        };
      }

      const targetCell = objectMap[linkedCoord.y][linkedCoord.x];
      console.log('cell', cell);
      console.log('linkedCoord', linkedCoord);
      console.log('targetCell', targetCell);
      if (cell.player !== targetCell.player) {
        return {
          ...cell,
          isHead: true
        };
      }

      return {
        ...cell,
        nextPart: linkedCoord
      };
    })
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
          cell.isHead = true;
          return cell;
        }
        nextPart.prevPart = cell.coord;
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
        name: `${i}`
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

  console.log(' ___________ ');
  nextLinkedMap.forEach(row => {
    let str = '|';
    row.forEach(cell => {
      if (cell.player !== null && cell.player !== undefined) {
        if (cell.player === 1 && cell.nextDiff.y === -1) {
          str += 'A';
        } else if (cell.player === 1 && cell.nextDiff.y === 1) {
          str += 'v';
        } else if (cell.player === 1 && cell.nextDiff.x === -1) {
          str += '<';
        } else if (cell.player === 1 && cell.nextDiff.x === 1) {
          str += '>';
        } else if (cell.player === 2 && cell.nextDiff.y === -1) {
          str += '⇈';
        } else if (cell.player === 2 && cell.nextDiff.y === 1) {
          str += '⇊';
        } else if (cell.player === 2 && cell.nextDiff.x === -1) {
          str += '⇇';
        } else if (cell.player === 2 && cell.nextDiff.x === 1) {
          str += '⇉';
        }
      } else {
        str += ' ';
      }
    });
    str += '|';
    console.log(str);
  });
  console.log(' ----------- ');

  const realSnakes = snakes.map(snake => ({
    ...snake,
    body: snake.body.map(part => ({
      x: part.coord.x,
      y: part.coord.y
    }))
  }));

  const you = {
    ...realSnakes[0],
    health
  };

  const body = {
    board: {
      width,
      height,
      snakes: realSnakes,
      food
    },
    you
  };

  console.log(JSON.stringify(body));
  return body;
};

describe('Snake', () => {
  beforeEach(() => {
    start();
  });

  afterEach(() => {
    end();
  });

  /* it("should avoid walls", done => {
    const body = buildRequest(100, [
      ". . . . . M0. . . . . ",
      ". . . . . M1. . . . . ",
      ". . . . . M2. . . . . ",
      ". . o . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . o . ",
      ". . A0A1A2A3. . . . . ",
      ". . . . . A4. . . . . ",
      ". . . . . A5. . . . . ",
      ". . . . . . . . . . . "
    ]);

    game
      .move(body)
      .then(result => {
        expect(result.move).to.not.equal("up");
        done();
      })
      .catch(done);
  });

  it("should avoid snakes", done => {
    const body = buildRequest(100, [
      ". . . . . M2. . . . . ",
      ". . . . . M1. . . . . ",
      ". . . . . M0A5. . . . ",
      ". . o A1A2A3A4. . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . o . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . "
    ]);

    game
      .move(body)
      .then(result => {
        expect(result.move).to.equal("left");
        done();
      })
      .catch(done);
  });

  it("should follow  tail if trapped elsewhere", done => {
    const body = buildRequest(100, [
      ". . M2M3 . . . . . . . ",
      "A9. M1M4 . . . . . . . ",
      "A8. M0M5 . . . . . . . ",
      "A7A0A1A2 . . . . . . . ",
      "A6A5A4A3 . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . . . . . . . . . . ",
      ". . o . . . . . . . . "
    ]);

    game
      .move(body)
      .then(result => {
        expect(result.move).to.equal("right");
        done();
      })
      .catch(done);
  }); */

  it('should go for more area. Case 0', done => {
    /* const body = buildRequest(100, [
      ".1A6A7A8.1.0.1.1.1.1",
      "A4A5.1A9.1.1.1.1.1.1",
      "A3o1M0M3M4M5M6M7M8M9",
      "A2.1M1M2.1.1.1.1.1.1",
      "A1.1.1.1.1.1.1.1.1.1",
      "A0.1.1.1.1.1.1.1.1.1",
      ".1.1.1.1.1.1.1.1.1o1",
      ".1.1.0.1.2.3.1.1.1.1",
      ".1.1.1.1.1.4.1.1.1.1",
      ".1.1.1.1.1.5.1.1.1.1",
      ".1.1.1.1.1.1.1.1.1.1"
    ]); */

    const body = buildRequest2(100, [
      ' ⇊⇇⇇       ',
      '⇊⇇ ⇈       ',
      '⇊.Av<<<<<<<',
      '⇊ A<       ',
      '⇊          ',
      '⇉⇉         ',
      '           ',
      '           ',
      '           ',
      '           ',
      '           '
    ]);

    move(body)
      .then(result => {
        expect(result.move).to.equal('left');
        done();
      })
      .catch(done);
  });
});

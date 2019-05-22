const printBoard = boardMap => {
  console.log(' ___________ ');
  boardMap.forEach(row => {
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
};

module.exports = printBoard;

const isWall = (board, testPosition) => testPosition.x < 0
  || testPosition.y < 0
  || testPosition.x >= board.width
  || testPosition.y >= board.height;

module.exports = isWall;

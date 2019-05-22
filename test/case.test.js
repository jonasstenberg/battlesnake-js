const chai = require('chai');
const { buildRequest, getGeneratedTestData } = require('./test-case-helper');
const { start, end, move } = require('../game');

const { expect } = chai;

describe('Snake', () => {
  beforeEach(() => {
    start();
  });

  afterEach(() => {
    end();
  });

  it('should avoid walls', done => {
    const body = buildRequest(100, [
      '    A      ',
      '    A      ',
      '    A      ',
      '           ',
      '           ',
      '        .  ',
      '           ',
      '           ',
      '           ',
      '           ',
      '           ',
    ]);

    move(body)
      .then(result => {
        expect(result.move).to.not.equal('up');
        done();
      })
      .catch(done);
  });

  it('should avoid snakes', done => {
    const body = buildRequest(100, [
      '    v      ',
      '    v    . ',
      '    v      ',
      '  ⇇⇇⇇⇇     ',
      '           ',
      '        .  ',
      '           ',
      '           ',
      '           ',
      '           ',
      '           ',
    ]);

    move(body)
      .then(result => {
        expect(result.move).to.equal('right');
        done();
      })
      .catch(done);
  });

  it('should go for more area', done => {
    const body = buildRequest(100, [
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
      '           ',
    ]);

    move(body)
      .then(result => {
        expect(result.move).to.equal('left');
        done();
      })
      .catch(done);
  });

  it('Generated tests', done => {
    const possibleOutcomes = ['left', 'right', 'up', 'down'];

    getGeneratedTestData()
      .then(dataList => {
        dataList.forEach(data => {
          const notAcceptedOutcomes = possibleOutcomes.filter(
            i => !data.acceptedOutcomes.includes(i),
          );

          const body = buildRequest(100, data.board);
          return move(body)
            .then(result => {
              notAcceptedOutcomes.forEach(outcome => {
                expect(result.move, data.name).to.not.equal(outcome);
              });
            })
            .catch(done);
        });
      })
      .then(() => {
        done();
      })
      .catch(done);
  });
});

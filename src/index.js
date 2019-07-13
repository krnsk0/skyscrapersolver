/* eslint-disable no-shadow */
/* eslint-disable react/no-array-index-key */
import ReactDOM from 'react-dom';
import React from 'react';
import solveSkyscraper from './skyscraper';

// const clues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; blank
// const clues = [1, 0, 0, 2, 0, 3, 0, 0, 0, 2, 0, 0, 2, 3, 0, 0]; bad gridlocked puzzle
// const clues = [2, 2, 1, 3, 2, 2, 3, 1, 1, 2, 2, 3, 3, 2, 1, 3];
const clues = [0, 0, 1, 2, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0];

const state = solveSkyscraper(clues);

const topRow = [' ', ...state.clues.slice(0, state.N), ' '];
const bottomRow = [
  ' ',
  ...state.clues.slice(state.N * 2, state.N * 3).reverse(),
  ' '
];
const middleRows = Array.from({ length: state.N }, (_, i) => {
  const getCellIndicesFromRowIndex = (rowIndex, N) => {
    return Array.from({ length: N }, (_, i) => {
      return rowIndex * N + i;
    });
  };

  const setToString = set => {
    let str = '';
    for (let n of set) {
      str += String(n);
    }
    return str;
  };

  const rowIndices = getCellIndicesFromRowIndex(i, state.N);
  const cells = rowIndices.map(idx => state.board[idx]).map(setToString);

  const leftClue = state.clues[state.N * 4 - i - 1] || ' ';
  const rightClue = state.clues[i + state.N] || ' ';

  return [leftClue, ...cells, rightClue];
});

const App = () => {
  return (
    <table
      style={{
        margin: '5px auto',
        fontFamily: 'monospace',
        textAlign: 'center'
      }}
    >
      <tbody>
        <tr style={{ height: '2em' }}>
          {topRow.map((clue, idx) => (
            <td key={idx} style={{ border: '0px', width: '1em' }}>
              {clue || ' '}
            </td>
          ))}
        </tr>
        {middleRows.map((row, rowIdx) => (
          <tr key={rowIdx} style={{ height: '2em' }}>
            {row.map((cell, idx) => (
              <td key={idx} style={{ border: '0px', width: '1em' }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
        <tr style={{ height: '2em' }}>
          {bottomRow.map((clue, idx) => (
            <td key={idx} style={{ border: '0px', width: '1em' }}>
              {clue || ' '}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));

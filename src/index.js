/* eslint-disable no-shadow */
/* eslint-disable react/no-array-index-key */
import ReactDOM from 'react-dom';
import React from 'react';
import solveSkyscraper from './skyscraper';

const clueSet = {
  easy4x4: [0, 0, 1, 2, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0],
  easy7x7: [
    0,
    2,
    3,
    0,
    2,
    0,
    0,
    5,
    0,
    4,
    5,
    0,
    4,
    0,
    0,
    4,
    2,
    0,
    0,
    0,
    6,
    0,
    0,
    0,
    0,
    0,
    4,
    0
  ],
  hard7x7: [
    3,
    3,
    2,
    1,
    2,
    2,
    3,
    4,
    3,
    2,
    4,
    1,
    4,
    2,
    2,
    4,
    1,
    4,
    5,
    3,
    2,
    3,
    1,
    4,
    2,
    5,
    2,
    3
  ]
};

const solvePuzzle = selectedPuzzle => {
  const clues = clueSet[selectedPuzzle];
  const state = solveSkyscraper(clues);
  return state;
};

const makeTopRow = state => {
  return [' ', ...state.clues.slice(0, state.N), ' '];
};

const makeBottomRow = state => {
  return [' ', ...state.clues.slice(state.N * 2, state.N * 3).reverse(), ' '];
};

const makeMiddleRows = (state, board) => {
  return Array.from({ length: state.N }, (_, i) => {
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
    const cells = rowIndices.map(idx => board[idx]).map(setToString);

    const leftClue = state.clues[state.N * 4 - i - 1] || ' ';
    const rightClue = state.clues[i + state.N] || ' ';

    return [leftClue, ...cells, rightClue];
  });
};

const App = () => {
  const [selectedPuzzle, setSelectedPuzzle] = React.useState('hard7x7');
  const [state, setState] = React.useState({
    board: [],
    clues: [],
    N: 0,
    history: []
  });
  const [pointer, setPointer] = React.useState(0);

  React.useEffect(() => {
    setPointer(0);
    setState(solvePuzzle(selectedPuzzle));
  }, [selectedPuzzle]);

  React.useEffect(() => {
    if (state.history.length > 0) {
      setPointer(state.history.length - 1);
    }
  }, [state]);

  const topRow = makeTopRow(state);
  const bottomRow = makeBottomRow(state);
  const middleRows = makeMiddleRows(state, state.history[pointer]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <select
        style={{ width: '100px' }}
        onChange={evt => {
          console.log(`SOLVING ${evt.target.value}`);
          setSelectedPuzzle(evt.target.value);
        }}
        value={selectedPuzzle}
      >
        {Object.entries(clueSet).map(entry => (
          <option key={entry[0]} value={entry[0]}>
            {entry[0]}
          </option>
        ))}
      </select>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100px',
          color: 'blue'
        }}
      >
        <div
          onClick={() => {
            pointer > 0 && setPointer(pointer - 1);
          }}
        >
          previous
        </div>
        <div
          onClick={() => {
            pointer < state.history.lenght - 1 && setPointer(pointer + 1);
          }}
        >
          next
        </div>
      </div>
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
                <td
                  key={idx}
                  style={{
                    border: `${
                      idx === 0 || idx === row.length - 1
                        ? '0px'
                        : '1px solid black'
                    }`,
                    width: '1em'
                  }}
                >
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
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));

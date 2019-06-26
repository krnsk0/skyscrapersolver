const cloneDeep = require('lodash/cloneDeep');

const constraintListFactory = N => {
  return new Set(Array.from({ length: N }, (_, i) => i + 1));
};

const boardFactory = N => {
  return Array.from({ length: N * N }, () => constraintListFactory(N));
};

const getCellIndicesFromRowIndex = (rowIndex, N) => {
  return Array.from({ length: N }, (_, i) => {
    return rowIndex * N + i;
  });
};

const getCellIndicesFromColIndex = (colIndex, N) => {
  return Array.from({ length: N }, (_, i) => {
    return colIndex + i * N;
  });
};

const getCellIndicesFromClueIndex = (clueIndex, N) => {
  if (clueIndex < N) {
    // top side
    return getCellIndicesFromColIndex(clueIndex, N);
  } else if (clueIndex >= N && clueIndex < 2 * N) {
    // right side
    return getCellIndicesFromRowIndex(clueIndex - N, N).reverse();
  } else if (clueIndex >= 2 * N && clueIndex < 3 * N) {
    // bottom side
    return getCellIndicesFromColIndex(3 * N - clueIndex - 1, N).reverse();
  } else if (clueIndex >= 3 * N && clueIndex < 4 * N) {
    // left side
    return getCellIndicesFromRowIndex(4 * N - clueIndex - 1, N);
  }
};

const initializeState = clues => {
  return {
    N: Math.sqrt(clues.length),
    board: boardFactory(Math.sqrt(clues.length)),
    clues
  };
};

// mutates state!
const performEdgeClueInitialization = state => {
  // mutates cell!
  const constrainCellWithClue = (cell, c, distance) => {
    const minimum = state.N - c + 2 + distance;
    for (let i = minimum; i <= state.N; i += 1) {
      cell.delete(i);
    }
  };

  state.clues.forEach((c, clueIndex) => {
    // get some cells
    const constraintLists = getCellIndicesFromClueIndex(clueIndex, state.N).map(
      cellIndex => state.board[cellIndex]
    );

    // apply the edge constraint rule
    if (1 < c && c < state.N) {
      constraintLists.forEach((cell, distance) => {
        constrainCellWithClue(cell, c, distance);
      });
    }
    // resolve the first cell to N when the clue is 1
    else if (c === 1) {
      constraintLists[0].clear();
      constraintLists[0].add(state.N);
    }
    // resolve the entire row when the clue is N
    else if (c === state.N) {
      constraintLists.forEach((cell, distance) => {
        cell.clear();
        cell.add(distance + 1);
      });
    }
  });
};

const getCrossIndicesFromCell = (state, cellIndex) => {
  const x = cellIndex % state.N;
  const y = Math.floor(cellIndex / state.N);
  return [
    ...getCellIndicesFromColIndex(x, state.N),
    ...getCellIndicesFromRowIndex(y, state.N)
  ].filter(idx => idx !== cellIndex);
};

// mutates state!
const propagateConstraintsFromCell = (state, cellIndex) => {
  let list = state.board[cellIndex];
  if (list.size > 1) {
    throw new Error('propagate constraints called on a non-resolved cell');
  }
  const valueToEliminate = list.values().next().value;
  const crossIndices = getCrossIndicesFromCell(state, cellIndex);
  crossIndices.forEach(crossIndex => {
    state.board[crossIndex].delete(valueToEliminate);
  });
};

const propagateConstraints = state => {
  state.board.forEach((cell, cellIndex) => {
    if (cell.size === 1) {
      propagateConstraintsFromCell(state, cellIndex);
    }
  });
};

// ********* MAIN ***********

const solveSkyscraper = clues => {
  let state = initializeState(clues);
  performEdgeClueInitialization(state);

  propagateConstraints(state);

  console.log('state: ', state);

  return [];
};

// ********* RUN ***********

const clues = [1, 0, 0, 2, 0, 3, 0, 0, 0, 2, 0, 0, 2, 3, 0, 0];
// const clues = [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const result = solveSkyscraper(clues);
console.log('result: ', result);

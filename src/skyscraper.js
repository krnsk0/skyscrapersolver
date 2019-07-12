// import cloneDeep from 'lodash/cloneDeep';

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
    N: clues.length / 4,
    board: boardFactory(clues.length / 4),
    clues,
    queue: []
  };
};

// mutates state.queue
// mutates state.board
const constrainAndEnqueue = (
  state,
  cellIndex,
  deleteValue = null,
  resolveValue = null
) => {
  console.assert(
    // eslint-disable-next-line eqeqeq
    !deleteValue != !resolveValue,
    'constrainAndEnqueue called with bad arguments'
  ); // XOR check

  const constrain = (idxToConstrain, valueToDelete) => {
    const cell = state.board[idxToConstrain];
    let mutated = cell.delete(valueToDelete);

    if (mutated) {
      const poeCellIndices = poeCellSearch(
        state,
        idxToConstrain,
        valueToDelete
      );
      poeCellIndices.forEach(poeCellIndex => {
        state.queue.push({
          type: 'RESOLVE_CELL_TO_VALUE',
          cellIndex: poeCellIndex,
          resolveToValue: valueToDelete
        });
      });
    }

    if (mutated && cell.size === 1) {
      state.queue.push({
        type: 'PROPAGATE_CONTSTRAINTS_FROM',
        cellIndex: idxToConstrain
      });
    } else if (cell.size === 0) {
      throw new Error(`cell ${idxToConstrain} is empty`);
    }
  };

  if (deleteValue) {
    constrain(cellIndex, deleteValue);
  } else {
    for (let value of state.board[cellIndex]) {
      if (value !== resolveValue) {
        constrain(cellIndex, value);
      }
    }
  }
};

// mutates state
const performEdgeClueInitialization = state => {
  // mutates cell
  const constrainCellWithClue = (cell, c, distance, cellIndex) => {
    const minimum = state.N - c + 2 + distance;
    for (let i = minimum; i <= state.N; i += 1) {
      constrainAndEnqueue(state, cellIndex, i);
    }
  };

  state.clues.forEach((c, clueIndex) => {
    // get some cells
    const cellIndices = getCellIndicesFromClueIndex(clueIndex, state.N);

    // apply the edge constraint rule
    if (1 < c && c < state.N) {
      cellIndices.forEach((cellIndex, distance) => {
        const cell = state.board[cellIndex];
        constrainCellWithClue(cell, c, distance, cellIndex);
      });
    }
    // resolve the first cell to N when the clue is 1
    else if (c === 1) {
      constrainAndEnqueue(state, cellIndices[0], undefined, state.N);
    }
    // resolve the entire row when the clue is N
    else if (c === state.N) {
      cellIndices.forEach((cellIndex, distance) => {
        constrainAndEnqueue(state, cellIndex, undefined, distance + 1);
      });
    }
  });
};

const getCrossIndicesFromCellIndex = (state, cellIndex) => {
  const x = cellIndex % state.N;
  const y = Math.floor(cellIndex / state.N);
  return [
    ...getCellIndicesFromColIndex(x, state.N),
    ...getCellIndicesFromRowIndex(y, state.N)
  ].filter(idx => idx !== cellIndex);
};

// mutates state
const propagateFromResolvedCell = (state, cellIndex) => {
  let list = state.board[cellIndex];
  if (list.size > 1) {
    throw new Error('propagate constraints called on a non-resolved cell');
  }
  const valueToEliminate = list.values().next().value;
  const crossIndices = getCrossIndicesFromCellIndex(state, cellIndex);
  crossIndices.forEach(crossIndex => {
    constrainAndEnqueue(state, crossIndex, valueToEliminate);
  });
};

const queueProcessor = state => {
  while (state.queue.length) {
    const action = state.queue.shift();

    if (action.type === `PROPAGATE_CONTSTRAINTS_FROM`) {
      propagateFromResolvedCell(state, action.cellIndex);
    } else if (action.type === 'RESOLVE_CELL_TO_VALUE') {
      constrainAndEnqueue(state, action.cellIndex, null, action.resolveToValue);
    }
  }
};

const getRowIndicesFromCellIndex = (state, cellIndex) => {
  const y = Math.floor(cellIndex / state.N);
  return [...getCellIndicesFromRowIndex(y, state.N)].filter(
    idx => idx !== cellIndex
  );
};

const getColIndicesFromCellIndex = (state, cellIndex) => {
  const x = cellIndex % state.N;
  return [...getCellIndicesFromColIndex(x, state.N)].filter(
    idx => idx !== cellIndex
  );
};

const isValueResolvedInCellIndices = (state, cellIndices, valueToCheck) => {
  for (let i = 0; i <= cellIndices.length - 1; i += 1) {
    let cell = state.board[cellIndices[i]];
    if (cell.size === 1 && cell.has(valueToCheck)) return true;
  }
  return false;
};

const countValueInCells = (state, cellIndices, valueToCount) => {
  const count = cellIndices.reduce((accum, cellIndex) => {
    if (state.board[cellIndex].has(valueToCount)) return accum + 1;
    else return accum;
  }, 0);

  return count;
};

const findCellIndexWithValue = (state, cellIndices, valueToFind) => {
  return cellIndices.find(cellIndex => state.board[cellIndex].has(valueToFind));
};

const poeCellSearch = (state, modifiedCellIndex, deletedValue) => {
  // row
  const rowIndices = getRowIndicesFromCellIndex(state, modifiedCellIndex);
  let rowDeletedValueCount = 0;
  if (!isValueResolvedInCellIndices(state, rowIndices, deletedValue)) {
    rowDeletedValueCount = countValueInCells(state, rowIndices, deletedValue);
  }

  // col
  const colIndices = getColIndicesFromCellIndex(state, modifiedCellIndex);
  let colDeletedValueCount = 0;
  if (!isValueResolvedInCellIndices(state, colIndices, deletedValue)) {
    colDeletedValueCount = countValueInCells(state, colIndices, deletedValue);
  }

  const results = [];
  if (rowDeletedValueCount === 1) {
    results.push(findCellIndexWithValue(state, rowIndices, deletedValue));
  }
  if (colDeletedValueCount === 1) {
    results.push(findCellIndexWithValue(state, colIndices, deletedValue));
  }

  return results;
};

// *** MAIN ***

const solveSkyscraper = clues => {
  let state = initializeState(clues);
  performEdgeClueInitialization(state);
  queueProcessor(state);

  return state;
};

export default solveSkyscraper;

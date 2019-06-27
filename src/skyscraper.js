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
    N: Math.sqrt(clues.length),
    board: boardFactory(Math.sqrt(clues.length)),
    clues,
    queue: []
  };
};

// mutates state.queue
// mutates state.board.cellIndex
const constrainAndEnqueue = (state, cellIndex, deleteValue, resolveValue) => {
  console.assert(
    // eslint-disable-next-line eqeqeq
    !deleteValue != !resolveValue,
    'constrainAndEnqueue called with bad arguments'
  ); // XOR check

  console.log(
    `cellIndex, deleteValue, resolveValue`,
    cellIndex,
    deleteValue,
    resolveValue
  );

  const constrain = (idxToConstrain, valueToDelete) => {
    const cell = state.board[idxToConstrain];
    let mutated = cell.delete(valueToDelete);

    if (mutated) {
      const poeCellIndices = poeCellSearch(
        state,
        idxToConstrain,
        valueToDelete
      );
      console.log(
        'poeCellIndices, idxToConstrain',
        poeCellIndices,
        idxToConstrain,
        valueToDelete
      );
      poeCellIndices.forEach(poeCellIndex => {
        console.log(
          'pushing to queue resolve cell',
          poeCellIndex,
          'to',
          valueToDelete
        );
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

// mutates state!
const performEdgeClueInitialization = state => {
  // mutates cell!
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

// mutates state!
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
    console.log(action);
    if (action.type === `PROPAGATE_CONTSTRAINTS_FROM`) {
      propagateFromResolvedCell(state, action.cellIndex);
    } else if (action.type === 'RESOLVE_CELL_TO_VALUE') {
      // constrainAndEnqueue(state, action.cellIndex, null, action.resolveToValue);
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

const filterResolvedCells = (state, cellIndices) => {
  return cellIndices.filter(cellIndex => state.board[cellIndex].size !== 1);
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
  const nonResolvedRowIndices = filterResolvedCells(state, rowIndices);
  const rowDeletedValueCount = countValueInCells(
    state,
    nonResolvedRowIndices,
    deletedValue
  );

  // col
  const colIndices = getColIndicesFromCellIndex(state, modifiedCellIndex);
  const nonResolvedColIndices = filterResolvedCells(state, colIndices);
  const colDeletedValueCount = countValueInCells(
    state,
    nonResolvedColIndices,
    deletedValue
  );

  const results = [];
  if (rowDeletedValueCount === 1) {
    results.push(
      findCellIndexWithValue(state, nonResolvedRowIndices, deletedValue)
    );
  }
  if (colDeletedValueCount === 1) {
    results.push(
      findCellIndexWithValue(state, nonResolvedColIndices, deletedValue)
    );
  }
  return results;
};

// *** MAIN ***

const solveSkyscraper = clues => {
  let state = initializeState(clues);
  performEdgeClueInitialization(state);
  console.log('FINISHED CLUES');
  // queueProcessor(state);

  return state;
};

export default solveSkyscraper;

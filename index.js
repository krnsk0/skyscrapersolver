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

const edgeClueInitialization = state => {};

// ********* MAIN ***********

const solveSkyscraper = clues => {
  let state = initializeState(clues);
  state = edgeClueInitialization(state);
  // todo
  return [];
};

// ********* RUN ***********

const clues = [1, 0, 0, 2, 3, 0, 0, 0, 0, 2, 0, 0, 0, 2, 3, 0];
const result = solveSkyscraper(clues);
console.log('result: ', result);

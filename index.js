'use strict'

// Returns an array, [min, ..., max], inclusive
const inclusiveRange = (min, max) =>
  Array.from({length: max - min + 1}, (_, i) => i + min)

// constraint list factory
const constraintListFactory = clues => {
  return Array.from({ length: N * N }, (cell) => inclusiveRange(1, N))
}

// format the constraint list and print to console
const printConstraints = (list, clue) => {
  console.log('\n')
  console.log('IDX\tCONSTRAINTS')
  list.forEach((row, idx) => {
    console.log(`${idx}\t[ ${row.join('')} ]`)
  })
}

// convert cell indices to x, y coords
const idxToX = (idx) => idx % N
const idxToY = (idx) => Math.floor(idx / N)

// get resolved value of a constraint cell
const resolveCell = constraint => constraint.length === 1 ? constraint[0] : 0

// write value to index of board
// signature allows calling in reducer
const writeToBoard = (board, value, index) => {
  board[idxToY(index)][idxToX(index)] = value
  return board
}

// creates an empty board
const boardFactory = () => Array.from({ length: N }, row => Array(N).fill(0))

// convert a constraint list to a multidimensional array
const listToBoard = list => {
  const board = boardFactory()
  return list.map(resolveCell)
             .reduce(writeToBoard, board)
}

// print a board
const printBoard = (list, clues) => {
  const board = listToBoard(list)

  const zerosToSpaces = x => x ? x : ' '
  const topClues = clues.slice(0, N).map(zerosToSpaces)
  const rightClues = clues.slice(N, 2 * N).map(zerosToSpaces)
  const leftClues = clues.slice(3 * N, 4 * N).map(zerosToSpaces).reverse()
  const bottomClues = clues.slice(2 * N, 3 * N).map(zerosToSpaces).reverse()

  console.log('\n')
  console.log(`  ${topClues.join('')}\n`)
  board.forEach((row, rowIdx) => {
    console.log(`${leftClues[rowIdx]} ${row.join('')} ${rightClues[rowIdx]}`)
  })
  console.log('')
  console.log(`  ${bottomClues.join('')}`)
}

// functions to edit the constraint lists
const crossOff = (list, idx, ...values) => {
  list[idx] = list[idx].filter(x => !values.includes(x))
  console.assert(list[idx].length > 0, `constraint list ${idx} is empty`)
  return list
}
const crossOffAllBut = (list, idx, ...values) => {
  list[idx] = list[idx].filter(x => values.includes(x))
  console.assert(list[idx].length > 0, `constraint list ${idx} is empty`)
  return list
}
const setConstraints = (list, idx, constraints) => {
  console.assert(Array.isArray(constraints) === true, 'setConstraints passed a non-array value')
  list[idx] = constraints
  console.assert(list[idx].length > 0, `constraint list ${idx} is empty`)
  return list
}

// return adjacent cell lists corresponding to a given clue index
const adjacentsFromClueIndex = index => {
  // top clues
  if (index < N) {
    const max = (N * N) - 1
    return inclusiveRange(0, max)
           .filter(x => x % N === index)
  }
  // right clues
  else if (index >= N && index < 2 * N) {
    const min = N * (index - N)
    const max = N * (index - N) + N - 1
    return inclusiveRange(min, max).reverse()
  }
  // bottom clues
  else if (index >= 2 * N && index < 3 * N) {
    const max = (N * N) - 1
    const remainder = ((3 * N) - index) - 1
    return inclusiveRange(0, max)
           .filter(x => x % N === remainder)
           .reverse()
  }
  // left clues
  else if (index >= 3 * N && index < 4 * N) {
    const min = (((4 * N) - index - 1) * N)
    const max = (((4 * N) - index - 1) * N) + N - 1
    return inclusiveRange(min, max)
  }
}

// Push changes to constraints based on the clues
const clueEdgeConstraints = (list, clues) => {
  console.log('Parsing clue edge constraints')

  // iterate the clues and handle different cases
  clues.forEach((clue, clueIndex) => {

    // store indices to the row/col corresponding to clue
    const cellIndices = adjacentsFromClueIndex(clueIndex)

    // if clue is 1, adjacent is n
    if (clue === 1) list = setConstraints(list, cellIndices[0], [N])

    // if clue is n, row/col is 1...n
    if (clue === N) {
      inclusiveRange(0, N).forEach(i => list = setConstraints(list, cellIndices[i], [i + 1]))
    }

    // 2 clues eliminate n in adjacent and n-1 in second cell
    // TEST THIS!!!
    if (clue === 2) {
      list = crossOff(list, cellIndices[0], N)
      list = crossOff(list, cellIndices[1], N - 1)
    }

    // if clue is between 2 and n - 1:
    // for clue n - k, where c is distance of cell from edge, exclude all from 1 to k + c
    if (clue > 1 && clue < N) {
      const k = N - clue
      cellIndices.forEach((cellIndexValue, c) => {
        let valuesToNotCrossOff = inclusiveRange(1, k + c + 1)
        list = crossOffAllBut(list, cellIndices[c], ...valuesToNotCrossOff)
      })
    }
  })
  return list
}





// *** SCRATCH *** //

const clues7x7 = [ 3, 3, 2, 1, 2, 2, 3, 4, 3, 2, 4, 1, 4, 2, 2, 4, 1, 4, 5, 3, 2, 3, 1, 4, 2, 5, 2, 3]
const clues4x4 = [2, 2, 1, 3, 2, 2, 3, 1, 1, 2, 2, 3, 3, 2, 1, 3]


const solvePuzzle = clues => {
  // declare N in global context
  global.N = clues.length / 4

  // run stuff
  let list = constraintListFactory(clues)
  list = clueEdgeConstraints(list, clues)
  printConstraints(list)
  printBoard(list, clues)



}
solvePuzzle(clues4x4)

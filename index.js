'use strict'

// Factory function that returns a fresh constraint list
// representing an empty board. Attaches the clues as a property
// of this array; derives the board size from the clues.
// Initializes a property called 'prop', for 'propagated' for each
// cell to false. We'll use that property later.
function contstraintListFactory(clues) {
  let n = clues.length / 4
  let list = Array.from({length: n * n}, (cell) => Array.from({length: n}, (c, i) => i + 1))
  list.forEach(constraintList => constraintList.prop = false)
  list.clues = clues
  return list
}

// Formats a constraint list
// to print to the console.
function printConstraints(list) {
  console.log('\n')
  list.forEach((row, idx) => {
    console.log(`${idx}\t[ ${row.join('')} ]`)
  })
}

// A small helper function that takes an index
// plus the board size, n, and returns an x, y pair
// for this index
function idxToXy(idx, n) {
  return [idx % n, Math.floor(idx / n)]
}

// This takes a list of constraints from 0 to n
// and returns a multidimensional array, using
// the constraint list data to determine values.
// Cells that have not yet been constrained to a
// single value are left in an initial zero state.
function listToBoard(list) {
  let n = Math.sqrt(list.length)
  let board = Array.from({length: n}, row => Array.from({length: n}, cell => 0))
  list.forEach((constraint, idx) => {
    if (constraint.length === 1) {
      let [x, y] = idxToXy(idx, n)
      board[y][x] = constraint[0]
    }
  })
  return board
}


// This takes a constraint list as an input, assuming
// that clues have been added by the factory function,
// and formats it for printing to the console.
function printBoard(list) {
  let n = Math.sqrt(list.length)
  let board = listToBoard(list)
  const spaces = x => x === 0 ? ' ' : x
  let topClues = list.clues.slice(0, n).map(spaces)
  let rightClues = list.clues.slice(n, 2 * n).map(spaces)
  let leftClues = list.clues.slice(3 * n, 4 * n).map(spaces).reverse()
  let bottomClues = list.clues.slice(2 * n, 3 * n).map(spaces).reverse()

  console.log('\n')
  console.log(`  ${topClues.join('')}\n`)
  board.forEach((row, idx) => {
    console.log(`${leftClues[idx]} ${row.join('')} ${rightClues[idx]}`)
  })
  console.log('')
  console.log(`  ${bottomClues.join('')}`)
}

// This function crosses off values
// from the constraint list at the given index.
// Multiple values can be passed to cross off.
// The assertion fails when the caller asks this
// function to cross off the last value in a constraint
// list. The value of the 'prop' flag is preserved.
function crossOff(list, idx, ...values) {
  let prop = list[idx].prop
  values.forEach(val => {
    list[idx] = list[idx].filter(x => x !== val)
  })
  list[idx].prop = prop
  console.assert(list[idx].length >= 1, `constraint list ${idx} is empty`)
  return list
}

// same as above but inverted
function crossOffAllBut(list, idx, ...values) {
  let prop = list[idx].prop
  console.log('start list', list[idx])

  list[idx] = list[idx].filter(x => values.includes(x))

  console.log('end list', list[idx])
  list[idx].prop = prop
  console.assert(list[idx].length >= 1, `constraint list ${idx} is empty`)
  return list
}


// Taking a clue's index and board size as input,
// this function returns an ordered array
// containing indices of cells adjacent to this clue
// starting from the side of the board the clue touches.
// This is to allow us to standardize how we push changes
// into our constraint list without having to worry about
// whehter the clue is top, left, etc.
function getListOfAdjacentsFromClueIndex(index, n) {
  // run for top clues
  if (index < n) {
    let x = index
    let indices = Array.from({length: n ** 2}, (c, i) => i)
    let colIndices = indices.filter(col => col % n === x)
    return colIndices
  }
  // run for right clues
  else if (index >= n && index < 2 * n) {
    let y = index - n
    let rowIndices = Array.from({length: n}, (c, i) => (n * y) + i )
    return rowIndices.reverse()
  }
  // run for bottom clues
  else if (index >= 2 * n && index < 3 * n) {
    let x = ((3 * n) - index) - 1
    let indices = Array.from({length: n ** 2}, (c, i) => i)
    let colIndices = indices.filter(col => col % n === x)
    return colIndices.reverse()
  }
  // run for left clues
  else if (index >= 3 * n && index < 4 * n) {
    let y = ((4 * n) - index) - 1
    let rowIndices = Array.from({length: n}, (c, i) => (y * n) + i)
    return rowIndices
  }
}


// This function takes a constraint list array with clues stored
// in its list property and pushes changes to the constraints
// based on the clues.
function clueEdgeConstraints(list) {
  console.log('Parsing inital clue constraints')
  let n = Math.sqrt(list.length)
  list.clues.forEach((clue, clueIndex) => {
    // push constraint: adjacent must be n
    if (clue === 1) {
      let indices = getListOfAdjacentsFromClueIndex(clueIndex, n)
      let values0toN = Array.from({length: n}, (c, i) => i + 1)
      let valuesToCrossOff = values0toN.filter(c => c !== n)
      list = crossOff(list, indices[0], ...valuesToCrossOff)
    }
    // push constraint: adjacent is 1, next is 2... to n
    else if (clue === n) {
      let indices = getListOfAdjacentsFromClueIndex(clueIndex, n)
      indices.forEach((indexValue, i) => {
        let values0toN = Array.from({length: n}, (c, i) => i + 1)
        let valuesToCrossOff = values0toN.filter(c => c !== i + 1)
        list = crossOff(list, indexValue, ...valuesToCrossOff)
      })
    }
    //
    else if (clue > 1 && clue < n) {
      let k = n - clue
      let indices = getListOfAdjacentsFromClueIndex(clueIndex, n)
      indices.forEach((indexValue, i) => {
        // i is distance from edge
        let valuesToNotCrossOff = Array.from({length: k + i + 1}, (c, i) => i + 1)
        let valuesToCrossOff = Array.from({length: n}, (c, i) => i + 1).filter(x => !valuesToNotCrossOff.includes(x))
        list = crossOff(list, indexValue, ...valuesToCrossOff)
      })
    }
  })
  return list
}

// This function checks to see if there are any cells
// that can be resolved by process of elimination,
// which is possible when a given number is crossed off
// for all cells but one in a row or column
function processOfElimination(list) {
  console.log('  Running PoE')
  let n = Math.sqrt(list.length)

  // iterate each possible value n
  for (let nValue = 1; nValue <= n; nValue += 1) {

    // iterate row/col indices
    for (let rowColIdx = 0; rowColIdx < n; rowColIdx += 1) {

      // sum up appearances of this n value in each row
      let rowIndices = Array.from({length: n}, (c, i) => i + (rowColIdx * n))
      let totalNsInRow = rowIndices.reduce((a, idx) =>
        list[idx].includes(nValue) ? a += 1 : a, 0)
      if(totalNsInRow === 1) {
        let indexOfRowPoeResult = rowIndices.filter(idx => list[idx].includes(nValue) && list[idx].length > 1)
        if (indexOfRowPoeResult.length > 0) {
          console.log(`    Row PoE result ${nValue} at idx ${indexOfRowPoeResult}`)
          let valuesToCrossOff = Array.from({length: n}, (c, i) => i + 1).filter(v => v !== nValue)
          list = crossOff(list, indexOfRowPoeResult[0], ...valuesToCrossOff)
        }
      }

      // sum up appearances of this n value in each row
      let indices = Array.from({length: n ** 2}, (x, i) => i)
      let colIndices = indices.filter(i => i % n === rowColIdx)
      let totalNsInCol = colIndices.reduce((a, idx) =>
        list[idx].includes(nValue) ? a += 1 : a, 0)
      if(totalNsInCol === 1) {
        let indexOfColPoeResult = colIndices.filter(idx => list[idx].includes(nValue) && list[idx].length > 1)
        if (indexOfColPoeResult.length > 0) {
          console.log(`    Col PoE result ${nValue} at idx ${indexOfColPoeResult}`)
          let valuesToCrossOff = Array.from({length: n}, (c, i) => i + 1).filter(v => v !== nValue)
          list = crossOff(list, indexOfColPoeResult[0], ...valuesToCrossOff)
        }
      }

    }
  }
  return list
}



// This function checks the constraint list for cells
// for whom all but one value has been ruled out,
// and for any cells among these whose consequences for other
// cells have not yet been drawn out (this if the 'prop'
// property, short for 'propagated', on the list),
// the function crosses off the value of that cell
// for others in its row/column
function propagateConstraints(list) {
  console.log('  Propagaging from completed cells')

  let n = Math.sqrt(list.length)
  list.forEach((constraintList, idx) => {
    if (constraintList.prop === false && constraintList.length === 1) {

      let valueToCrossOff = constraintList[0]
      console.log('    Propagating val', valueToCrossOff, 'at idx', idx)
      let [x, y] = idxToXy(idx, n)

      // cross of valueToCrossOff for every cell in row y
      let rowIndices = Array.from({length: n}, (x, i) => i + (y * n))
      rowIndices = rowIndices.filter(i => i !== idx)
      for (let rowIndex = 0; rowIndex < rowIndices.length; rowIndex += 1) {
        let rowIdxToCrossOff = rowIndices[rowIndex]
        list = crossOff(list, rowIdxToCrossOff, valueToCrossOff)
      }

      // cross off valueToCrossOff for every cell in column x
      let indices = Array.from({length: n ** 2}, (x, i) => i)
      let colIndices = indices.filter(i => i % n === x && i !== idx)
      for (let colIndex = 0; colIndex < colIndices.length; colIndex += 1) {
        let colIdxToCrossOff = colIndices[colIndex]
        list = crossOff(list, colIdxToCrossOff, valueToCrossOff)
      }

      // mark constraints as propagated
      list[idx].prop = true
    }
  })
  return list
}


// gets value for a cell from list
function getValueFromIndex(list, idx) {
  let n = Math.sqrt(list.length)
  if (list[idx].length === 1) return list[idx][0]
  else return 0
}

// takes an array of arrays of variable size
// returns an array of subarrays with each possible
// combination of the elements in each array of the input
function arrayCombinations(inputArray) {
  let results = []
  function helper(arr, i) {
    for(let j = 0, len = inputArray[i].length; j < len; j += 1) {
      let copy = arr.slice()
      copy.push(inputArray[i][j])
      if (i === inputArray.length - 1) {
        results.push(copy)
      }
      else helper(copy, i+ 1)
    }
  }
  helper([], 0)
  return results
}

// takes an array of ints as imput
// returns true if it has no repeats
// otherwise returns false
// intended to be called in a filter
function hasNoRepeats(arr) {
  let result = true
  for(let i = 0; i < arr.length; i += 1) {
    let restOfArray = arr.slice(i + 1)
    if (restOfArray.includes(arr[i])) result = false
  }
  return result
}

// tests a completed row against a clue
// returns true of it passes test
// returns false otherwise
function checkClue(arr, clue) {
  let vis = 0
  let max = 0
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] > max) {
      vis += 1
      max = arr[i]
    }
  }
  return vis === clue
}


// takes an array of arrays each representing a row
// returns an array with the value for solved cells
// and 0 for unsolved cells
function getResolvedCellsFromComboList(array) {
  let result = []
  for (let i = 0; i < array[0].length; i += 1) {
    result.push([])
  }
  array.forEach(combo => {
    combo.forEach((cell, i) => {
      if (!(result[i].includes(cell))) result[i].push(cell)
    })
  })
  return result
}

// returns opposite clue index
// only works for top and left
function getOppositeClue(idx, n) {
  if (idx < n) return (3 * n) - 1 - idx
  else if (idx >= (3 * n)) return (2 * n) - 1 - (idx % n)
  else throw 'invalid clue index; not on top or left'
}

// Generates every possible combination fow row/column,
// filters for those that pass both clue tests,
// derives solved cells from looking at what is
// common to all remaining combos. Updates cells
// in the list that have been solved.
// Returns true if it solved anything
function combinatorialClueProcessor(list, clueIndex) {
  console.log(`  Running clue processor for ${clueIndex}`)
  let n = Math.sqrt(list.length)

  // pull up indices for the selected clue index
  let rowIndices = getListOfAdjacentsFromClueIndex(clueIndex, n)

  // create array of our row constraints
  let rowConstraints = rowIndices.map(idx => list[idx].slice())

  // generate all possible row combos from constraint lists
  let combinations = arrayCombinations(rowConstraints).filter(hasNoRepeats)

  // pull up our clues
  let clueL = list.clues[clueIndex]
  let clueR = list.clues[getOppositeClue(clueIndex, n)]
  console.log('    clues:', clueL, clueR)

  // quit if both clues are zero
  if (clueL === 0 && clueR === 0) return false

  // filter for combinations that pass clue tests
  if (clueL !== 0) combinations = combinations.filter(combo => checkClue(combo, clueL))
  if (clueR !== 0) combinations = combinations.filter(combo => checkClue(combo.slice().reverse(), clueR))

  // see what we learned...
  let madeChanges = false
  let resolvedCells = getResolvedCellsFromComboList(combinations)
  resolvedCells.forEach((possibilities, index) => {
    // if we solved it here, and if it's not solved in the constraint data,
    // then push it to the data
    if (possibilities.length === 1 && rowConstraints[index].length > 1) {
      let solvedIndex = rowIndices[index]
      console.log(`  idx ${solvedIndex} must be ${possibilities[0]}`)
      crossOffAllBut(list, solvedIndex, possibilities[0])
      madeChanges = true
    }

    // can we constrain any cells further?
    if (rowConstraints[index].length > 1 && rowConstraints[index].length !== possibilities.length) {
      possibilities = possibilities.sort((a,b) => a - b)
      let solvedIndex = rowIndices[index]
      console.log(`constraining ${solvedIndex} to ${possibilities}`)
      crossOffAllBut(list, solvedIndex, ...possibilities)
      madeChanges = true
    }

  })

  if (madeChanges) return true
  else return false
}



// This function runs the various forms of
// constraint propagation and inference in sequence
// until it detects no changes between runs
function solverLoop(list) {
  let n = Math.sqrt(list.length)

  let iterCount = 0
  while(true) {
    iterCount += 1
    console.log(`Iteration ${iterCount} of propagation loop`)

    let frozenStart = JSON.stringify(list)

    // do POE and propagation
    list = processOfElimination(list)
    list = propagateConstraints(list)

    // generate list of top & left clue indices to run combinatorial clue processor
    let topClues = Array.from({length: n}, (c, i) => i)
    let leftClues = Array.from({length: n}, (c, i) => i + (3 * n))
    let clueIndices = [...topClues, ...leftClues]
    clueIndices.forEach(clueIndex => {
      let changes = combinatorialClueProcessor(list, clueIndex)
      if (changes) {
        list = processOfElimination(list)
        list = propagateConstraints(list)
      }
    })

    let frozenEnd = JSON.stringify(list)
    if (frozenStart === frozenEnd) {
      console.log(`Breaking after no change on iter ${iterCount}`)
      break
    }
  }

  return list
}

// This is the top-level function that calls everything else.
function solvePuzzle(clues) {
  let list = contstraintListFactory(clues)
  list = clueEdgeConstraints(list)
  list = solverLoop(list)
  printConstraints(list)
  printBoard(list)

  let board = listToBoard(list)
  return board
}



// ************

var clues = [ 0, 2, 3, 0, 2, 0, 0, 5, 0, 4, 5, 0, 4, 0, 0, 4, 2, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0 ]
solvePuzzle(clues)

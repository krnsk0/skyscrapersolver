'use strict'

// outputs an array [min...max] includisve
const inclusiveRange = (min, max) => Array.from({
  length: max - min + 1
}, (_, i) => i + min)

// gets board size from clue list
const sizeFromClues = clues => clues.length / 4

// constraint list factory
const constraintListFactory = clues => {
  let n = sizeFromClues(clues)
  let list = Array.from({
    length: n * n
  }, (cell) => inclusiveRange(1, n))
  return list
}

// format the constraint list and print to console
const printConstraints = list => {
  console.log('\n')
  console.log('CONSTRAINT LIST:')
  list.forEach((row, idx) => {
    console.log(`${idx}\t[ ${row.join('')} ]`)
  })
}

// *** SCRATCH *** //

const clues = [
  3, 3, 2, 1, 2, 2, 3,
  4, 3, 2, 4, 1, 4, 2,
  2, 4, 1, 4, 5, 3, 2,
  3, 1, 4, 2, 5, 2, 3
]
let list = constraintListFactory(clues)
printConstraints(list)

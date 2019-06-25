# Cracking the Skyscraper Puzzle: Part 1

A relative of Sudoku and other [Latin-Square](https://en.wikipedia.org/wiki/Latin_square)-derived puzzles, the [skyscraper](https://www.conceptispuzzles.com/index.aspx?uri=puzzle/skyscrapers/rules) puzzle asks the player to place buildings of varying & unique heights on a grid in a way that satisfies clues given on the grid's edges. These "edge clues" tell the player how many buildings are visible from the standpoint of a given clue's placement along the board's edge.

Taller skyscrapers block the visibility of shorter skyscrapers, but not vice versa. For example, in a 4x4 puzzle, the row 2-4-3-1 has two skyscrapers visible from its left side, and three on its right side. Both would be valid clues a puzzle author could provide, for this row-- but notably, the starting point for a skyscraper puzzle need not provide clues for every side of each row and column. Often, the fewer clues given, the harder the puzzle.

This article walks through the use of [constraint propagation](https://en.wikipedia.org/wiki/Constraint_satisfaction), a technique dating to the era of [symbolic AI](https://en.wikipedia.org/wiki/Symbolic_artificial_intelligence), to model the inferential techniques employed by skyscraper enthusiasts-- using Javascript and Node. We'll first build up an algorithm capable of solving _published_ puzzles of arbitrary size and difficulty without resorting to backtracking, and later add backtracking to allow us to solve _all_ possible puzzles, full-stop.

## Approach

Why the caveat that we'll only at first be able to efficiently solve _published_ puzzles?

Skyscraper puzzle authors make a rule of only publishing games which can be solved without using guess-and-check, the enthusiast's name for recursive backtracking search. Published puzzles thus ought to be solvable programmatically without backtracking provided we can programmatically imitate the way players think about the game.

When solving puzzles, enthusiasts typically alternate through applying several forms of inference to reason about the board, with skilled players deciding the sequence in which to employ these forms of inference according to some higher-order heuristics.

Let's begin with these forms of inference. Performed at the start of a game, **edge clue initialization**, allows players to derive initial information about rows and columns starting from their clues, in some cases allowing us to determine the values of cells outright and in other cases allowing us to rule out certain values. (2) **Constraint propagation** allows players, once a the value of a cell has been determined, to rule out that value for all cells in the resolved cell's row and column. (3) **Process of elimination** allows players to resolve cells when all but one value has been eliminated for that cell. Finally, (4) **Clue Elimination** allows players to look back at the clues, having performed (1) and iterated through some rounds of (2) and (3), to look back at clues to rule out values and resolve additional cells.

Beginner players often start by learning to apply edge clue initialization, constraint propagation, and process of elimination. Skilled players, in addition to an acquired mastery of these, are marked by two further characteristics: grasp of a sizable repertoire of patterns which allow rapid application of clue elimination, and a good "feel" for the order in which to apply techniques 2-4 to quickly solve a puzzle.

The code we build up won't be able to model everything a sophisticated organic neural network brings to skyscraper game using constraint propagation, but we'll get close. We'll alternate between describing these forms of inference and implementing them in code, starting with edge clue initialization.

## Edge Clue Initialization: Approach

In a board of size N, a clue with value N allows us to resolve an entire row or column:

<table style="margin: 5px auto;">
  <tbody>
    <tr>
      <td style="border: 0px; width: 1em;">5</td>
      <td style="border: 1px solid; width: 1em;">1</td>
      <td style="border: 1px solid; width: 1em;">2</td>
      <td style="border: 1px solid; width: 1em;">3</td>
      <td style="border: 1px solid; width: 1em;">4</td>
      <td style="border: 1px solid; width: 1em;">5</td>
    </tr>
  </tbody>
</table>

A clue with value 1 allows us to resolve only the first cell:

<table style="margin: 5px auto;">
  <tbody>
    <tr>
      <td style="border: 0px; width: 1em;">1</td>
      <td style="border: 1px solid; width: 1em;">5</td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
    </tr>
  </tbody>
</table>

While clues between 1 and N don't let us resolve cells, they do allow us to rule out some values. For example, on a 5x5 board, a 4 clue allows us to rule out 5, 4, and 3 for the adjacent cell: a 5 would block all other buildings, making only one visible where we need four; a 4 would allow for only one taller where we need three; and a 3 would allow for only two taller where we need three. For the second cell in, a 4 clue lets us rule out 5 and 4: a 5 would mean a maximum of two buildings are visible, and while 4 would mean a maximum of three are visible. Finally, for the third cell in, a 4 clue lets us rule out a building with a height of 5.

<table style="margin: 5px auto;">
  <tbody>
    <tr>
      <td style="border: 0px; width: 1em;">5</td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em; color: red;">5</td>
      <td style="border: 0px; width: 1em; color: red;">5</td>
      <td style="border: 0px; width: 1em; color: red;">5</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">5</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">5</td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em; color: red;">4</td>
      <td style="border: 0px; width: 1em; color: red;">4</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">4</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">4</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">4</td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em; color: red;">3</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">3</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">3</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">3</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">3</td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em; color: lightgreen;">2</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">2</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">2</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">2</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">2</td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em; color: lightgreen;">1</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">1</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">1</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">1</td>
      <td style="border: 0px; width: 1em; color: lightgreen;">1</td>
    </tr>
  </tbody>
</table>

In general, this rule can be expressed as follows. For clues `c` where `1 < c < N`, where `d` is the distance from the edge counting from zero, and where `k` is `N - c`, we can cross off all values from `k + 2 + d` up to `N`, inclusive.

## First Steps

We'll need a data structure to represent the current state of our knowledge of possibilities for a cell. Arrays would work fine, but Javascript's Set object gets us `.delete()`, which will sweeten syntax later. Let's call our structure a **constraint list**.

```javascript
const constraintListFactory = N => {
  return new Set(Array.from({ length: N }, (_, i) => i + 1));
};
```

How to store the state of our knowledge of possibilities for the entire board? We could use an NxN multidimensional array, but operations involving iteration will be simpler with an array of length N^2.

```javascript
const boardFactory = N => {
  return Array.from({ length: N * N }, () => constraintListFactory(N));
};
```

Let's plan on our top-level function taking in clues in an array that corresponds to possible clue positions starting from the top-left going clockwise around the board. If we're given an array with length 16--say, `[1, 0, 0, 2, 3, 0, 0, 0, 0, 2, 0, 0, 0, 2, 3, 0]`-- we'll know we have a 4x4 board that initially looks like this:

<table style="margin: 5px auto;">
  <tbody>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;"></td>
      <td style="border: 0px; width: 1em;">1</td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;">2</td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 0px; width: 1em;">3</td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;">3</td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;">2</td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 1px solid; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;"></td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;">2</td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>

  </tbody>
</table>

Because we're choosing to store our board as a single-dimensional array, we'll need some helpers to allow us to access our data by row and column. Let's have these functions take in a row or column index, counting from zero in the top left, and return an array of indices pointing to the corresponding constraint lists. The caller will also need to pass in N, the size of the board.

```javascript
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
```

It will also often be necessary to access rows and columns corresponding to a particular clue's index. We'll also need the rows and columns to be returned to us from the standpoint of that clue. That is, if we're in clue position 5 on a 4x4 board, we'll want to 'see' row zero, only in 'reverse' with respect to a coordinate system starting in the upper-left corner:

```javascript
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
```

Let's start laying down some top-level infrastructure. We'll need `solveSkyscraper` function that accepts clues and returns a solution.

But how should we store and pass around our state? It would certainly be convenient to keep our board, clues, the value of `N`, and so on as globals rather than passing them in to our functions. We won't be writing concurrent or asynchronous code and won't at least for these reasons need to bother ourselves with functional purity.

So why not just have our functions mutate some globals? It turns out that keeping state global is no problem up until we get to the point of wanting to implement recursive backtracking, when recursive calls will need to keep local state.

To avoid having to pass too many extra arguments into our functions, let's condense our state into an object:

```js
const initializeState = clues => {
  return {
    N: Math.sqrt(clues.length),
    board: boardFactory(Math.sqrt(clues.length)),
    clues
  };
};

const solveSkyscraper = clues => {
  const state = initializeState(clues);
  // todo
  return [];
};
```

## Edge Clue Initialization: Code

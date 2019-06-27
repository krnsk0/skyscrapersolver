# Cracking the Skyscraper Puzzle: Part 1

A relative of Sudoku and other [Latin-Square](https://en.wikipedia.org/wiki/Latin_square)-derived puzzles, the [skyscraper](https://www.conceptispuzzles.com/index.aspx?uri=puzzle/skyscrapers/rules) puzzle asks the player to place buildings of varying & unique heights on a grid in a way that satisfies clues given on the grid's edges. These "edge clues" tell the player how many buildings are visible from the standpoint of a given clue's placement along the board's edge.

Taller skyscrapers block the visibility of shorter skyscrapers, but not vice versa. For example, in a 4x4 puzzle, the row 2-4-3-1 has two skyscrapers visible from its left side, and three on its right side. Both would be valid clues a puzzle author could provide, for this row-- but notably, the starting point for a skyscraper puzzle need not provide clues for every side of each row and column. Often, the fewer clues given, the harder the puzzle.

This article walks through the use of [constraint propagation](https://en.wikipedia.org/wiki/Constraint_satisfaction), a technique dating to the era of [symbolic AI](https://en.wikipedia.org/wiki/Symbolic_artificial_intelligence), to model the inferential techniques employed by skyscraper enthusiasts. While building up a vocabulary of concepts to help us reason about the puzzle, we'll 'll use Javascript to also build up, first, an algorithm capable of solving _published_ puzzles of arbitrary size and difficulty without resorting to backtracking, and later build in backtracking to allow us to solve _all_ possible Skyscraper puzzles, full-stop.

## Approach

Why the caveat that we'll only at first be able to solve _published_ puzzles?

A valid skyscraper puzzle is a collection of clues which contain enough information to permit one and only one solution. Skyscraper puzzle authors make a rule of only publishing puzzles which are not only valid, but which can be solved _without using guess-and-check_, the enthusiast's name for recursive backtracking search. Published puzzles thus ought to be solvable programmatically without backtracking provided we can imitate the way players think about the game.

How to approach this? When solving puzzles, enthusiasts typically alternate through applying several forms of inference to reason about the board, with skilled players deciding the sequence in which to employ these forms of inference according to some higher-order heuristics.

Let's begin with these forms of inference.

1. Performed at the start of a game, **edge clue initialization** allows players to derive initial information about rows and columns starting from their clues, in some cases allowing us to determine the values of cells outright and in other cases allowing us to rule out certain values.

2. **Resolved cell constraint propagation** allows players, once a the value of a cell has been determined, to rule out that value for all cells in the resolved cell's row and column.

3. **Process of elimination** resolves a cell to a value when it is the only cell in a given row or column for whom said value has not been eliminated.

4. Finally, **clue elimination** allows players--having applied method (1) and iterated through some successive applications of methods (2) and (3)--to look back at clues to rule out values and resolve additional cells.

Beginner players often start by learning to apply edge clue initialization, resolved cell constraint propagation, and process of elimination. Skilled players, in addition to an acquired mastery of these inferential techniques, are marked by two further characteristics: grasp of a sizable repertoire of patterns which allow rapid application of clue elimination, and a good "feel" for the order in which to iteratively apply techniques 2-4 to quickly solve a puzzle.

The code we build up won't be able to model everything a sophisticated organic neural network brings to the skyscraper puzzle, but we'll get close. We'll alternate between describing these forms of inference and implementing them in code, starting with edge clue initialization.

## Edge Clue Initialization: Approach

In a board of size N, a clue with value N allows us to resolve an entire row or column:

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
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

A 1 clue allows us to resolve only the adjacent cell:

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
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

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
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

In general, this rule can be expressed as follows. On an `N * N` board, for clues `c` where `1 < c < N`, where `d` is the distance from the edge counting from zero, we can cross off all values from `N - c + 2 + d` up to `N`, inclusive.

Given the above example, let's calculate what to cross off for the second cell over from our 5 clue. We're 1 cell from the edge, which is `d`; we know `c` is 5; and, we're on a 5x5 board, so `N` is 5. `N - c + 2 + d`, then, is 3. So we can cross off all values from 3 to 5, inclusive, for this cell. Call this the **edge constraint rule**. I won't walk through how it can be derived or proven-- but trust me that it works.

## First Steps

We'll need a data structure to represent the current state of our knowledge of possibilities for a cell. Arrays would work fine, but Javascript's Set object gets us some nice built-ins which will sweeten our syntax. Let's call this structure which represents remaining possibilities for a cell a **constraint list**.

```javascript
const constraintListFactory = N => {
  return new Set(Array.from({ length: N }, (_, i) => i + 1));
};
```

How to store our knowledge of possibilities for the entire board? We could use a multidimensional array, but operations that involve iterating the board will be simpler with an array of length `N * N`.

```javascript
const boardFactory = N => {
  return Array.from({ length: N * N }, () => constraintListFactory(N));
};
```

Let's plan on our top-level function accepting clues in the form of an array which starts from the top left and goes clockwise around the board. If we're given an array with length 16--say, `[1, 0, 0, 2, 3, 0, 0, 0, 0, 2, 0, 0, 0, 2, 3, 0]`-- we'll know we have a 4x4 board that initially looks like this:

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
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
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;">2</td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>

  </tbody>
</table>

Because we're choosing to store our board as a single-dimensional array, we'll need some helpers to allow us to access our data by row and column, where we need to. Let's have these functions take in a row or column index, counting from zero in the top left, and return an array of indices pointing to the corresponding constraint lists. The caller will also need to pass in N, the size of the board.

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

It will also often be necessary to access rows and columns corresponding to a particular clue's index, so we'll need the rows and columns to be returned to us from the standpoint of that clue. That is, if we're in clue position 5 on a 4x4 board, we'll want to 'see' row zero, only in 'reverse' with respect to a coordinate system starting in the upper-left corner. Here's a function which wrangles returning the correct cell indices in the correct order for clues on all sides of the board:

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

To get everything moving we'll need some top-level infrastructure, starting with a `solveSkyscraper` function that accepts clues and returns a solution. But how should we store and pass around our state? It would certainly be convenient to keep our board, clues, the value of `N`, and so on as globals rather than passing them in to our functions-- or at least convenient to keep them in the scope of our "top-level" function such that they don't need to be passed around, so much.

We won't be writing concurrent or asynchronous code, and won't at least for these reasons need to bother ourselves with functional purity. But, once we get to the point where we need backtracking recursion, we'll need to avoid mutating state in the enclosing scope, as the bookkeeping to roll back mutations after a backtrack might get prohibitively complex. So we'll be writing some functions that can mutate--those not involved in backtracking recursion--and others which cannot. We'll have to pay close attention to this distinction as we proceed.

In any case, to avoid having to pass too many extra arguments into our functions, let's condense our state into an object:

```js
const initializeState = clues => {
  return {
    N: Math.sqrt(clues.length),
    board: boardFactory(Math.sqrt(clues.length)),
    clues
  };
};
```

Storing `N` in our state object lets us avoid having to repeat `Math.sqrt()` all over the place. We'll be adding more to this state object later, but this is a fine starting point. We can kick things off like this:

```js
const solveSkyscraper = clues => {
  let state = initializeState(clues);
  // todo
  return [];
};
```

Now we're ready to start solving.

## Edge Clue Initialization: Code

To perform edge clue initialization, we'll need to iterate our clues, get the corresponding row and column indices, and cross of values based on the general form of our edge constraint rule. Let's combine what we've written so far, starting for `1 < c < N`:

```js
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
    const cellIndices = getCellIndicesFromClueIndex(clueIndex, state.N);

    // apply the edge constraint rule
    if (1 < c && c < state.N) {
      cellIndices.forEach((cellIndex, distance) => {
        const cell = state.board[cellIndex];
        constrainCellWithClue(cell, c, distance);
      });
    }
    // resolve the first cell to N when the clue is 1
    else if (c === 1) {
      const cell = state.board[cellIndices[0]];
      cell.clear();
      cell.add(state.N);
    }
    // resolve the entire row when the clue is N
    else if (c === state.N) {
      cellIndices.forEach((cellIndex, distance) => {
        const cell = state.board[cellIndex];
        cell.clear();
        cell.add(distance + 1);
      });
    }
  });
};
```

First we define a helper, then iterate all of the clues, for `1 < c < N`. Then we apply the helper function to eliminate values ruled out by the clue in question. We don't need to deep clone or return our state object, here-- it's okay to mutate objects in the enclosing scope because we'll only initialize from edge clues once, and won't need to involve this code in recursion, later.

Now to go back and handle the special cases, `c === 1` and `c === N`, which allow us to completely resolve a cell and an entire row/column, respectively:

```js
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
```

## Resolved Cell Constraint Propagation

What do we have so far? We can take an empty board and cross off values for some cells based on the clues. For many boards, we'll already have resolved some cells, either because of 1 or `N` clues, or because intersecting row/column edge constraints where `1 < c < N` have narrowed cells down to just one possibility.

If we were to write code to pretty-print the state for our 4x4 example, we'd get something like this:

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
  <tbody>
    <tr>
      <td style="border: 0px; width: 1em; height: 2em;"></td>
      <td style="border: 0px; width: 1em;">1</td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;"></td>
      <td style="border: 0px; width: 1em;">2</td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;"></td>
      <td style="border: 1px solid; width: 1em;">4</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;"></td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">12</td>
      <td style="border: 0px; width: 1em;">3</td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;">3</td>
      <td style="border: 1px solid; width: 1em;">12</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 0px; width: 1em;"></td>
    </tr>
    <tr>
      <td style="border: 0px; width: 1em; height: 1.5em;">2</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
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

Our second form of inference, constraint propagation, starts from a resolved cell and rules out that value for all other cells in its row and column. Since we know our upper left corner above is 4, we can eliminate of all of the remaining 4s in the "cross" formed by first row and first column:

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
  <tbody>
    <tr>
      <td style="border: 1px solid; width: 1em;">4</td>
      <td style="border: 1px solid; width: 1em;">123<span style="color: red;">4</span></td>
      <td style="border: 1px solid; width: 1em;">123<span style="color: red;">4</span></td>
      <td style="border: 1px solid; width: 1em;">123</td>
    </tr>
    <tr>
      <td style="border: 1px solid; width: 1em;">123<span style="color: red;">4</span></td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">12</td>
    </tr>
    <tr>
      <td style="border: 1px solid; width: 1em;">12</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
    </tr>
    <tr>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
    </tr>
  </tbody>
</table>

How to implement crossing off these values programmatically? First we'll need a helper function that takes the index of a cell and returns the indices of all of all of the cells in its corresponding "cross."

```js
const getCrossIndicesFromCell = (state, cellIndex) => {
  const x = cellIndex % state.N;
  const y = Math.floor(cellIndex / state.N);

  return [
    ...getCellIndicesFromColIndex(x, state.N),
    ...getCellIndicesFromRowIndex(y, state.N)
  ].filter(idx => idx !== cellIndex);
};
```

Next we'll need a function that, when called with a cell index, eliminates the resolved value from the constraint lists referenced by the results of `getCrossIndicesFromCell()`. We'll assume this function always gets called on a constraint list with just one value remaining and throw otherwise, and we'll use iterator syntax to access the remaining value in our set object:

```js
const propagateFromResolvedCell = (originalState, cellIndex) => {
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
```

How to call this function? After applying the edge constraints, we can iterate our constraint lists and as soon as we find one with only a single element, call `propagateFromResolvedCell` on it:

```js
const propagateConstraints = state => {
  state.board.forEach((cell, cellIndex) => {
    if (cell.size === 1) {
      propagateFromResolvedCell(state, cellIndex);
    }
  });
};
```

## Towards a Constraint Propagation Queue

This works fine for handling any cells that were resolved by the edge clue constraints, but what if propagating constraints from a resolved cell results in new resolved cells--that is, cells with only only one value not crossed off--such that we would want to in turn propagate constraints from these cells?

We could just call `propagateConstraints` repeatedly until we notice that nothing changes from one iteration to the next, checking every cell each time for for `cell.size === 1`. But this is a lot of extra work as most cells won't have changed. Instead, let's check constraint list size right after modifying a cell in `propagateFromResolvedCell`, which ensures we only check cells that have changed.

When we find that a cell which has just changed has size 1, how should we initiate constraint propagation for it? We could recursively call `propagateFromResolvedCell`, but this could in some circumstances lead to code that's very difficult to step through, as our algorithm "chases" changes around the board. It will be easier to reason about a "breadth first" approach in which each propagation operation finishes before the next starts. To do this, let's add a `queue` key to our state which holds an array and set up propagateConstraints to use this queue. Inside `propagateFromResolvedCell`:

```js
crossIndices.forEach(crossIndex => {
  const cell = state.board[crossIndex];
  cell.delete(valueToEliminate);
  if (cell.size === 1) {
    state.queue.push(crossIndex);
  }
});
```

Inside `propagateConstraints`, let's add a while block after we iterate the board:

```js
while (state.queue.length) {
  propagateFromResolvedCell(state, state.queue.shift());
}
```

Having established this pattern, why bother having `propagateConstraints` iterate the board at all to check for `cell.size === 1`? We could add a size check and and enqueue operation to `performEdgeClueInitialization`, and have `propagateConstraints` be driven solely by the queue. But, we'd have to perform this size check for all three cases for `c` in `performEdgeClueInitialization`, each of which use slightly different methods to alter constraint lists. We need an abstraction like a [facade](https://en.wikipedia.org/wiki/Facade_pattern) or [proxy](https://en.wikipedia.org/wiki/Proxy_pattern) around all of these methods versatile enough to handle not only the ways we modify constraint lists in the edge clue functions but also, hopefully, ways we might modify constraint lists in the future-- as we'll want to make sure we propagate constraints every time they change.

How to approach this? So far, we've used `Set.prototype.delete()` to eliminate individual values from cells, but have also used `.clear()` followed by `.add()` to quickly resolve a cell with multiple values in its constraint list to just a single value. This suggests two basic use cases: deleting a value, and deleting everything but a value. Since the latter is reducible to repeated applications of the former, let's treat `.delete()` as primitive; we'll first write an abstraction around it which also checks for `cell.size === 1` and enqueues after a successful delete, and then wrap this in a secondary abstraction which transforms cell resolutions into repeated applications of our delete abstraction. Here's what it looks like:

```js
// mutates state.queue
// mutates state.board.cellIndex
const constrainAndEnqueue = (state, cellIndex, deleteValue, resolveValue) => {
  console.assert(
    !deleteValue != !resolveValue,
    'constrainAndEnqueue called with bad arguments'
  ); // XOR check

  const constrain = (idxToConstrain, valueToDelete) => {
    const cell = state.board[idxToConstrain];
    let mutated = cell.delete(valueToDelete);
    if (mutated && cell.size === 1) {
      state.queue.push(idxToConstrain);
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
```

Besides passing in state and the cell index to mutate, we can pass in either a value to eliminate from its constraint list or a value to resolve to-- but not neither and not both. The `console.assert()` ensures this. There's also a check to make sure that after a successful delete, we haven't ended up with an empty cell, in which we've ruled out all possible values, which should never happen for a set of valid Skyscraper clues.

After updating `performEdgeClueInitialization` and `propagateFromResolvedCell` to use this new function, where does this leave us? The program is capable of making inferences from edge clues and repeatedly propagating constraints from cells resolved in this process, drawing out all possible consequences from these two methods in combination. And, the infrastructure we've put together is extensible to other forms of inference. Let's add another to the mix.

## Process of Elimination

Process of elimination allows the player to resolve a cell to a value when that value is no longer present in any other cells in either that cell's row or column. That is: if a given cell's constraint list shows a 4 as a possibility for itself, but no other cells show a four in its row or column (or both), we know that the cell in question _must_ be the 4 in its row and column.

For instance, in the example we've been working with, the absence of a 4 in all cells of column three except the third allows us to resolve that cell to 4:

<table style="margin: 5px auto; font-family: monospace; text-align: center;">
  <tbody>
    <tr>
      <td style="border: 1px solid; width: 1em;">4</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em; background-color: grey;">123</td>
      <td style="border: 1px solid; width: 1em;">123</td>
    </tr>
    <tr>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em; background-color: grey;">123</td>
      <td style="border: 1px solid; width: 1em;">12</td>
    </tr>
    <tr>
      <td style="border: 1px solid; width: 1em;">12</td>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em; background-color: grey;">123<span style="border: 1px solid; padding: 2px">4</span></td>
      <td style="border: 1px solid; width: 1em;">1234</td>
    </tr>
    <tr>
      <td style="border: 1px solid; width: 1em;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
      <td style="border: 1px solid; width: 1em;background-color: grey;">123</td>
      <td style="border: 1px solid; width: 1em;">1234</td>
    </tr>
  </tbody>
</table>

How to implement PoE? We don't want to replicate the design we optimized away, above, in which we iteratively search the entire board for some pattern or criteria-- we want to call PoE function right after we mutate cells.

In this context, we'll know what value

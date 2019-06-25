But for larger boards and some specially-constructed boards of any size, backtracking search can prove prohibitively time-complex, even when constrained by a puzzle's edge clues.

My approach diverges from that of a [well-known article](https://norvig.com/sudoku.html) applying constraint propagation to Sudoku in that I will not programmatically solve all possible Skyscraper puzzles, but only those solvable without backtracking. Generating all such puzzles for an arbitrary board size is an exercise we'll leave for another day.

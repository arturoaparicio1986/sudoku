// Runner code for Sudoku
var sudokuBoard = null;

function setText(text)
{
  document.getElementById('info-box').innerHTML = text;
}

function startSudoku(canvID, dimen)
{
  sudokuBoard = new SudokuBoard(canvID, dimen);
  setText("Sudoku");
}

function verifyBoard()
{
  if (sudokuBoard != null)
  {
    if (sudokuBoard.isValid())
      setText('Valid');
    else
      setText('Not Valid');
  }
}

function solveBoard()
{
  if (sudokuBoard != null)
  {
    if (sudokuBoard.isValid())
    {
      sudokuBoard.solve();
      if (sudokuBoard.isFilled())
        setText('Solved!');
      else
        setText('Not Valid');
      sudokuBoard.refresh();
    } else
    {
      setText('Not Valid');
    }
  }
}

// Asks a server to generate a new puzzle
function newPuzzle(difficulty)
{
  if (sudokuBoard != null)
  {
    getRequest("http://thefreebit.com/sites/all/scripts/generatePuzzle.php?difficulty=" + difficulty, 
      function(response)
      {
        var nPuzzle = JSON.parse(response);
        if (nPuzzle.length == 0)
        {
          setText("Failed. Try again.");
          return;
        }
        sudokuBoard.newBoard(nPuzzle);
        setText("New Puzzle");
      }, 
      function()
      {
        setText("Failed. Try again.");
      }
    );
  }
}

// Clears the board
function clearBoard()
{
  if (sudokuBoard != null)
  {
    sudokuBoard.newBoard();
    setText("Board Cleared");
  }
}

// Set entry
function setEntry(entry)
{
  if (sudokuBoard != null)
  {
    sudokuBoard.setEntry(entry);
  }
  return false;
}


// Helper function for cross-browser request object
// See: 
// http://stackoverflow.com/questions/7165395/call-php-function-from-javascript
function getRequest(url, success, error) {
    var req = false;
    try{
        // most browsers
        req = new XMLHttpRequest();
    } catch (e){
        // IE
        try{
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            // try an older version
            try{
                req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e){
                return false;
            }
        }
    }
    if (!req) return false;
    if (typeof success != 'function') success = function () {};
    if (typeof error!= 'function') error = function () {};
    req.onreadystatechange = function(){
        if(req .readyState == 4){
            return req.status === 200 ? 
                success(req.responseText) : error(req.status)
            ;
        }
    }
    req.open("GET", url, true);
    req.send(null);
    return req;
}

window.onload=(function()
{
  startSudoku('canvas', 400);
});
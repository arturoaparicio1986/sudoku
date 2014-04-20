/**
  Simple pure Javascript and Canvas SudokuBoard
  @author Arturo Aparicio - TheFreeBit.com
  @param canvID The id of the canvas
  @param dimen The dimension (in px) of one side of the square
  *NOTE: Places a key listener on the window
  
  Using this code: Feel free to use, modify and republish this code.
  I only ask that if you make something good, you let me know. You should 
  also allow the same usage right for anything derived from this.
  Please leave a mention to TheFreeBit.com - Thanks.
**/
function SudokuBoard(canvID, dimen)
{
  var BOARD_ROOT = 3;
  var BOARD_SIZE = BOARD_ROOT * BOARD_ROOT;
  var UNKNOWN = 0;
  var fontSize = 35;
  var fontHeightOffset = fontSize / 4;
  var font = String(fontSize) + "px Georgia";
  var strokeColor = "#428bca";
  var rootDividerWidth = 3;
  var simpleDividerWidth = 1;
  var canvas = canvID;
  var dimension = dimen;
  var rowWidth = dimension / BOARD_SIZE;
  var board; // Holds the actual board
  var cor = null; // Holds the x,y for an entry that is being hovered over
  var selected = null; // Holds the x,y for a selected entry
  var self = this;
  var allowHover = true;
  
  /**
    A single SudokuEntry 
    @param num (optional) num to set entry to, default to UNKNOWN
    @param editable (optional) true if editable, else false (default).
    @param possible (optional) an array of possible values for the entry
    No checking is done, assumed input is valid.
  **/  
  function SudokuEntry(setNum, setEditable, setPossible)
  {
    this.num = UNKNOWN;
    this.editable = true;
    this.possible = new Array(BOARD_SIZE + 1);
    
    // Returns true if at least one valid number is possible [1-BOARD_SIZE]
    this.hasPossibilities = function()
    {
      for (var i = 1; i <= BOARD_SIZE; ++i)
        if (this.possible[i]) return true;
      return false;
    }
    
    if (typeof setNum !== 'undefined')
    {
      this.num = setNum;
    }
    if (typeof setEditable !== 'undefined')
    {
      this.editable = setEditable;
    }
    if (typeof setPossible !== 'undefined')
    {
      this.possible = setPossible;
    } else
    {
      for (var n=1; n <= BOARD_SIZE; ++n)
        this.possible[n] = true;
    }
  }
  
  // Public functions
  /**
    Sets valid entries with a valid number if the entry is editable
    If x or y are undefined, assummes selected x and y if there is one
    @param num The number to place in the entry [1 - BOARD_SIZE]
    @param x The x coordinate of the entry [0 - BOARD_SIZE)
    @param y The y coordinate of the entry [0 - BOARD_SIZE)
  **/
  this.setEntry = function(num, x, y)
  {
    if (typeof x === 'undefined' || typeof y === 'undefined')
    {
      if (selected)
        this.setEntry(num, selected.x, selected.y);
      return;
    }
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE)
    {
      if (num >= 0 && num <= BOARD_SIZE && board[y][x].editable)
      {
        board[y][x].num = num;
        drawBoard();
      }
    }
  }
  
  /**
    Returns true if the board is in a valid state
    A board is valid if
    1. There are no duplicate entries in a region
    2. There are still possibilities for the unknown entries
  **/ 
  this.isValid = function()
  {
    calculatePossible();
    var entries = new Array(BOARD_SIZE + 1);
    // Calculate for the horizontal line
    for (var y = 0; y < BOARD_SIZE; ++y)
    {
      for (var i = 1; i <= BOARD_SIZE; ++i) entries[i] = false;
      for (var x = 0; x < BOARD_SIZE; ++x)
      {
        var value = board[y][x].num;
        // No number or possibilities for entry
        if (value == UNKNOWN)
        {
          if (!board[y][x].hasPossibilities())
            return false;
        } else if (entries[value])
        {
          return false;
        } else
        {
          entries[value] = true;
        }
      }
    }
    // Calculate for the vertical line
    for (var x = 0; x < BOARD_SIZE; ++x)
    {
      for (var i = 1; i <= BOARD_SIZE; ++i) entries[i] = false;
      for (var y = 0; y < BOARD_SIZE; ++y)
      {
        var value = board[y][x].num;
        // No number or possibilities for entry
        if (value == UNKNOWN)
        {
          if (!board[y][x].hasPossibilities())
            return false;
        } else if (entries[value])
        {
          return false;
        } else
        {
          entries[value] = true;
        }
      }
    }
    // Calculate for the square
    for (var yOff = 0; yOff < BOARD_SIZE; yOff += BOARD_ROOT)
    {
      for (var xOff = 0; xOff < BOARD_SIZE; xOff += BOARD_ROOT)
      {
        for (var i = 1; i <= BOARD_SIZE; ++i) entries[i] = false;
        for (var y = 0 + yOff; y < BOARD_ROOT + yOff; ++y)
        {
          for (var x = 0 + xOff; x < BOARD_ROOT + xOff; ++x)
          {
            var value = board[y][x].num;
            // No number or possibilities for entry
            if (value == UNKNOWN)
            {
              if (!board[y][x].hasPossibilities())
                return false;
            } else if (entries[value])
            {
              return false;
            } else
            {
              entries[value] = true;
            }
          }
        }
      }
    }
    return true;
  }
  
  /**
   Returns true if all the entries have a value set, does not check for validity
  **/
  this.isFilled = function()
  {
    for (var y = 0; y < BOARD_SIZE; ++y)
      for (var x = 0; x < BOARD_SIZE; ++x)
        if (board[y][x].num == UNKNOWN)
          return false;
    return true;
  }
  
  /**
    Creates a new board
    @param newBoard (optional) will set this board as the new board, expects the 
    an array of arrays of valid dimensions
  **/
  this.newBoard = function(newBoard)
  {
    if (typeof newBoard !== 'undefined')
    {
      initializeBoard();
      for (var i = 0; i < newBoard.length; ++i)
      {
        var y = newBoard[i][0] - 1;
        var x = newBoard[i][1] - 1;
        var num = newBoard[i][2];
        board[y][x].num = num;
        board[y][x].editable = false;
      }
      this.refresh();      
      return;
    }
    initializeBoard();
    this.refresh();
  }

  /**
    Solves the board if its valid
    This will find a solution, if possible. There may be multiple solutions, in 
    which case this will find one of them.
  **/  
  this.solve = function()
  {
    var x, y;
    var found = false;
    var valid = this.isValid();
    if (!valid) return;
    for (y = 0; y < BOARD_SIZE && !found; ++y)
      for (x = 0; x < BOARD_SIZE && !found; ++x)
        if (board[y][x].num == UNKNOWN)
          found = true;
    if (found == false && valid)
      return;
    --x; --y; // We skipped over the index, go back.
    for (var possibility = 1; possibility <= BOARD_SIZE; ++possibility)
    {
      // It's a possibility, try it
      if (board[y][x].possible[possibility])
      {
        //var savedNum = board[y][x].num;
        board[y][x].num = possibility;
        this.solve();
        if (this.isFilled() && this.isValid()) return;
        board[y][x].num = UNKNOWN;
        calculatePossible();
      }
    }
  }
  
  /**
    Redraws the board
  **/
  this.refresh = function()
  {
    drawBoard();
  }
  
  // Private functions
  //Initializes and draws the initial empty board
  function init()
  {
    initializeBoard();
    // Initialize canvas
    canvas = document.getElementById(canvas);
    canvas.addEventListener('mousemove', mouseMove, false);    
    canvas.addEventListener('mouseout', mouseOut, false);  
    canvas.addEventListener('click', mouseClick, false);
    // Notice that the key listener is not on the canvas element
    document.onkeydown = keydown;
    // Disable hover on touchscreens
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent) ) {
      allowHover = false;
    }
    drawBoard();
  }
  
  // Initializes the board with all posibilites and no entries
  function initializeBoard()
  {
    board = new Array(BOARD_SIZE);
    for (var y = 0; y < BOARD_SIZE; ++y)
    {
      board[y] = new Array(BOARD_SIZE);
      for (var x = 0; x < BOARD_SIZE; ++x)
        board[y][x] = new SudokuEntry();
    }
  }

  // Draws the board, entries and various user actions such as mouse over
  function drawBoard()
  {
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.font = font;
    // Hover
    if (cor != null && allowHover)
    {
      ctx.fillStyle = "rgba(176, 224, 230, 0.8)";
      var entry = posToEntry(cor.x, cor.y);
      ctx.fillRect(entry.x * rowWidth , entry.y * rowWidth, rowWidth, rowWidth);
    }
    // Selected
    if (selected != null)
    {
      ctx.fillStyle = "rgba(176, 224, 230, 0.8)";
      ctx.fillRect(selected.x * rowWidth,
                    selected.y * rowWidth, rowWidth, rowWidth);      
    }
    // Board outline
    for (var i = 1; i < BOARD_SIZE; ++i)
    {
      var stationary = dimension / BOARD_SIZE * i;
      if (i % BOARD_ROOT == 0) 
        ctx.lineWidth = rootDividerWidth;
      else
        ctx.lineWidth = simpleDividerWidth;
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, stationary);
      ctx.lineTo(dimension, stationary);
      ctx.stroke();
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(stationary, 0);
      ctx.lineTo(stationary, dimension);
      ctx.stroke();          
    }
    var offset = rowWidth / 2;
    // Entries
    for (var y = 0; y < BOARD_SIZE; ++y)
      for (var x = 0; x < BOARD_SIZE; ++x)
      if (board[y][x].num != UNKNOWN)
      {
        if (board[y][x].editable)
          ctx.fillStyle = "#000000";
        else
          ctx.fillStyle = "#999999";
        var textSz = ctx.measureText(String(board[y][x].num));
        var txtOffsetX = textSz.width / 2;
        ctx.fillText(board[y][x].num, 
                     rowWidth * x + offset - txtOffsetX, 
                     rowWidth * y + offset + fontHeightOffset);      
      }
  }
  
  // Calculates and fills the possible values for every entry based on the 
  // current board.
  function calculatePossible()
  {
    // Initially everything is possible
    for (var y = 0; y < BOARD_SIZE; ++y)
      for (var x = 0; x < BOARD_SIZE; ++x)
        for (var num=1; num <= BOARD_SIZE; ++num)
          board[y][x].possible[num] = true;
    
    for (var y = 0; y < BOARD_SIZE; ++y)
      for (var x = 0; x < BOARD_SIZE; ++x)
      {
        var entry = board[y][x];
        // Horizontal region
        for (var x2 = 0; x2 < BOARD_SIZE; ++x2)    
          if (x2 != x)
            entry.possible[board[y][x2].num] = false;
        // Vertical region
        for (var y2 = 0; y2 < BOARD_SIZE; ++y2)    
          if (y2 != y)
            entry.possible[board[y2][x].num] = false;        
        // Square region
        var yFrom = y - y % BOARD_ROOT;
        var yTo = yFrom + 3;
        var xFrom = x - x % BOARD_ROOT;
        var xTo = xFrom + 3;
        for (var y2 = yFrom; y2 < yTo; ++y2)
          for (var x2 = xFrom; x2 < xTo; ++x2)
            if (!(x2 == x && y2 == y))
              entry.possible[board[y2][x2].num] = false;
      }      
  }
  // Listeners
  function mouseMove(evt)
  {
    var rect = canvas.getBoundingClientRect();
    cor = 
    {
      x: (evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
      y: (evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height
    }
    drawBoard();
  }
  function mouseOut()
  {
    cor = null;
    drawBoard();
  }  
  function mouseClick(evt)
  {
    var rect = canvas.getBoundingClientRect();
    var currentSelection = selected;
    selected = posToEntry(
    (evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width,
    (evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height
    )
    // Unclick
    if (currentSelection && currentSelection.x == selected.x && 
        currentSelection.y == selected.y)
      selected = null;
    drawBoard();
  }  
  function keydown(evt)
  {
    evt = evt || window.event;
    if (selected != null)
    {
      // Numbers (0-9)
      if (evt.keyCode > 47 && evt.keyCode < 59)
        self.setEntry(evt.keyCode - 48, selected.x, selected.y);
      // Keypad (0-9)
      if (evt.keyCode > 95 && evt.keyCode < 106)
        self.setEntry(evt.keyCode - 96, selected.x, selected.y);      
      switch (evt.keyCode)
      {
        case 37: // Left
          selected.x = Math.max(0, selected.x - 1)
          break;
        case 38: // Up
          selected.y = Math.max(0, selected.y - 1)
          break;  
        case 39: // Right
          selected.x = Math.min(BOARD_SIZE - 1, selected.x + 1)
          break;  
        case 40: // Down
          selected.y = Math.min(BOARD_SIZE - 1, selected.y + 1)
          break;        
      }
      if (evt.keyCode >= 37 && evt.keyCode <= 40)
      {
        preventDefault(evt);
        drawBoard();
        return false;
      }
    }
    drawBoard();
  }
  // Helper functions
  // Returns the index of the entry for the given canvas coordinate {x, y}
  function posToEntry(x, y)
  {
    return {x : Math.floor(x / rowWidth), y : Math.floor(y / rowWidth)};
  }
  // Prevents the screen from scrolling while navigating the board with the 
  // up and down keys. This could be done cleaner with jQuery.. but this is 
  // pure JS
  function preventDefault(e) {
      e = e || window.event;
      if (e.preventDefault) {
          e.preventDefault();
      } else {
          e.returnValue = false;
      }
  }
  init();
}
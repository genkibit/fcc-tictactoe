(function() {
  'use strict';

  // Key game elements
  var numOfPlayers = null;
  var currentPlayer = null;
  var com1, com2 = null;
  var gameOver = true;
  var endScreen = false;
  var appEnd = false;
  
  // For COM vs COM
  var firstPlay = false;
  var updateTimeout = null;
  var playRate = 1800;
  var playCount = 0;
  
  // For War Games ending
  var response = null;
  var joshua = false;
  var gameGrid = document.getElementById('game-grid');
  var topPanel = document.querySelector('.top-panel');
  
  // For getting user input and displaying messages
  var prompt =  document.getElementById('prompt-message');
  var usrInput = document.getElementById('user-input');
  
  // For creating a reference to DOM array nodes
  // https://developer.mozilla.org/en-US/docs/Web/API/NodeList
  var gridNodes = document.querySelectorAll('.cell');
  var gridArray = Array.from(gridNodes);
  
  // For creating a copy of the DOM array
  var gridCopy = [];
  
  // The 8 game win patterns for caclulating minimax score and determing winner
  var pattern1, pattern2, pattern3, pattern4, pattern5, pattern6, pattern7, pattern8, patterns;


  // Constructor for computer player
  var Com = function() {
    this.letter = null;
    this.maxPlayer = null;
    this.minPlayer = null;
  };
  
  Com.prototype = {
    
    // Helper function for evaluatePattern()
    // For setting com player as max nodes in minimax algorithm
    assgnMaxMin: function() {
      
      if (this.letter === null) {
        return console.log("Warning! Letter not assigned to COM");
      }
      
      if (this.letter === 'X') {
        this.maxPlayer = 'X';
        this.minPlayer = 'O';
      }
      else {
        this.maxPlayer = 'O';
        this.minPlayer = 'X';			
      }
    },
    
    // Helper function for calcMoveScore()
    // Assigns a value to a side, depending on how their mark is arranged on the grid
    // @winPattern: One of the 8 win patterns defined earlier -- ['-','-','-']
    evaluatePattern: function(winPattern) {
      var value = 0;
      
      // @maxPlayer: The maximizing player of minimax algorithm
      // @minPlayer: The minimizing player of minimax algorithm
      if (winPattern[0] === this.maxPlayer) {
        value = 1;
      }
      else if (winPattern[0] === this.minPlayer) {
        value = -1;
      }
    
      if (winPattern[1] === this.maxPlayer) {
        if (value === 1) {
          value = 10;
        }
        else if (value === -1) {
          return 0;
        }
        else {
          value = 1;
        }
      }
      else if (winPattern[1] === this.minPlayer) {
        if (value === -1) {
          value = -10;
        }
        else if (value === 1) {
          return 0;
        }
        else {
          value = -1;
        }		
      }
      
      if (winPattern[2] === this.maxPlayer) {
        if (value > 0) {
          value *= 10;
        }
        else if (value < 0) {
          return 0;
        }
        else {
          value = 1;
        }
      }
      else if (winPattern[2] === this.minPlayer) {
        if (value < 0) {
          value *= 10;
        }
        else if (value > 1) {
          value = 0;
        }
        else {
          value = -1;
        }		
      }

      return value;
    },
    
    // Helper function for runMinimax()
    // Loops through the win patterns, tallying the total score for COM and opponent
    calcMoveScore: function() {
      var score = 0;
      
      for (var i = 0, len = patterns.length; i < len; i++) {
        score += this.evaluatePattern(patterns[i]);
      }

      return score;
    },
    
    // Helper function for runMinimax()
    // Returns possible moves
    genNextMoves: function() {
      var possibleMoves = [];
    
      for (var i = 0; i < gridCopy.length; i++) {
        if (gridCopy[i] === "-") {
          possibleMoves.push(i);
        }
      }
      
      return possibleMoves;
    },
    
    // Function for running the minimax algorithm to determine the best move
    runMinimax: function (depth, comTurn) {
      var nextMoves = this.genNextMoves();
      var curScore;
      var curMove;
      var bestScore;
      var bestMove;

      // End Cases: Evaluate score if... 
      // 1. no more moves left (max depth reached)
      // 2. specified depth reached zero
      if (nextMoves.length === 0 || depth === 0) {
        updatePatterns(gridCopy);
        bestScore = this.calcMoveScore();
      }
      else if (comTurn === true) {
        bestScore = -Number.MAX_VALUE;

        for (var i = 0; i < nextMoves.length; i++) {
          
          // Try a move
          curMove = nextMoves[i];
          gridCopy[curMove] = this.maxPlayer;
          curScore = this.runMinimax(depth-1, false)[0];
    
          if (curScore > bestScore) {
            bestScore = curScore;
            bestMove = curMove;
          }
          
          // Undo the move
          gridCopy[curMove] = '-';
        }
      }
      else {
        bestScore = Number.MAX_VALUE;
                        
        for (var j = 0; j < nextMoves.length; j++) {
          curMove = nextMoves[j];
          gridCopy[curMove] = this.minPlayer;
          curScore = this.runMinimax(depth-1, true)[0];
    
          if (curScore < bestScore) {
            bestScore = curScore;
            bestMove = curMove;
          }
          
          gridCopy[curMove] = '-';
        }
      }
      
      return [bestScore, bestMove];
    },
    
    // Makes a move on the DOM grid
    makeMove: function() {
      var comChoice = this.runMinimax(2, true)[1];
      var symbol;
      
      if (this.letter === 'X') {
        symbol = 'X';
      }
      else {
        symbol = 'O';
      }
      
      gridArray[comChoice].innerHTML = symbol;
      
    }
  };
  
  
  // Marks a grid cell on the DOM
  var markCell = function() {
    if (gameOver === true) {
      return;
    }
    
    if (this.textContent === '') {
      if (currentPlayer === 'X') {
        this.innerHTML = 'X';
      }
      else {
        this.innerHTML = 'O';
      }
    }
  };
  
  
  // Updates the grid model and win pattern data to reflect DOM grid changes
  var updateGridCopy = function() {
    gridCopy = [];
    
    for (var i = 0; i < gridArray.length; i++) {
      if (gridArray[i].textContent === '') {
        gridCopy.push('-');
      }
      else if (gridArray[i].textContent === 'X') {
        gridCopy.push('X');
        
        if (numOfPlayers !== 'ZERO') {
          gridArray[i].removeEventListener('click', update);
        }
      }
      else {
        gridCopy.push('O');
        
        if (numOfPlayers !== 'ZERO') {
          gridArray[i].removeEventListener('click', update);
        }
      }
    }
  };
  
  
  // Updates the win pattern array values to match updated grid copy
  // @gridRef: A reference to the original game grid (i.e., gridCopy or gridArray)
  var updatePatterns = function(gridRef) {
    
    // Rows
    pattern1 = [gridRef[0], gridRef[1], gridRef[2]];
    pattern2 = [gridRef[3], gridRef[4], gridRef[5]];
    pattern3 = [gridRef[6], gridRef[7], gridRef[8]];
    
    // Columns
    pattern4 = [gridRef[0], gridRef[3], gridRef[6]];
    pattern5 = [gridRef[1], gridRef[4], gridRef[7]];
    pattern6 = [gridRef[2], gridRef[5], gridRef[8]];
    
    // Diagnals
    pattern7 = [gridRef[0], gridRef[4], gridRef[8]];
    pattern8 = [gridRef[2], gridRef[4], gridRef[6]];
    
    patterns = [pattern1, pattern2, pattern3, pattern4, pattern5, pattern6, pattern7, pattern8];
  };
  

  // Runs a launch code generator like in the movie War Games
  var runLaunchCodes = function() {
    usrInput.style.display = 'none';
    gameGrid.style.display = 'none';
    topPanel.className += ' center';
    
    var launchCodeArray = [];
    var numbers = '0123456789'.split('');
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    var AlphaNum = function() {
      this.randomChar = null;
      this.genRandomChar = function(isLetter) {
        var index;
        
        if (isLetter) {
          index = Math.floor(Math.random() * letters.length);
          this.randomChar = letters[index];
        }
        else {
          index = Math.floor(Math.random() * numbers.length);
          this.randomChar = numbers[index];
        }
      };
    };
    
    for (var i = 0; i < 10; i++) {
      var genOb = new AlphaNum();
      launchCodeArray.push(genOb);
    }
    
    window.setInterval(function(){
      prompt.innerHTML = '';
      
      for (var i = 0; i < 10; i++) {
        if (i <= 2 || i >= 7) {
          launchCodeArray[i].genRandomChar(true);
        }
        else {
          launchCodeArray[i].genRandomChar(false);
        }
      }
      
      for (var j = 0; j < 10; j++) {
        prompt.innerHTML += launchCodeArray[j].randomChar;
      }
    }, 100);
  };
  
  
  // Checks the DOM grid for win patterns
  var checkForWinner = function() {
    var gridSignature = '';
    var timeout;
    
    for (var i = 0, len = patterns.length; i < len; i++) {
      var pattern = patterns[i].join('');
      gridSignature += pattern;
      
      if (pattern.match(/X{3}|O{3}/)) {
        prompt.innerHTML = 'WINNER: PLAYER ' + currentPlayer + '<br>WANT TO PLAY AGAIN?';
        
        // Places active cursor back in input box
        usrInput.style.display = 'block';
        usrInput.focus();
        
        if (numOfPlayers === 'ZERO') {
          timeout = window.setTimeout(function() {
            window.clearTimeout(updateTimeout);
            window.clearTimeout(timeout);
            initializeZero();					
          }, playRate);
        }
        else {
          gameOver = true;
          endScreen = true;
        }
      }
    }
    
    if (gridSignature.match(/\-/) === null) {
      prompt.innerHTML = 'STALEMATE.<br>WANT TO PLAY AGAIN?';
        usrInput.style.display = 'block';
        usrInput.focus();
        
      if (numOfPlayers === 'ZERO') {
        playCount++;
        timeout = window.setTimeout(function() {
          window.clearTimeout(updateTimeout);
          window.clearTimeout(timeout);
          initializeZero();					
        }, playRate);
      }
      else {
        
        gameOver = true;
        endScreen = true;
      }			
    }
  };
  
  
  // War Games ending
  var runJoshua = function() {
    gameGrid.style.display = 'none';
    gameOver = true;
    joshua = true;
    playCount = 0;
    var timerA;
    var timerB;
    
    if (response === null) {
      usrInput.focus();
      prompt.innerHTML = 'GREETINGS PROFESSOR FALKEN.';
    }
    else {
      usrInput.style.display = 'none';
      timerA = window.setTimeout(function() {
        appEnd = true;
        usrInput.value = '';
        prompt.innerHTML += '<br>A STRANGE GAME.<br>THE ONLY WINNING MOVE IS NOT TO PLAY.';
        
        timerB = window.setTimeout(function() {
          window.clearTimeout(timerA);
          window.clearTimeout(timerB);
          prompt.innerHTML += '<br>HOW ABOUT A NICE GAME OF CHESS?';
        }, 7000);
      }, 2000);
    }
  };
  
  
  // Switches player turns
  var switchPlayer = function() {
    if (currentPlayer === 'X') {
      currentPlayer = 'O';
    }
    else {
      currentPlayer = 'X';
    }
  };
  
  
  // Updates the game grid state and conditionals
  var update = function() {
    if (numOfPlayers === 'TWO') {
      markCell.apply(this);
    }
    else if (numOfPlayers === 'ONE') {
      if (currentPlayer !== com2.letter) {
        markCell.apply(this);
      }
      else {
        com2.makeMove();
      }
    }
    else {
      if (playCount === 100) {
        runJoshua();
      }
      
      if (currentPlayer === com1.letter && firstPlay === true) {
        com1.makeMove();
        firstPlay = false;
      }
      else if (currentPlayer === com1.letter) {
        com1.makeMove();
      }
      else {
        com2.makeMove();					
      }
    }
    
    updateGridCopy();
    updatePatterns(gridCopy);
    checkForWinner();
    
    if (!gameOver) {
      switchPlayer();
      
      if (numOfPlayers === 'ZERO') {
        updateTimeout = window.setTimeout(function() {
          update();				
        }, playRate);
      }
      else if (currentPlayer === com2.letter) {
        update();
      }
    }
  };
  
  
  // Initialize states for COM vs COM
  var initializeZero = function() {
    var index;
    var initTimeout;
    com1 = null;
    com2 = null;
    gridCopy = [];
    com1 = new Com();
    com1.letter = 'X';
    com1.assgnMaxMin();
    com2 = new Com();
    com2.letter = 'O';
    com2.assgnMaxMin();
    
    if (playRate < 0 ) {
      playRate = 0;
    }
    else {
      playRate -= 400;			
    }
    
    gridArray.forEach(function(cell) {
      cell.textContent = '';
    });
    
    gameOver = false;
    
    // First move is randomly placed
    index = Math.floor(Math.random() * 8);
    gridArray[index].textContent = 'X';
    updateGridCopy();
    currentPlayer = 'O';
      
    initTimeout = window.setTimeout(function() {
      window.clearTimeout(initTimeout);
      update();
    }, playRate);		
  };
  
  
  // Initializes state for one and two player games
  var initialize = function() {
    usrInput.style.display = 'none';
    
    if (numOfPlayers === 'ONE') {	
      var index;
      com2 = new Com();
    
      if (currentPlayer === 'X') {
        com2.letter = 'O';
      }
      else {
        com2.letter = 'X';
        index = Math.floor(Math.random() * 8);
        gridArray[index].textContent = 'X';
        updateGridCopy();
        currentPlayer = 'O';
      }
      
      com2.assgnMaxMin();
    }
      
    gameOver = false;
    
    gridArray.forEach(function(cell) {
      cell.addEventListener('click', update, false);
    });
  };
  
  
  // Resets all game variables
  var reset = function() {
    numOfPlayers = null;
    currentPlayer = null;
    com1 = null;
    com2 = null;
    gameOver = true;
    endScreen = false;
    playRate = 1800;
    playCount = 0;
    response = null;
    joshua = false;
    gridCopy = [];
    usrInput.value = '';
    
    gridArray.forEach(function(cell) {
      cell.textContent = '';
      cell.removeEventListener('click', update);
    });
  };
  
  
  // Controls logic flow of start screen prompts
  var runStartScreen = function() {
    prompt.innerHTML = '';
    var promptA = 'ONE OR TWO PLAYERS?<br>PLEASE LIST NUMBER OF PLAYERS:';
    var promptB = 'X OR O?';
    
    if (numOfPlayers === null) {
      prompt.innerHTML = promptA;
    }
    else {
      prompt.innerHTML = promptB;
        
      if (currentPlayer !== null) {
        prompt.innerHTML = '';
        initialize();
      }		
    }
  };
  
  
  runStartScreen();
  
  
  // Key events for Enter, Y and N keys
  window.onkeyup = function(e) {
    var timeout;
    var errorMsg = '<div class="text-center">** <span class="text-underline">IDENTIFICATION NOT RECOGNIZED</span> **<br>** ACCESS DENIED **</div>';
    
    if (gameOver === true && appEnd === false) {
      
      // http://stackoverflow.com/questions/4471582/javascript-keycode-vs-which
      var key = 'which' in e ? e.which : e.keyCode;
      
      if (key === 13 && joshua === true) {
        
        response = usrInput.value.toUpperCase();
        
        if (response.match(/^HELLO$/)) {
          runJoshua();
        }
        else {
          prompt.innerHTML = errorMsg;
          timeout = window.setTimeout(function() {
            window.clearTimeout(timeout);
            reset();
            runStartScreen();
          }, 3000);						
        }
      }
      
      if (key === 13 && endScreen === false) {
        if (numOfPlayers === null) {
          numOfPlayers = usrInput.value.toUpperCase();
          
          if (numOfPlayers.match(/^ZERO$/)) {
            prompt.innerHTML = '';
            usrInput.value = '';
            initializeZero();
          }
          else if (numOfPlayers.match(/^ONE$|^TWO$|^ZERO$/) === null) {
            prompt.innerHTML = errorMsg;
            timeout = window.setTimeout(function() {
              window.clearTimeout(timeout);
              usrInput.value = '';
              reset();
              runStartScreen();
            }, 3000);
          }
          else {
            usrInput.value = '';
            runStartScreen();
          }
        }
        else if (currentPlayer === null) {
          currentPlayer = usrInput.value.toUpperCase();
          
          if (currentPlayer.match(/^X$|^O$/) === null) {
            prompt.innerHTML = errorMsg;
            timeout = window.setTimeout(function() {
              window.clearTimeout(timeout);
              reset();
              runStartScreen();
            }, 3000);
          }
          else {
            usrInput.value = '';
            runStartScreen();
          }
        }
      }
      
      if (endScreen === true && joshua !== true) {
        if (key === 89) {
          reset();
          runStartScreen();
        }
        else if (key === 78) {
          appEnd = true;
          runLaunchCodes();
        }
        else {
          prompt.innerHTML = errorMsg;
          timeout = window.setTimeout(function() {
            window.clearTimeout(timeout);
            reset();
            runStartScreen();
          }, 3000);
        }
      }
    }
  };
}());

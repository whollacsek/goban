$(document).ready(function () {
/**
 * Import scripts
 */
// $.getScript("game.js");


/**
 * Main
 * called by index.html
 * initiates env and start game
 */
function init () {
	// goban = Object.create(firstStage);
	goban = new firstStage();

	// bind keyboard events
	$(window).keydown(goban.kbEvent);

	// start rendering
	goban.render.render();

	console.log("STARTED !");
};

/**
 * Object player
 *
 *
 */
var player = function () {
	this.color = null;
	this.nbPieces = 0;
	this.nbPrisoners = 0;
};

/**
 * Object human
 * Inherits player
 *
 */
var human = function () {};
human.prototype = new player();

/**
 * Object computer
 * Inherits player
 *
 */
var computer = function () {};
computer.prototype = new player();

/**
 * Constructor of object game
 */
function game () {
	var self = this;

	// canvas setup
	if ($('#canvas').length == 0) {
		$('body').append('<canvas id="canvas"></canvas>');
	};


	/**
	 * Object canvas
	 */
	this.canvas = (function (canvas) {
		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;

		function resizeCanvas () {
			canvas.setAttribute('height', $(window).height());
			canvas.setAttribute('width', $(window).width());
			// canvas.setAttribute('height', $(window).height());

			this.width = canvas.width;
			this.height = canvas.height;
		};

		return {
			ctx : ctx,
			width : width,
			height : height,
			resizeCanvas : resizeCanvas
		};
	})(document.getElementById('canvas'));


	/**
	 * Object goban
	 */
	this.board = (function (canvas) {
		// game gui data
		var margin = 50;	// board border width
		var squareSize = 50;	// square
		var gameSize = 9;	// board size
		var gridSize = squareSize * (gameSize - 1);
		var boardLength = gridSize + 2 * margin;

		// position of board inside canvas
		var startXb = (canvas.width - boardLength) / 2;
		var startYb = (canvas.height - boardLength) / 2;
		// effective grid position
		var startXg = startXb + margin;
		var startYg = startYb + margin;
		var endXg = startXg + gridSize;
		var endYg = startYg + gridSize;

		function repositionBoard () {

			this.startXb = (canvas.width - boardLength) / 2;
			this.startYb = (canvas.height - boardLength) / 2;
			// effective grid position
			this.startXg = this.startXb + this.margin;
			this.startYg = this.startYb + this.margin;
			this.endXg = this.startXg + this.gridSize;
			this.endYg = this.startYg + this.gridSize;

		};

		return {
			 margin : margin,
			 squareSize : squareSize,
			 gameSize : gameSize,
			 gridSize : gridSize,
			 boardLength : boardLength,
			 startXb : startXb,
			 startYb : startYb,
			 startXg : startXg,
			 startYg : startYg,
			 endXg : endXg,
			 endYg : endYg,
			 repositionBoard : repositionBoard
		};
	})(this.canvas);


	/**
	 * Object cursor
	 */
	this.cursor = (function (board) {
		// var board = self.board;
		// cursor secondary data (for drawing)
		var curMargin = 10;
		var curRetract = 5;

		var curX = (board.startXg + board.endXg) / 2;
		var curY = (board.startYg + board.endYg) / 2;

		function repositionCursor (x, y) {
			// position of cursor
			this.curX = (x) ? x : (board.startXg + board.endXg) / 2;
			this.curY = (y) ? y : (board.startYg + board.endYg) / 2;
		};

		function add (pos) {
			this['cur'+pos] += board.squareSize;
		};

		function minus (pos) {
			this['cur'+pos] -= board.squareSize;
		};

		function addX () {
			add('X');
			this.curX = Math.min(this.curX + board.squareSize, board.endXg);
		}

		function minusX () {
			minus('X');
			this.curX = Math.max(this.curX - board.squareSize, board.startXg);
		}

		function addY () {
			add('Y');
			this.curY = Math.max(this.curY - board.squareSize, board.startYg);
		}

		function minusY () {
			minus('Y');
			this.curY = Math.min(this.curY + board.squareSize, board.endYg);
		}

		return {
			// position of cursor
			curX : curX,
			curY : curY,
			curMargin : curMargin,
			curRetract : curRetract,
			getCurGridX : function () {
				return (this.curX - board.startXb - board.margin) / board.squareSize;
			},
			getCurGridY : function () {
				return (this.curY - board.startYb - board.margin) / board.squareSize;
			},
			repositionCursor : repositionCursor,
			addX : addX,
			minusX : minusX,
			addY : addY,
			minusY : minusY,
			add : add,
			minus : minus
		};
	})(this.board);

	/**
	 * Object data
	 * contains data related to game state
	 */
	this.data = {
		// for transition/animation use
		counter : 0,
		// contains position of piece on board
		array : new Array(this.board.gameSize),
		// number of pieces for each player
		nbWhite : Math.floor(this.board.gameSize * this.board.gameSize / 2),
		nbBlack : Math.floor(this.board.gameSize * this.board.gameSize / 2 + 1),
		//
		render : true,
		// store
		ko : {
			x : 0,
			y : 0,
			bool : 0
		},
		pass : 0
	};
	// init this.data.array to null
	for (var n = 0; n < this.board.gameSize; n++ ) {
		this.data.array[n] = new Array(this.board.gameSize);
		for (var i = 0; i < this.board.gameSize; i++) {
			this.data.array[n][i] = null;
		};
	}

	/**
	 * Object keys
	 */
	this.keys = {
		spacebar 	: 32,
		arrowLeft 	: 37,
		arrowUp 	: 38,
		arrowRight 	: 39,
		arrowDown 	: 40
	};

	// create initial players
	this.p1 = new human();
	this.p2 = new human();
	// player switcher, get first player, always black
	this.p = (this.p1.color == 'black') ? this.p1 : this.p2;

	// trigger resize and bind resize event
	resizeAll();
	$(window).resize(resizeAll);

	/**
	 * Utilities
	 */
	function resizeAll () {
		self.canvas.resizeCanvas();
		self.board.repositionBoard();
		self.cursor.repositionCursor();
	};
};

/**
 * cosinus
 * for animation
 */
function cosinus () {
	return (Math.cos(goban.data.counter%1*2*Math.PI)+1)/2;
};

/**
 * Object firstStage
 * Inherits game
 *
 */
var firstStage = function () {};
firstStage.prototype = new game();

// firstStage.prototype.cursor.repositionCursor();
firstStage.prototype.cursor.addY = function () {
	var proto = firstStage.prototype;
	var cursor = proto.cursor;
	var board = proto.board;

	cursor.add('Y');
	proto.cursor.curY = Math.min(cursor.curY, (board.startYg + board.endYg) / 2 + 2 * board.squareSize);
};

firstStage.prototype.cursor.minusY = function () {
	var proto = firstStage.prototype;
	var cursor = proto.cursor;
	var board = proto.board;

	cursor.minus('Y');
	proto.cursor.curY = Math.max(cursor.curY, (board.startYg + board.endYg) / 2 + board.squareSize);
};

firstStage.prototype.kbEvent = function (e) { // keyboard events
	var protoGame = secondStage.prototype;
	var proto = firstStage.prototype;
	var keys = proto.keys;
	var cursor = proto.cursor;
	var data = proto.data;

	if ($.inArray(e.keyCode, $.map( keys, function( value, index ) {return value;}) ) != -1 ) {
			e.preventDefault();
		};
	switch(e.keyCode) {
		case keys.arrowUp: cursor.minusY();
		break;
		case keys.arrowDown: cursor.addY();
		break;
		case keys.spacebar:
			proto.data.render = false;
			goban = new secondStage();
			goban.render.render();
			$(window).unbind('keydown').keydown(goban.kbEvent);

			$(window).click(goban.mouseEvent);

			if (cursor.curY == data.blackPos.y) {
				console.log('black');
				protoGame.p1.nbPieces = data.nbBlack;
				protoGame.p1.color = 'black';
				protoGame.p2.nbPieces = data.nbWhite;
				protoGame.p2.color = 'white';
			}else if (cursor.curY == data.whitePos.y) {
				console.log('white');
				protoGame.p1.nbPieces = data.nbWhite;
				protoGame.p1.color = 'white';
				protoGame.p2.nbPieces = data.nbBlack;
				protoGame.p2.color = 'black';
			};

			// player switcher
			protoGame.p = (protoGame.p1.color == 'black') ? protoGame.p1 : protoGame.p2;

			//secondStage.call(proto);proto.data.render = true ;//selectMenu();
		break;
	};
	console.log("firststage: "+e.keyCode);
};

// setup firstStage
firstStage.prototype.cursor.addY();

(function placeSelectView() {
	firstStage.prototype.data.blackPos = {x: firstStage.prototype.cursor.curX + firstStage.prototype.board.squareSize, y: firstStage.prototype.cursor.curY};
	firstStage.prototype.data.whitePos = {x: firstStage.prototype.cursor.curX + firstStage.prototype.board.squareSize, y: firstStage.prototype.cursor.curY + firstStage.prototype.board.squareSize};
})();

firstStage.prototype.resizeAll = function () {
	firstStage.prototype.resizeAll();
	placeSelectView();
}

firstStage.prototype.render = (function () {
	var proto = firstStage.prototype;
	var ctx = proto.canvas.ctx;
	var board = proto.board;
	var cursor = proto.cursor;
	var data = proto.data;

	function drawBackground() {
		// draw shadow
		ctx.fillStyle = "B0B0B0";
    	ctx.fillRect(board.startXb+1, board.startYb+1, board.boardLength, board.boardLength);
		// draw background
		ctx.fillStyle = "#F1B330";
		// ctx.fillStyle = "rgb(230, 155, 2)";
		ctx.fillRect(board.startXb, board.startYb, board.boardLength, board.boardLength);
	};

	function drawSelect() {
		var x = data.blackPos.x;
		var y = data.blackPos.y;

		// shadow
		ctx.beginPath();
		ctx.arc(x+2, y+2, 20, 0, Math.PI * 2, false);
		ctx.fillStyle = '#B0B0B0';
		ctx.fill();
		// piece color
		ctx.beginPath();
		ctx.arc(x, y, 20, 0, Math.PI * 2, false);
		ctx.fillStyle = 'black';
		ctx.fill();

		// gradient effects
		var grad = ctx.createLinearGradient(x - 20,y - 20,x - 7 + 5,y - 7 + 5);
	    grad.addColorStop(0, '#B0B0B0');
	    grad.addColorStop(1, 'black');
		ctx.beginPath();
		ctx.arc(x, y, 20, 0, Math.PI*2, false);
		ctx.fillStyle = grad;
		ctx.fill();

		x = data.whitePos.x;
		y = data.whitePos.y;


		// shadow
		ctx.beginPath();
		ctx.arc(x+2, y+2, 20, 0, Math.PI * 2, false);
		ctx.fillStyle = '#B0B0B0';
		ctx.fill();
		// piece color
		ctx.beginPath();
		ctx.arc(x, y, 20, 0, Math.PI * 2, false);
		ctx.fillStyle = 'white';
		ctx.fill();

		// gradient effects
		var grad = ctx.createLinearGradient(x + 15,y + 15,x + 7 - 5,y + 7 - 5);
	    grad.addColorStop(0, '#CECECE');
	    grad.addColorStop(0.6, '#EEEEEE');
	    grad.addColorStop(1, 'white');
		ctx.beginPath();
		ctx.arc(x, y, 20, 0, Math.PI*2, false);
		ctx.fillStyle = grad;
		ctx.fill();

	};

	function drawCursor() {
		var curColor = '0'; // default color black
		var x = cursor.getCurGridX();
		var y = cursor.getCurGridY();
		var curX = cursor.curX;
		var curY = cursor.curY;
		var curMargin = cursor.curMargin;
		var curRetract = cursor.curRetract;

		if (data.array[x][y] == 'black') {
			curColor = "255"; // change color to white
		};

		ctx.strokeStyle = "rgba("+curColor+","+curColor+","+curColor+","+cosinus()+")"
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.lineWidth = 3;

		// nord-ouest
		ctx.beginPath();
		ctx.moveTo(curX - curMargin, curY - curRetract);
		ctx.lineTo(curX - curMargin, curY - curMargin);
		ctx.lineTo(curX - curRetract, curY - curMargin);
		ctx.stroke();
		ctx.closePath();
		// nord-est
		ctx.beginPath();
		ctx.moveTo(curX + curMargin, curY - curRetract);
		ctx.lineTo(curX + curMargin, curY - curMargin);
		ctx.lineTo(curX + curRetract, curY - curMargin);
		ctx.stroke();
		ctx.closePath();
		// sud-ouest
		ctx.beginPath();
		ctx.moveTo(curX - curMargin, curY + curRetract);
		ctx.lineTo(curX - curMargin, curY + curMargin);
		ctx.lineTo(curX - curRetract, curY + curMargin);
		ctx.stroke();
		ctx.closePath();
		// sud-est
		ctx.beginPath();
		ctx.moveTo(curX + curMargin, curY + curRetract);
		ctx.lineTo(curX + curMargin, curY + curMargin);
		ctx.lineTo(curX + curRetract, curY + curMargin);
		ctx.stroke();
		ctx.closePath();

	};

	return {
		render : function render () {
			if (data.render == false) {return true;};
			drawBackground();
			drawSelect();
			drawCursor();

			setTimeout(function(){
	            data.counter+=0.05; // change velocity !
	            render(); // render next frame
	        },80);
		}
	};
})();

/**
 * Object secondStage
 * Inherits game
 *
 */
var secondStage = function () {};
secondStage.prototype = new game();

secondStage.prototype.mouseEvent = function (e) { // keyboard events
	var proto = secondStage.prototype;
	var curX = proto.cursor.curX;
	var curY = proto.cursor.curY;
	var squareSize = proto.board.squareSize;
	var startXb = proto.board.startXb;
	var startYb = proto.board.startYb;
	var boardLength = proto.board.boardLength;

	var animation = proto.render.animation;
	var animation2 = proto.render.animation2;
	var buttons = [{x: startXb - 200, y: startYb + 170, r: animation2(50, -1)},
                 {x: startXb - 200, y: startYb + 320, r: animation2(50, -1)}];

	function collides(buttons, x, y) {
	    var distX = 0;
	    var distY = 0;
	    for (var i in buttons) {
        	distX = (x > buttons[i].x) ? x - buttons[i].x : buttons[i].x - x;
        	distY = (y > buttons[i].y) ? y - buttons[i].y : buttons[i].y - y;

	        if (distX < buttons[i].r && distY < buttons[i].r) {
	        	return buttons[i];
	        };
	    }
	    return false;
	}

    var rect = collides(buttons, e.clientX, e.clientY);
    if (rect === buttons[0]) {
        // alert('pass');
        proto.pass();
    } else if (rect === buttons[1]) {
        // alert('restart');
        window.location.reload();
    }
};

secondStage.prototype.kbEvent = function (e) { // keyboard events
	var proto = secondStage.prototype;
	var keys = proto.keys;
	var curX = proto.cursor.curX;
	var curY = proto.cursor.curY;
	var squareSize = proto.board.squareSize;
	var startXg = proto.board.startXg;
	var endXg = proto.board.endXg;
	var startYg = proto.board.startYg;
	var endYg = proto.board.endYg;
	var boardLength = proto.board.boardLength;

	if ($.inArray(e.keyCode, $.map( keys, function( value, index ) {return value;}) ) != -1 ) {
		e.preventDefault();
	};
	switch(e.keyCode) {
		case keys.arrowRight: proto.cursor.addX();
		break;
		case keys.arrowLeft: proto.cursor.minusX();
		break;
		case keys.arrowUp: proto.cursor.addY();
		break;
		case keys.arrowDown: proto.cursor.minusY();
		break;
		case keys.spacebar: proto.placePiece();
		break;
	};
	console.log("secondStage: "+e.keyCode);
};

/**
 * Stop game, determine winner and restart
 *
 */
secondStage.prototype.endGame = function () {
	var proto = secondStage.prototype;
	var p = proto.p;	// player,  equals p1 or p2
	var msg = '';
	var msg2 = ', restarting game in 5 sec';

	if (proto.p1.nbPrisoners > proto.p2.nbPrisoners) {
		p = proto.p1;
		msg = p.color + ' player wins' + msg2;
	}else if (proto.p2.nbPrisoners > proto.p1.nbPrisoners){
		p = proto.p2;
		msg = p.color + ' player wins' + msg2;
	}else {
		// p = {color:''};
		msg = 'No winner' + msg2;
	};

	var protoGame = thirdStage.prototype;
	var data = proto.data;
	protoGame.msg = msg;
	proto.data.render = false;
	goban = new thirdStage();
	goban.render.render();
	$(window).unbind('keydown');
	$(window).unbind('mouseEvent');

};

/**
 * Player passes
 *
 */
secondStage.prototype.pass = function () {
	var proto = secondStage.prototype;
	var p = proto.p;	// player,  equals p1 or p2


	p.nbPieces--;

	// switch player
	if (p === proto.p1) {
		proto.p = proto.p2;
		console.log('P1 : '+p.nbPieces);
	}else{
		proto.p = proto.p1;
		console.log('P2 : '+p.nbPieces);
	};

	proto.p.nbPrisoners += 1;

	if (proto.data.pass == 1) {
		// end game
		proto.endGame();
	};

	if (proto.p1.nbPieces == 0 && proto.p2.nbPieces == 0) {
		// end game
		proto.endGame();
	};

	proto.data.pass = 1;
};

/**
 * Player action
 *
 */
secondStage.prototype.placePiece = function () {
	var proto = secondStage.prototype;
	var cursor = proto.cursor;
	var board = proto.board;
	var data = proto.data;
	var matrix = data.array;
	var curX = cursor.getCurGridX();
	var curY = cursor.getCurGridY();
	var p = proto.p;	// player,  equals p1 or p2
	var row;	// data.array
	var cell;	// data.array

	var opColor = (p.color == 'black') ? 'white' : 'black';
	var deletedArray;

	// before placement

	// player got no pieces left
	if (p.nbPieces <= 0) {
		return false;
	};

	// position is not free
	if (matrix[curX][curY] != null) {
		return false;
	};

	// if (!isOpLastLiberty()) {
	// 	return false;
	// };

	// can not place inside ennemie
	if (is4Connected(curX, curY) && is4SameColor(curX, curY, opColor) && !isOpLastLiberty()) {
		console.log('is not same color')
		return false;
	};

	// if last liberty is where we're going to place, refuse
	if (!isOpLastLiberty() && !hasLiberty (curX, curY) && isSuicide()) {
		return false;
	};

	// if not ko second time

	if (proto.data.ko.bool == 1) {
		//
		if (curX == proto.data.ko.x && curY ==proto.data.ko.y) {
			//debug
			console.log("Situation de KO !!");
			return false;
		};

	};

	// ko detection phase 1
	if (is4SameColor(curX, curY, opColor)) {
		proto.data.ko.bool = 1;
	};

	// pre-placement verifications over
	// do placement
	matrix[curX][curY] = p.color;
	p.nbPieces--;
	console.log("curX:"+ curX+"\ny:"+curY);

	// switch player
	if (p === proto.p1) {
		proto.p = proto.p2;
		console.log('P1 : '+p.nbPieces);
	}else{
		proto.p = proto.p1;
		console.log('P2 : '+p.nbPieces);
	};

	// reinit pass
	proto.data.pass = 0;

	// after placement
	// find dead zone
	// test if has opponent in connection
	if (hasOpConnection(curX, curY)) {
		console.log("Found at least one opponent !");
		deletedArray = findAndDelete();
	};

	// ko detection phase 2
	if (proto.data.ko.bool == 1) {
		if (deletedArray.length == 1) {
			if (is4SameColor(deletedArray[0].x, deletedArray[0].y, p.color)) {
				proto.data.ko.bool = 1;
				proto.data.ko.x = deletedArray[0].x;
				proto.data.ko.y = deletedArray[0].y;
			}else{
				proto.data.ko.bool = 0;
			};
		}else{
			proto.data.ko.bool = 0;
		};
	};

	if (proto.p1.nbPieces == 0 && proto.p2.nbPieces == 0) {
		// end game
		proto.endGame();
	};

	function isOpLastLiberty () {
		var c = getConnections(curX, curY);
		var color = (p.color == 'black') ? 'white' : 'black';
		// debug
		var testColor = (color == 'black') ? 'red' : 'blue';
		var dirArray = ['_n', '_s', '_e', '_w'];

		for (var dir in dirArray) {
			dir = dirArray[dir];
			var frontier = new Array();

			if (c[dir] != null && c[dir].color == color) {

				frontier.push({x:c[dir].x, y:c[dir].y});
				// debugColor(c[dir].x, c[dir].y, testColor); // debug

				for (var i = 0; i < frontier.length; i++) {
					var x = frontier[i].x;
					var y = frontier[i].y;
					var tmp = getConnections(x, y);

					if (tmp._n != null && tmp._n.color == color && !isInFrontier(frontier, tmp._n)) {
						frontier.push({x:tmp._n.x, y:tmp._n.y});
						// debugColor(tmp._n.x, tmp._n.y, testColor); // debug
					};
					if (tmp._s != null && tmp._s.color == color && !isInFrontier(frontier, tmp._s)) {
						frontier.push({x:tmp._s.x, y:tmp._s.y});
						// debugColor(tmp._s.x, tmp._s.y, testColor); // debug
					};
					if (tmp._e != null && tmp._e.color == color && !isInFrontier(frontier, tmp._e)) {
						frontier.push({x:tmp._e.x, y:tmp._e.y});
						// debugColor(tmp._e.x, tmp._e.y, testColor); // debug
					};
					if (tmp._w != null && tmp._w.color == color && !isInFrontier(frontier, tmp._w)) {
						frontier.push({x:tmp._w.x, y:tmp._w.y});
						// debugColor(tmp._w.x, tmp._w.y, testColor); // debug
					};
				};

				var libertiesArray = liberties(frontier);
				console.log('liberties : '+libertiesArray.length);
				if (libertiesArray.length == 1) {
					return true;
				};
			};
		};


		return false;
	};

	function isSuicide() {
		var c = getConnections(curX, curY);
		var color = p.color;
		var frontier = new Array();
		// debug
		var testColor = (color == 'black') ? 'red' : 'blue';
		var dirArray = ['_n', '_s', '_e', '_w'];

		for (var dir in dirArray) {
			dir = dirArray[dir];

			if (c[dir] != null && c[dir].color == color) {

				frontier.push({x:c[dir].x, y:c[dir].y});
				// debugColor(c[dir].x, c[dir].y, testColor); // debug

				for (var i = 0; i < frontier.length; i++) {
					var x = frontier[i].x;
					var y = frontier[i].y;
					var tmp = getConnections(x, y);

					if (tmp._n != null && tmp._n.color == color && !isInFrontier(frontier, tmp._n)) {
						frontier.push({x:tmp._n.x, y:tmp._n.y});
						// debugColor(tmp._n.x, tmp._n.y, testColor); // debug
					};
					if (tmp._s != null && tmp._s.color == color && !isInFrontier(frontier, tmp._s)) {
						frontier.push({x:tmp._s.x, y:tmp._s.y});
						// debugColor(tmp._s.x, tmp._s.y, testColor); // debug
					};
					if (tmp._e != null && tmp._e.color == color && !isInFrontier(frontier, tmp._e)) {
						frontier.push({x:tmp._e.x, y:tmp._e.y});
						// debugColor(tmp._e.x, tmp._e.y, testColor); // debug
					};
					if (tmp._w != null && tmp._w.color == color && !isInFrontier(frontier, tmp._w)) {
						frontier.push({x:tmp._w.x, y:tmp._w.y});
						// debugColor(tmp._w.x, tmp._w.y, testColor); // debug
					};
				};
			};
		};

		var libertiesArray = liberties(frontier);
		if (libertiesArray.length == 1) {
			return true;
		};

		return false;
	};

	function findAndDelete () {
		var c = getConnections(curX, curY);
		var color = matrix[curX][curY];
		var res = new Array();
		var frontier;
		// get op color
		var opColor = (color == 'black') ? 'white' : 'black';
		// debug
		var testColor = (color == 'black') ? 'red' : 'blue';

		var dirArray = ['_n', '_s', '_e', '_w'];

		for (var dir in dirArray) {
			dir = dirArray[dir];

			if (c[dir] != null && c[dir].color == opColor) {
				frontier = new Array();
				frontier.push({x:c[dir].x, y:c[dir].y});
				// debugColor(c[dir].x, c[dir].y, testColor); // debug

				for (var i = 0; i < frontier.length; i++) {
					var x = frontier[i].x;
					var y = frontier[i].y;
					var tmp = getConnections(x, y);

					if (tmp._n != null && tmp._n.color == opColor && !isInFrontier(frontier, tmp._n)) {
						frontier.push({x:tmp._n.x, y:tmp._n.y});
						// debugColor(tmp._n.x, tmp._n.y, testColor); // debug
					};
					if (tmp._s != null && tmp._s.color == opColor && !isInFrontier(frontier, tmp._s)) {
						frontier.push({x:tmp._s.x, y:tmp._s.y});
						// debugColor(tmp._s.x, tmp._s.y, testColor); // debug
					};
					if (tmp._e != null && tmp._e.color == opColor && !isInFrontier(frontier, tmp._e)) {
						frontier.push({x:tmp._e.x, y:tmp._e.y});
						// debugColor(tmp._e.x, tmp._e.y, testColor); // debug
					};
					if (tmp._w != null && tmp._w.color == opColor && !isInFrontier(frontier, tmp._w)) {
						frontier.push({x:tmp._w.x, y:tmp._w.y});
						// debugColor(tmp._w.x, tmp._w.y, testColor); // debug
					};
				};

				if (frontierHasLiberty(frontier) == false) {
					console.log('no liberty');
					p.nbPrisoners += frontier.length;
					res = res.concat(frontier);
					deleteFrontier(frontier);
				};
			};
		};

		return res;
	};

	/**
	 * check if the pieces is already in the array passed in arg
	 */
	function isInFrontier (frontier, p) {
		for (var i in frontier) {
			if (frontier[i].x == p.x && frontier[i].y == p.y) {
				return true;
			};
		};
		return false;
	};

	/**
	 * delete every pieces in the array passed in arg
	 */
	function deleteFrontier (frontier) {
		for (var i in frontier) {
			console.log('delete : x:' + frontier[i].x + ' y:' + frontier[i].y);
			matrix[frontier[i].x][frontier[i].y] = null;
		};
	};

	/**
	 * check if the array of pieces passed in arg has at least on liberty
	 */
	function frontierHasLiberty (frontier) {
		for (var i in frontier) {
			if (hasLiberty(frontier[i].x, frontier[i].y)) {
				return true;
			};
		};
		return false;
	};

	/**
	 * display concerned pieces with another color for debug
	 */
	function debugColor (x, y, testColor) {
		var color = matrix[x][y];
		matrix[x][y] = testColor; // debug

		setTimeout(function () {
			matrix[x][y] = color;
		}, 800);
	};

	/**
	 * check if x,y is 4 connected
	 */
	function is4Connected (x, y) {
		var c = getConnections(x, y);

		for (var key in c) {
			// console.log("$$border : "+key);
			if (c[key] == null) {
				console.log("border : "+key);
				delete c[key];
			};
		};

		if ((c._n == null || c._n.color != null) && (c._s == null || c._s.color != null) && (c._e == null || c._e.color != null) && (c._w == null || c._w.color != null)) {
			//debug
			console.log("has full 4 connection");
			return true;
		};
		return false;
	};

	/**
	 * check if 4 connections around x,y has the same color
	 */
	function is4SameColor (x, y, color) {
		var c = getConnections(x, y);

		for (var key in c) {
			// console.log("$$border : "+key);
			if (c[key] == null) {
				console.log("border : "+key);
				delete c[key];
			};
		};

		if ((c._n == null || c._n.color == color) && (c._s == null || c._s.color == color) && (c._e == null || c._e.color == color) && (c._w == null || c._w.color == color)) {
			return true;
		};
		return false;
	};

	/**
	 *	get first liberty
	 */
	function getFirstLiberty (x, y) {
		var c = getConnections(x, y);
		var color = (matrix[x][y] == 'black') ? 'white' : 'black';

		if (c._n != null && c._n.color == null) {
			return c._n;
		};

		if (c._s != null && c._s.color == null) {
			return c._s;
		};

		if (c._e != null && c._e.color == null) {
			return c._e;
		};

		if (c._w != null && c._w.color == null) {
			return c._w;
		};

		return false;
	};

	/**
	 *	return number of liberties of a frontier
	 */
	function liberties (frontier) {
		var libertiesArray = new Array();

		for (var i in frontier) {
			var c = getConnections(frontier[i].x, frontier[i].y);

			if (c._n != null && c._n.color == null && !isInFrontier(libertiesArray, c._n)) {
				libertiesArray.push({x:c._n.x, y:c._n.y});
			};

			if (c._s != null && c._s.color == null && !isInFrontier(libertiesArray, c._s)) {
				libertiesArray.push({x:c._s.x, y:c._s.y});
			};

			if (c._e != null && c._e.color == null && !isInFrontier(libertiesArray, c._e)) {
				libertiesArray.push({x:c._e.x, y:c._e.y});
			};

			if (c._w != null && c._w.color == null && !isInFrontier(libertiesArray, c._w)) {
				libertiesArray.push({x:c._w.x, y:c._w.y});
			};
		};

		return libertiesArray;
	};

	/**
	 *	check piece has at least one liberty
	 */
	function hasLiberty (x, y) {
		var c = getConnections(x, y);
		var color = (matrix[x][y] == 'black') ? 'white' : 'black';

		if ((c._n != null && c._n.color == null) || (c._s != null && c._s.color == null) || (c._e != null && c._e.color == null) || (c._w != null && c._w.color == null)) {
			//debug
			console.log("has at least one liberty");
			return true;
		};
		return false;
	};

	/**
	 *	check around placement if there's at least one opponent
	 */
	function hasOpConnection (x, y) {
		var c = getConnections(x, y);
		var color = (matrix[x][y] == 'black') ? 'white' : 'black';

		for (var key in c) {
			if (c[key] != null && c[key].color == color) {
				return true;
			};
		};

		return false;
	};

	/**
	 * retun all 8 connection of a specific position
	 */
	function getConnections (x, y) {
		return {
			_n : get_n(x, y),
			_s : get_s(x, y),
			_w : get_w(x, y),
			_e : get_e(x, y),
			_nw : get_nw(x, y),
			_ne : get_ne(x, y),
			_sw : get_sw(x, y),
			_se : get_se(x, y)
		};
	};

	/**
	 * return a representation of the piece at north
	 */
	function get_n (x, y) {
		return (matrix[x][y-1] === undefined) ? null : {x:x, y:y-1 ,color:matrix[x][y-1]};
	};
	/**
	 * return a representation of the piece at south
	 */
	function get_s (x, y) {
		return (matrix[x][y+1] === undefined) ? null : {x:x, y:y+1 ,color:matrix[x][y+1]};
	};
	/**
	 * return a representation of the piece at west
	 */
	function get_w (x, y) {
		return (matrix[x-1] === undefined) ? null : {x:x-1, y:y ,color:matrix[x-1][y]};
	};
	/**
	 * return a representation of the piece at east
	 */
	function get_e (x, y) {
		return (matrix[x+1] === undefined) ? null : {x:x+1, y:y ,color:matrix[x+1][y]};
	};
	/**
	 * return a representation of the piece at north-west
	 */
	function get_nw (x, y) {
		return (matrix[x][y-1] === undefined || matrix[x-1] === undefined) ? null : {x:x-1, y:y-1 ,color:matrix[x-1][y-1]};
	};
	/**
	 * return a representation of the piece at north-east
	 */
	function get_ne (x, y) {
		return (matrix[x][y-1] === undefined || matrix[x+1] === undefined) ? null : {x:x+1, y:y-1 ,color:matrix[x+1][y-1]};
	};
	/**
	 * return a representation of the piece at south-west
	 */
	function get_sw (x, y) {
		return (matrix[x][y+1] === undefined || matrix[x-1] === undefined) ? null : {x:x-1, y:y+1 ,color:matrix[x-1][y+1]};
	};
	/**
	 * return a representation of the piece at south-east
	 */
	function get_se (x, y) {
		return (matrix[x][y+1] === undefined || matrix[x+1] === undefined) ? null : {x:x+1, y:y+1 ,color:matrix[x+1][y+1]};
	};

};


/**
 * The renderer
 * draw cursor, background, grid, etc.
 */
secondStage.prototype.render = (function () {
	var self = this;
	var proto = secondStage.prototype;
	var canvas = proto.canvas;
	var ctx = proto.canvas.ctx;
	var board = proto.board;
	var cursor = proto.cursor;
	var data = proto.data;

	function animation () {
		var boardLength = board.boardLength;

		return Math.sqrt(boardLength*boardLength + boardLength*boardLength) * cosinus()/150/*amplitude*/ + Math.sqrt(boardLength*boardLength + boardLength*boardLength)/2 + 10 /*minimum distance avec board*/;
	}

	function animation2 (x, mod) {
		return Math.sqrt(x*x + x*x) * mod * cosinus()/200/*amplitude*/ + Math.sqrt(x*x + x*x)/2 + 10 /*minimum distance avec board*/;
	}

	function drawBackground(startXb, startYb, boardLength) {
		// draw background
		ctx.beginPath();
		ctx.arc(startXb + boardLength / 2, startYb + boardLength / 2, animation(), 0, Math.PI * 2, false);
		ctx.fillStyle = proto.p.color;
		ctx.fill();

		ctx.fillStyle = "B0B0B0";
    	ctx.fillRect(startXb+1, startYb+1, boardLength, boardLength);
    	ctx.fillStyle = "#F1B330";
    	ctx.fillRect(startXb, startYb, boardLength, boardLength);
	};

	function drawButton (startXb, startYb, boardLength) {
		var x = startXb - 200;
		var y = startYb + 170;

		ctx.strokeStyle = "rgba(255,255,255,.3)";
		// ctx.strokeStyle = "rgba(255,255,255," + cosinus() + ")";

		// draw pass button
		ctx.beginPath();
		ctx.arc(x+2, y+2, animation2(50, -1), 0, Math.PI * 2, false);
		ctx.fillStyle = '#B0B0B0';
		ctx.fill();
		ctx.beginPath();
		ctx.arc(x, y, animation2(50, -1), 0, Math.PI * 2, false);
		ctx.fillStyle = '#faa';
		ctx.fill();
		ctx.stroke();

		ctx.font = '20px sans-serif';
		ctx.lineWidth = 1;
		ctx.fillStyle = '#B0B0B0';
		ctx.fillText('Pass', x - 23 + 2, y + 7 + 2);
		ctx.fillStyle = '#fff';
		ctx.fillText('Pass', x - 23, y + 7);

		// x = animation() + 150;
		y = startYb + 320;

		// draw restart button
		ctx.beginPath();
		ctx.arc(x+2, y+2, animation2(50, -1), 0, Math.PI * 2, false);
		ctx.fillStyle = '#B0B0B0';
		ctx.fill();
		ctx.beginPath();
		ctx.arc(x, y, animation2(50, -1), 0, Math.PI * 2, false);
		ctx.fillStyle = '#d3d3d3';
		ctx.fill();
		ctx.stroke();

		ctx.font = '20px sans-serif';
		ctx.lineWidth = 1;
		ctx.fillStyle = '#B0B0B0';
		ctx.fillText('Restart', x - 33 + 2, y + 7 + 2);
		ctx.fillStyle = '#fff';
		ctx.fillText('Restart', x - 33, y + 7);
	}

	function drawInfo () {
		var startXb = board.startXb;
		var startYb = board.startYb;
		var boardLength = board.boardLength;

		ctx.font = '20px sans-serif';
		ctx.lineWidth = 1;
		ctx.fillStyle = '#B0B0B0';
		ctx.fillText(proto.p1.nbPieces + ' ' + proto.p1.color + ' stones', startXb + boardLength / 2 + animation() + 2, startYb + boardLength  - animation()) + 2;
		ctx.fillStyle = proto.p1.color;
		ctx.fillText(proto.p1.nbPieces + ' ' + proto.p1.color + ' stones', startXb + boardLength / 2 + animation(), startYb + boardLength  - animation());

		ctx.fillStyle = '#B0B0B0';
		ctx.fillText(proto.p2.nbPieces + ' ' + proto.p2.color + ' stones', startXb + boardLength / 2 + 10 + animation() + 2, startYb + boardLength + 50 - animation() + 2);
		ctx.fillStyle = proto.p2.color;
		ctx.fillText(proto.p2.nbPieces + ' ' + proto.p2.color + ' stones', startXb + boardLength / 2 + 10 + animation(), startYb + boardLength + 50 - animation());

		ctx.fillStyle = '#B0B0B0';
		ctx.fillText(proto.p1.nbPrisoners + ' ' + ((proto.p1.color == 'black') ? 'white' : 'black') + ' prisoners', startXb + boardLength / 2 + 10 + animation() + 2, startYb + boardLength + 210 - animation() + 2);
		ctx.fillStyle = ((proto.p1.color == 'black') ? 'white' : 'black');
		ctx.fillText(proto.p1.nbPrisoners + ' ' + ((proto.p1.color == 'black') ? 'white' : 'black') + ' prisoners', startXb + boardLength / 2 + 10 + animation(), startYb + boardLength + 210 - animation());

		ctx.fillStyle = '#B0B0B0';
		ctx.fillText(proto.p2.nbPrisoners + ' ' + ((proto.p2.color == 'black') ? 'white' : 'black') + ' prisoners', startXb + boardLength / 2 - 5 + animation() + 2, startYb + boardLength + 260 - animation() + 2);
		ctx.fillStyle = ((proto.p2.color == 'black') ? 'white' : 'black');
		ctx.fillText(proto.p2.nbPrisoners + ' ' + ((proto.p2.color == 'black') ? 'white' : 'black') + ' prisoners', startXb + boardLength / 2 - 5 + animation(), startYb + boardLength + 260 - animation());

	};

	function drawGrid (startXg, startYg, gridSize, squareSize) {
		var offset;

    	// draw lines
    	ctx.strokeStyle = "black";
    	ctx.lineWidth = 1;
		for (var i = 0; i < board.gameSize; i++) {
			offset = i * squareSize;
			// vertical lines
			ctx.beginPath();
			ctx.moveTo(startXg + offset, startYg);
			ctx.lineTo(startXg + offset, startYg + gridSize);
			ctx.stroke();
			ctx.closePath();

			// horizontal lines
			ctx.beginPath();
			ctx.moveTo(startXg, startYg + offset);
			ctx.lineTo(startXg + gridSize, startYg + offset);
			ctx.stroke();
			ctx.closePath();
		};
	}

	function drawCursor(x, y, ctx, curX, curY, curMargin, curRetract, data) {
		var curColor = '0'; // default color black

		if (data.array[x][y] == 'black') {
			curColor = "255"; // change color to white
		};

		ctx.strokeStyle = "rgba("+curColor+","+curColor+","+curColor+","+cosinus()+")";
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.lineWidth = 3;

		// nord-ouest
		ctx.beginPath();
		ctx.moveTo(curX - curMargin, curY - curRetract);
		ctx.lineTo(curX - curMargin, curY - curMargin);
		ctx.lineTo(curX - curRetract, curY - curMargin);
		ctx.stroke();
		ctx.closePath();
		// nord-est
		ctx.beginPath();
		ctx.moveTo(curX + curMargin, curY - curRetract);
		ctx.lineTo(curX + curMargin, curY - curMargin);
		ctx.lineTo(curX + curRetract, curY - curMargin);
		ctx.stroke();
		ctx.closePath();
		// sud-ouest
		ctx.beginPath();
		ctx.moveTo(curX - curMargin, curY + curRetract);
		ctx.lineTo(curX - curMargin, curY + curMargin);
		ctx.lineTo(curX - curRetract, curY + curMargin);
		ctx.stroke();
		ctx.closePath();
		// sud-est
		ctx.beginPath();
		ctx.moveTo(curX + curMargin, curY + curRetract);
		ctx.lineTo(curX + curMargin, curY + curMargin);
		ctx.lineTo(curX + curRetract, curY + curMargin);
		ctx.stroke();
		ctx.closePath();

	};

	function drawPieces() {
		var x,y;

		for (var i = 0; i < board.gameSize; i++) {
			x = board.startXg + board.squareSize * i;

			for (var j = 0; j < board.gameSize; j++) {
				y = board.startYg + board.squareSize * j;

				if (data.array[i][j] != null) {
					drawPiece(x, y, data.array[i][j]);
				};
			};
		};
	}

	function drawPiece (x, y, color) {
		// shadow
		ctx.beginPath();
		ctx.arc(x+2, y+2, 20, 0, Math.PI * 2, false);
		ctx.fillStyle = '#B0B0B0';
		ctx.fill();
		// piece color
		ctx.beginPath();
		ctx.arc(x, y, 20, 0, Math.PI * 2, false);
		ctx.fillStyle = color;
		ctx.fill();

		// gradient effects
		if (color == 'black') {
			var grad = ctx.createLinearGradient(x - 20,y - 20,x - 7 + 5,y - 7 + 5);
		    grad.addColorStop(0, '#B0B0B0');
		    grad.addColorStop(1, 'black');
			ctx.beginPath();
			ctx.arc(x, y, 20, 0, Math.PI*2, false);
			ctx.fillStyle = grad;
			// ctx.fillStyle = "rgba(199,199,199,.5)";
			ctx.fill();
		} else if (color == 'white') {
			var grad = ctx.createLinearGradient(x + 15,y + 15,x + 7 - 5,y + 7 - 5);
		    // grad.addColorStop(0, 'white');
		    grad.addColorStop(0, '#CECECE');
		    grad.addColorStop(0.6, '#EEEEEE');
		    grad.addColorStop(1, 'white');
			ctx.beginPath();
			ctx.arc(x, y, 20, 0, Math.PI*2, false);
			ctx.fillStyle = grad;
			// ctx.fillStyle = "rgba(199,199,199,.5)";
			ctx.fill();
		};
	};

	function clear (ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	return {
		animation : animation,
		animation2 : animation2,
		render : function render() {
			if (data.render == false) {return true;};
			clear(ctx);

			drawBackground(board.startXb, board.startYb, board.boardLength);

			drawGrid(board.startXg, board.startYg, board.gridSize, board.squareSize);

			drawPieces();

			drawCursor(cursor.getCurGridX(), cursor.getCurGridY(), canvas.ctx, cursor.curX, cursor.curY, cursor.curMargin, cursor.curRetract, data);

			drawInfo();

			drawButton(board.startXb, board.startYb, board.boardLength);

			setTimeout(function(){
	            data.counter+=0.05; // change velocity !
	            render(); // render next frame
	        },80);
		}
	};
})();

/**
 * Object thirdStage
 * Inherits game
 *
 */
var thirdStage = function () {};
thirdStage.prototype = new game();

/**
 * The renderer
 * draw background, and message.
 */
thirdStage.prototype.render = (function () {
	var self = this;
	var proto = thirdStage.prototype;
	var canvas = proto.canvas;
	var ctx = proto.canvas.ctx;
	var board = proto.board;
	var data = proto.data;

	function drawBackground(startXb, startYb, boardLength) {
		// draw background
		ctx.fillStyle = "#F1B330";
    	ctx.fillRect(startXb, startYb, boardLength, boardLength);
	};


	function drawInfo () {
		var startXb = board.startXb;
		var startYb = board.startYb;
		var boardLength = board.boardLength;

		ctx.font = '20px sans-serif';
		ctx.lineWidth = 1;
		ctx.fillStyle = '#B0B0B0';
		ctx.fillText(proto.msg, startXb + 60 + 2, startYb + boardLength * 4 / 8 + 2);
		ctx.fillStyle = 'white';
		ctx.fillText(proto.msg, startXb + 60, startYb + boardLength * 4 / 8);
	};

	function clear (ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	return {
		render : function render() {
			clear(ctx);

			drawBackground(board.startXb, board.startYb, board.boardLength);

			drawInfo();

			// restart game after 5 sec
			setTimeout(function(){
	            window.location.reload();
	        },5000);
		}
	};
})();



////////////////
// Start game //
////////////////

init();

});

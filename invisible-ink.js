(function () {
	var pathToDraw = [];
	var colors = ["black", "red", "blue", "green"];
	var drawingArea = document.getElementById("drawingArea");
	var context = drawingArea.getContext("2d");

	initialize();

	function initialize() {
		setUpCanvasEvents();
	}

	function setUpCanvasEvents(){
		drawingArea.onmousedown = function (event) {
			// Reset path
			pathToDraw = [];
		}

		drawingArea.onmousemove = function (event) {
			var rect = drawingArea.getBoundingClientRect();
			pathToDraw.push({
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			})
		}

		drawingArea.onmouseup = function (event) {
			drawPath();
		}
	}

	function drawPath() {
		context.fillStyle = pickRandomColor();

		for (var i=0; i<pathToDraw.length; i++) {
			var point = pathToDraw[i];
			context.fillRect(point.x, point.y, 5, 5);
		}
	}

	function pickRandomColor() {
		// Random number between 0 and length-1
		var index = Math.floor( ( Math.random() * colors.length ) );
		return colors[index];
	}
})();
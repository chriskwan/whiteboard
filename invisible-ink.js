(function () {
	var isDrawing = false;
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

			isDrawing = true;
		}

		drawingArea.onmousemove = function (event) {
			if (!isDrawing) {
				return;
			}

			var rect = drawingArea.getBoundingClientRect();
			var point = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			};
			pathToDraw.push(point);
			drawPoint(point);
		}

		drawingArea.onmouseup = function (event) {
			drawPath();
			isDrawing = false;
		}
	}

	function drawPoint(point) {
		context.fillRect(point.x, point.y, 5, 5);
	}

	function drawPath() {
		context.fillStyle = pickRandomColor();

		for (var i=0; i<pathToDraw.length; i++) {
			var point = pathToDraw[i];
			drawPoint(point);
		}
	}

	function pickRandomColor() {
		// Random number between 0 and length-1
		var index = Math.floor( ( Math.random() * colors.length ) );
		return colors[index];
	}
})();
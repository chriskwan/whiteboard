(function () {
	initialize();

	function initialize() {
		setUpUI();
	}

	function setUpUI(){
		var drawingArea = document.getElementById("drawingArea");
		drawingArea.onclick = function (event) {
			var context = drawingArea.getContext("2d");
			context.fillStyle = "blue";
			var rect = drawingArea.getBoundingClientRect();
			context.fillRect(event.clientX - rect.left, event.clientY - rect.top, 50, 50);
		}
	}
})();
(function () {
	var isDrawing = false;
	var colors = ["black", "red", "blue", "green"];
	var drawingArea = document.getElementById("drawingArea");
	var context = drawingArea.getContext("2d");
	var penColor = pickRandomColor();

	var peer;

	initialize();

	function initialize() {
		setUpCanvasEvents();
		setUpUI();

		// Set the connect link initially so we can see what url is being loaded
		//cwkTODO remove this when we figure out the https issue
		document.getElementById("connectLink").innerHTML = window.location;
		document.getElementById("protocol").innerHTML = window.location.protocol;

		setUpPeer();
	}

	function setUpCanvasEvents(){
		drawingArea.addEventListener("mousedown", onMouseDown);
		drawingArea.addEventListener("touchstart", onMouseDown);

		drawingArea.addEventListener("mousemove", onMouseMove);
		drawingArea.addEventListener("touchmove", onTouchMove);

		drawingArea.addEventListener("mouseup", onMouseUp);
		drawingArea.addEventListener("touchend", onMouseUp);
	}

	function onMouseDown(event) {
		isDrawing = true;
	}

	function onMouseMove(event) {
		draw(event.clientX, event.clientY);
	}

	function onTouchMove(event) {
		// Prevent default panning of the page on drag
		event.preventDefault();

		if (!event.touches.length) {
			return;
		}

		var clientX = event.touches[0].clientX;
		var clientY = event.touches[0].clientY;

		draw(clientX, clientY);
	}

	function draw(clientX, clientY) {
		if (!isDrawing) {
			return;
		}

		var rect = drawingArea.getBoundingClientRect();
		var point = {
			x: clientX - rect.left,
			y: clientY - rect.top
		};

		drawPoint(point, penColor);
		sendPointToPeers(point, penColor);
	}

	function onMouseUp(event) {
		isDrawing = false;
	}

	function sendPointToPeers(point, color) {
		for (var currentPeerId in peer.connections) {
			if (!peer.connections.hasOwnProperty(currentPeerId)) {
				return;
			}

			var connectionsWithCurrentPeer = peer.connections[currentPeerId];

			// It's possible to have multiple connections with the same peer,
			// so send on all of them
			for (var i=0; i<connectionsWithCurrentPeer.length; i++) {
				connectionsWithCurrentPeer[i].send({point: point, color: color});
			}
		}	
	}

	function sendPathToPeers(path, color) {
		for (var currentPeerId in peer.connections) {
			if (!peer.connections.hasOwnProperty(currentPeerId)) {
				return;
			}

			var connectionsWithCurrentPeer = peer.connections[currentPeerId];

			// It's possible to have multiple connections with the same peer,
			// so send on all of them
			for (var i=0; i<connectionsWithCurrentPeer.length; i++) {
				connectionsWithCurrentPeer[i].send({path: path, color: color});
			}
		}
	}

	function drawPoint(point, color) {
		context.fillStyle = color;
		context.fillRect(point.x, point.y, 5, 5);
	}

	function drawPath(path, color) {
		var peerContext
		for (var i=0; i<path.length; i++) {
			var point = path[i];
			drawPoint(point, color);
		}
	}

	function pickRandomColor() {
		// Random number between 0 and length-1
		var index = Math.floor( ( Math.random() * colors.length ) );
		return colors[index];
	}

	function setUpUI() {
		createColorRadioButtons();
		setUpPeerConnectUI();
	}

	function setUpPeerConnectUI() {
		var peerIdInput = document.getElementById("peerIdInput");
		var connectBtn = document.getElementById("connectBtn")

		connectBtn.onclick = function () {
			var requestedPeer = peerIdInput.value;
			connectToPeer(requestedPeer);
		};

		peerIdInput.onkeyup = function (event) {
			if (event.keyCode === 13) { // Enter key
				var requestedPeer = peerIdInput.value;
				connectToPeer(requestedPeer);
			}
		};
	}

	function createColorRadioButtons() {
		var colorChooser = document.getElementById("colorChooser");
		for (var i=0; i<colors.length; i++) {
			var color = colors[i];
			var colorRadioButton = '<input type="radio" name="color" value="' + color + '"';
			if (color === penColor) {
				colorRadioButton += ' checked'
			}
			colorRadioButton += '>';
			colorRadioButton += color;
			colorChooser.innerHTML += colorRadioButton;
		}

		colorChooser.onclick = function (event) {
			penColor = event.target.value;
		}
	}

	// Sending a connection to a peer (i.e.: you hit the Connect button)
	function connectToPeer(peerId) {
		var conn = peer.connect(peerId);

		// Connection has been established
		conn.on('open', function () {
			setUpCanvasForConnection(conn);
		});
	}

	function setUpPeer() {
		peer = new Peer({
			key: 'lwjd5qra8257b9', //cwkTODO this is the demo api key
			debug: 3
		});

		// Initialization - ready to receive connections
		peer.on('open', function (id) {
			console.log('My peer ID is: ' + id);

			document.getElementById("mypeerid").innerHTML = id;

			createConnectLink();

			connectToPeerInUrl();
		});

		// Receiving a connection from a peer (i.e.: they hit the Connect button)
		peer.on('connection', function (conn) {

			setUpCanvasForConnection(conn);

			conn.on('open', function () {
				console.log("Connected to by " + conn.peer);
				alert("Connected to by " + conn.peer); //cwkTODO put this in a div

				conn.send("thanks for connecting. here are my connections");
				var connections = [];
				for (var peerId in peer.connections) {
					if (peer.connections.hasOwnProperty(peerId)) {
						connections.push(peerId);
					}
				}
				conn.send({connections: connections});
			})
		});
	}

	function createConnectLink() {
		var connectLink = document.getElementById("connectLink");
		// Ref: http://stackoverflow.com/a/5817548
		var urlWithoutQueryString = window.location.href.split('?')[0];
		connectLink.innerHTML = urlWithoutQueryString + "?connectTo=" + peer.id;
	}

	function connectToPeerInUrl() {
		// There's probably a way to do this with one regex,
		// but I think this is more readable
		var queryStringParams = window.location.search.split(/[&?]/);

		if (!queryStringParams || !queryStringParams.length) {
			return;
		}

		var peerId = null;
		var param;
		for (var i=0; i<queryStringParams.length; i++) {
			param = queryStringParams[i];
			if (param.indexOf("connectTo=") !== -1) {
				peerId = param.split("=")[1];
				break;
			}
		}

		if (peerId) {
			connectToPeer(peerId);
		}
	}

	function setUpCanvasForConnection(conn) {
		conn.on('data', function (data) {
			if (data.connections) {
				for (var i=0; i<data.connections.length; i++) {
					var peerId = data.connections[i];
					// Not already connected to this peer and not myself
					if (!peer.connections.hasOwnProperty(peerId) && peerId !== peer.id) {
						connectToPeer(peerId);
					}
				}
			} else if (data.point && data.color) {
				drawPoint(data.point, data.color);
			} else {
				console.log("Received data from " + conn.peer + ": " + data);
			}
		});
	}

})();
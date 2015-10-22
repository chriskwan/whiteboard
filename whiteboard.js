(function () {
	var isDrawing = false;
	var colors = ["black", "red", "blue", "green"];
	var drawingArea = document.getElementById("drawingArea");
	var context = drawingArea.getContext("2d");
	var penColor = pickRandomColor();

	var peer;

	initialize();

	function initialize() {
		alert(Whiteboard.p2p.speak);

		setUpCanvasEvents();
		setUpUI();

		// Set the connect link initially so we can see what url is being loaded
		//cwkTODO remove this when we figure out the https issue
		document.getElementById("connectLink").innerHTML = window.location;
		document.getElementById("protocol").innerHTML = window.location.protocol;

		//cwkTODO move to p2p
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

		//cwkTODO move to p2p
		sendPointToPeers(point, penColor);
	}

	function onMouseUp(event) {
		isDrawing = false;
	}

	//cwkTODO move to p2p
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

	//cwkTODO move to p2p
	//cwkTODO split?
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

		//cwkTODO move to p2p
		setUpPeerConnectUI();
	}

	//cwkTODO move to p2p
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
		Whiteboard.p2p.connectToPeer(peerId, function (conn) {
			setUpCanvasForConnection(conn);
			updateConnectionsList();
		}, function (conn) {
			addToStatus(conn.peer + " left the whiteboard. Oh well.");
			updateConnectionsList();
		});
	}

	function setUpPeer() {
		peer = Whiteboard.p2p.createPeer();

		// Initialization - ready to receive connections
		peer.on('open', function (id) {
			addToStatus('My peer ID is: ' + id);

			document.getElementById("mypeerid").value = id;

			createConnectLink();

			connectToPeerInUrl();
		});

		// Receiving a connection from a peer (i.e.: they hit the Connect button)
		peer.on('connection', function (conn) {

			setUpCanvasForConnection(conn);

			conn.on('open', function () {
				addToStatus("Connected to by " + conn.peer);
				addToStatus("Connected to by " + conn.peer); //cwkTODO put this in a div

				conn.send("thanks for connecting. here are my connections");
				var connections = [];
				for (var peerId in peer.connections) {
					if (peer.connections.hasOwnProperty(peerId)) {
						connections.push(peerId);
					}
				}
				conn.send({connections: connections});

				updateConnectionsList();
			});

			conn.on('close', function () {
				addToStatus(conn.peer + " left the whiteboard. Oh well.");
				updateConnectionsList();
			});
		});
	}

	//cwkTODO move to p2p
	//cwkTODO split?
	function updateConnectionsList() {
		var connectionList = document.getElementById("connectionList");
		
		var connectionListString = "";
		for (var peerId in peer.connections) {
			if (peer.connections.hasOwnProperty(peerId)) {
				var peerConnections = peer.connections[peerId];
				for (var i=0; i<peerConnections.length; i++) {
					if (peerConnections[i].open) {
						connectionListString += peerId + ", ";
					}
				}
			}
		}
		// Remove trailing comma and space
		if (connectionListString.length) {
			connectionListString = connectionListString.substring(0, connectionListString.length-2);
		}

		connectionList.innerHTML = connectionListString.length ? connectionListString : "Nobody ( everyone left :( )";
	}

	//cwkTODO move to p2p
	function createConnectLink() {
		var connectLink = document.getElementById("connectLink");
		// Ref: http://stackoverflow.com/a/5817548
		var urlWithoutQueryString = window.location.href.split('?')[0];
		connectLink.value = urlWithoutQueryString + "?connectTo=" + peer.id;
	}

	//cwkTODO move to p2p
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

	//cwkTODO move to p2p
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
				addToStatus("Received data from " + conn.peer + ": " + data);
			}
		});
	}

	function addToStatus(message) {
		var newStatus = document.createElement("p");
		newStatus.innerHTML = new Date().toTimeString() + ":<br>" + message;
		var statusArea = document.getElementById("status");
		statusArea.innerHTML = newStatus.outerHTML + statusArea.innerHTML;
	}

})();

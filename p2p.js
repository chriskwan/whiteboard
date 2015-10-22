Whiteboard.p2p = (function () {
	var peer; //cwkTODO should i make a constructor function instead?
	
	return {
		createPeer: function (openCallback, connectionCallback) {
			peer = new Peer({
				key: 'lwjd5qra8257b9', //cwkTODO this is the demo api key
				debug: 3
			});

			if (openCallback) {
				// Initialization - ready to receive connections
				peer.on('open', openCallback);
			}

			if (connectionCallback) {
				// Receiving a connection from a peer (i.e.: they hit the Connect button)
				peer.on('connection', connectionCallback);
			}

			return peer;
		},


		connectToPeer: function (peerId, openCallback, closeCallback) {
			var conn = peer.connect(peerId);

			// Connection has been established
			conn.on('open', function () {
				if (openCallback) {
					openCallback(conn);
				}
			});

			conn.on('close', function () {
				if (closeCallback) {
					closeCallback(conn);
				}
			});
		}

	};
})();

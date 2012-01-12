$(function() {

	var $canvas = $("#canvas");
	
	var context = $canvas[0].getContext("2d");
	context.lineCap = 'round';
	context.lineJoin = 'round';
    	
	var paint = false;	
	var paths = [];

	// Copy composite mode doesn't seem to work with node or firefox which
	// makes it difficult to work with tranparent or semi-transparent brushes.
	// To simulate we use lighter shades of the colours but it means we can't 
	// have a gradient behind the canvas. 
	
	var red = {color: "rgb(255, 185, 185)", width: 5, mode: "source-over"};
	var green = {color: "rgb(185, 255, 185)", width: 5, mode: "source-over"};
	var blue = {color: "rgb(185, 185, 255)", width: 5, mode: "source-over"};
	var black = {color: "rgb(185, 185, 185)", width: 5, mode: "source-over"};
	//var erase = {color: "rgba(0, 0, 0, 0)", width: 20, mode: "copy"}; 
	var erase = {color: "rgba(255, 255, 255, 255)", width: 80, mode: "source-over"}; 

	var brush = red;

	var socket = {
	
		connection: "",	
		disabled: false,
		config: {
			logger: "#log",
			host: "/"
		},
	
		connect: function(config) {	
		
			// Allows us to override built in config object
			$.extend(socket.config, config);
				
			try {
				socket.connection = io.connect(socket.config.host);
				// Set initial not ready message
				socket.log("event", "Socket status: closed");

				socket.connection.on('connect', function() {
					socket.log("event", "Socket status: open");
				});
			
				socket.connection.on('message', function(msg) {
				
					var type = msg.type;
					var body = msg.body;
					 
					socket.log("message", "Received message: " + type 
						+ " : body : " + JSON.stringify(body));
				
					var handler = {
						"push" : function() {
							//console.log("Canvas: " + body);
							var img = new Image();
							img.src = body;
							img.onload = function() {
								context.drawImage(img, 0, 0);							
							}
						},
						"draw" : function() {
							draw(body.brush, body.paths);
						},
						"clear" : function() {
							//;	
						},
						"count" : function() {
							//console.log(body);
							//$("#count").html("Connected users: <b>" + body + "</b>");
						}						
					};

					handler[msg.type]();
				});								
			} 

			catch(exception) {
				socket.log("warning", "Error" + exception);
			}

		},

		send: function(type, body) {

			try {
				var json = JSON.stringify({type: type, body: body});
				socket.connection.send(json);
				/*socket.log('event', 'Sent message: ' + type + ' : body : ' 
					+ JSON.stringify(body));*/
			} catch(exception) {
				socket.log('warning', 'Could not send message');
			}		

		},	

		close: function() {
			socket.connection.disconnect();	
		},

		log: function(type, msg) {

			var $logger = $(socket.config.logger);
			msg = "<p class='" + type + "'>" + msg + "<\/p>";

			($logger.html() == "") 
				? $logger.html(msg) 
				: $logger.prepend(msg);
		}
	};

	var draw = function(brush, paths) {
		
		var l = paths.length;

		var x;
		var y;

		var path;

		context.globalCompositeOperation = brush.mode;
		context.strokeStyle = brush.color;
		context.lineWidth = brush.width;

		for (var i = 0; i < l; i ++) {
			
			context.beginPath();			
			path = paths[i];

			if (path.drag && i) {
				context.moveTo(paths[i - 1].x, paths[i - 1].y);							
			} else if (!path.drag) {
				context.moveTo(path.x - 1, path.y - 1);
			}
			
			context.lineTo(path.x, path.y);
			context.closePath();
			context.stroke();
		}
	};

	var addClick = function(x, y, drag) {
		paths.push({x: x, y: y, drag: drag});
		socket.send("draw", {brush: brush, paths: paths});
		draw(brush, paths);
		paths = [paths[paths.length - 1]];
	};
	
	$canvas.mousedown(function(e) {
		paint = true;
		addClick(
			e.pageX - this.offsetLeft, 
			e.pageY - this.offsetTop, 
			false
		);
	});
	
	$canvas.mouseup(function(e) {
		paint = false;
	});

	$canvas.mouseleave(function(e) {
		paint = false;
	});

	$canvas.mousemove(function(e) {
		if (paint) {
			addClick(
				e.pageX - this.offsetLeft, 
				e.pageY - this.offsetTop, 
				true
			);	
		}
	});

	$("#red").click(function(e) {
		brush = red;
	});

	$("#green").click(function(e) {
		brush = green;
	});

	$("#blue").click(function(e) {
		brush = blue;
	});

	$("#black").click(function(e) {
		brush = black;
	});

	$("#erase").click(function(e) {
		brush = erase;
	});

	// Initialise socket
	socket.connect();
});
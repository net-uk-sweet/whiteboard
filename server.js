var http = require('http')
, url = require('url')
, fs = require('fs')
, path = require('path')
, mime = require('mime')
, server
, count = 0;

server = http.createServer(function(request, result) {
	// server code
	var path = url.parse(request.url).pathname;
	if (path == "/") path = "/index.htm";
	// console.log("Path: " + path);
	var type = mime.lookup(path);

	fs.readFile(__dirname + path, function(error, data) {
	//	console.log(err);
		if (error) {
			result.writeHead(404);
			result.write('404');
			result.end();			
		} else {
			result.writeHead(200, {'Content-Type': type});
			result.write(data, 'utf8');
			result.end();			
		}
	});
});
server.listen(process.env.PORT || 8080);

// Create a master canvas
var Canvas = require('canvas')
  , canvas = new Canvas(800, 600)

var context = canvas.getContext('2d');
context.lineCap = 'round';
context.lineJoin = 'round';
    
// Set up the socket
var io = require('socket.io').listen(server); 
io.sockets.on('connection', function (socket) {
	
	count ++;
	
	// TODO: how to send a canvas down the wire
	//send(socket, "push", canvas);	
	canvas.toDataURL(function(err, str) {
		send(socket, "push", str);
	});
	
	socket.on('message', function (msg) { 

		msg = JSON.parse(msg);

		var type = msg.type
		var body = msg.body;

		//console.log("Received message: " + msg.type);	
		
		// Handle incoming messages appropriately.
		var handler = {
			"draw": function() {
				// console.log("Body: " + body);
				draw(body.brush, body.paths);
				broadcast(socket, "draw", body);
			},
			"clear": function() {
				// clear canvas
				send(socket, "clear"); // TODO: check magnets also
				broadcast(socket, "clear");
			},
			"reset": function() {
				// Do a push here
				console.log("Resetting");
			}			
		}

		handler[type]();
	});

	socket.on('disconnect', function() {
		count --;
		broadcast(socket, "count", count);
	});
});

function draw(brush, paths) {
	
	var l = paths.length;

	var x;
	var y;

	var path;

	// console.log("mode: " + brush.mode);

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
}

// Sends to the invokee
function send(socket, type, body) {
	//console.log("Sending to " + socket);
	socket.emit("message", {type: type, body: body});
}

function broadcast(socket, type, body, all) {
	socket.broadcast.emit("message", {type: type, body: body});
	if (all) send(socket, type, body);
}

// Write game data to file
function setData(data) {	
	//fs.writeFile(file, JSON.stringify(data)); 	
}


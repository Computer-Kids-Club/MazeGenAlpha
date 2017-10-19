var players = [];

function Player(id, x, y) {
  this.id = id;
  this.x = x;
  this.y = y;
}

function Cell(i, j) {
  this.i = i;
  this.j = j;
  this.walls = [true, true, true, true];
  this.visited = false;
}

var cols;
var rows;
var w = 90;
var spacing = 5;
var height = 910;
var width = 910;

var grid = [];

var map = false;

var newCoordinates;
var randNum;
var floorNum;

var openSlots = [];

for (var x = spacing + w / 2; x < width - spacing; x += w) {
  for (var y = spacing + w / 2; y < height - spacing; y += w) {
    openSlots.push([x, y]);
  }
}

var express = require('express');

var app = express();
var server = app.listen(3000);

app.use(express.static('public'));

console.log('My server is running');

var socket = require('socket.io');

var io = socket(server);

setInterval(heartbeat, 33);

function heartbeat() {
  io.sockets.emit('heartbeat', players);
}

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  console.log('new connection: ' + socket.id);
  // console.log(grid);
  if (grid.length > 0) {
    socket.emit('mapLayout', grid);
  } else {
    socket.emit('mapStart', 1);
  }

  randNum = Math.random(openSlots.length)*100;
  floorNum = Math.floor(randNum);
  newCoordinates = floorNum;
  socket.emit('newPlayer', openSlots[newCoordinates-1]);
  openSlots.splice(newCoordinates-1, 1);
  console.log(openSlots.length);

  socket.on('mapFinished', gridLayout);

  function gridLayout(data) {
    console.log('the map has been finished');
    map = true;
    grid = data;
  }
  socket.on('start', startFunction);

  function startFunction(data) {
    var player = new Player(socket.id, data.x, data.y);
    players.push(player);
    // socket.broadcast.emit('mouse', data);
    //console.log(socket.id, data.x, data.y);
  }

  socket.on('update', updateFunction);

  function updateFunction(data) {
    var player;
    for (var i = 0; i < players.length; i++) {
      if (socket.id == players[i].id) {
        player = players[i];
      }
    }
    player.x = data.x;
    player.y = data.y;
    //console.log(socket.id, data.x, data.y);
  }
}

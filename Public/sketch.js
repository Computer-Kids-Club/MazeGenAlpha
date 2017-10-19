var socket;

var cols;
var rows;
var w = 90;
var spacing = 5;
var grid = [];
var players = [];

var player;

var current;

var stack = [];

var stackStart = false;

function setup() {
  socket = io.connect('http://localhost:3000');
  // socket.on('mouse', newDrawing);
  createCanvas(910, 910);
  cols = floor(width / w);
  rows = floor(height / w);

  // ranX = round(random(cols)) + 1;
  // ranY = round(random(rows)) + 1;
  // player = new Player(ranX * w - w / 2 + spacing, ranY * w - w / 2 + spacing);
  // console.log(ranX, ranY);

  player = socket.on('newPlayer', newPlayer);

  function newPlayer(data){
    player = new Player(data[0], data[1]);
    console.log(player.x, player.y);
    players.push(player);
    return player;
  }

  var data = {
    x: player.x,
    y: player.y,
  };

  socket.emit('start', data);
  socket.on('mapStart', mapStart);
  socket.on('heartbeat', heartbeat);

  function mapStart(data) {
    console.log(data);
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var cell = new Cell(i, j);
        grid.push(cell);
      }
    }
    current = grid[0];
    while (true) {
      current.visited = true;

      var next = current.checkNeighbors();
      if (next) {
        next.visited = true;
        stack.push(current);
        stackStart = true;
        removeWalls(current, next);
        current = next;
      } else if (stack.length > 0) {
        current = stack.pop();
      }
      if (stackStart && stack.length == 0) {
        break;
      }
    }
    socket.emit('mapFinished', grid);
    console.log('emmited');
  }

  function heartbeat(data) {
    // console.log(data);
    players = data;
  }

  socket.on('mapLayout', loadMap);

  function loadMap(data) {
    console.log('a new map has been recieved');
    // console.log(data);
    // grid = data;
    // console.log(grid);
    for (var k = 0; k < data.length; k++) {
      console.log(data[k]);
      var cell = new Cell(data[k].i, data[k].j);
      cell.walls = data[k].walls;
      cell.visited = data[k].visited;
      grid.push(cell);
    }
    console.log(grid[0]);
  }
}

// function newDrawing(data){
//   noStroke();
//   fill(255,0,0);
//   ellipse(data.x, data.y, 36, 36);
// }

function draw() {
  background(240);
  for (var x = spacing + w / 2; x < width - spacing; x += w) {
    for (var y = spacing + w / 2; y < height - spacing; y += w) {
      point(x, y);
    }
  }
  for (var i = 0; i < grid.length; i++) {
    grid[i].show();
  }
  for (var i = players.length - 1; i >= 0; i--) {
    var id = players[i].id;
    if (id !== socket.id) {
      fill(0, 0, 255);
      ellipse(players[i].x, players[i].y, 20, 20);
      // fill(0);
      // textAlign(CENTER);
      // textSize(50);
      // text(str(players[i].id), players[i].x, players[i].y + 20);
      // for (var i = 0; i < players.length; i++) {
      //   // players[i].show();\
      //   // console.log(players[i].id, socket.id);
      //   if(i != myIndex){
      //     fill(255,0,0);
      //   ellipse(players[i].x, players[i].y , 20,20);
      // } else {
      //
      //     console.log('didnt draw', myIndex)
      // }
      //   textSize(100);
      //   text(str(players[i].id), players[i].x, players[i].y);
    } else {

      fill(0, 255, 0, 100);
      ellipse(players[i].x, players[i].y, 20, 20);
    }

  }
  var data = {
    x: player.x,
    y: player.y,
  };

  socket.emit('update', data);
}

// function mouseDragged() {
//   var data = {
//     x: mouseX,
//     y: mouseY
//   };
//   socket.emit('mouse', data);
// }

function index(i, j) {
  if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) {
    return -1;
  }
  return i + j * cols;
}

function Cell(i, j) {
  this.i = i;
  this.j = j;
  this.walls = [true, true, true, true];
  this.visited = false;

  this.checkNeighbors = function() {
    var neighbors = [];

    var top = grid[index(i, j - 1)];
    var right = grid[index(i + 1, j)];
    var bottom = grid[index(i, j + 1)];
    var left = grid[index(i - 1, j)];

    if (top && !top.visited) {
      neighbors.push(top);
    }
    if (right && !right.visited) {
      neighbors.push(right);
    }
    if (bottom && !bottom.visited) {
      neighbors.push(bottom);
    }
    if (left && !left.visited) {
      neighbors.push(left);
    }

    if (neighbors.length > 0) {
      var r = floor(random(0, neighbors.length));
      return neighbors[r];
    } else {
      return undefined;
    }
  };

  this.show = function() {
    var x = this.i * w + spacing;
    var y = this.j * w + spacing;
    stroke(0);
    strokeWeight(5);
    if (this.walls[0]) {
      line(x, y, x + w, y);
    }
    if (this.walls[1]) {
      line(x + w, y, x + w, y + w);
    }
    if (this.walls[2]) {
      line(x + w, y + w, x, y + w);
    }
    if (this.walls[3]) {
      line(x, y + w, x, y);
    }
  };
}

function removeWalls(a, b) {
  var x = a.i - b.i;
  if (x == 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x == -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }

  var y = a.j - b.j;
  if (y == 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y == -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function Player(x, y, colour) {
  this.x = x;
  this.y = y;
  this.size = 50;
  this.sizeX = this.size * 3 / 4;
  this.sizeY = this.size;
  this.radius = this.sizeY / 2;
  this.tread = this.sizeY / 6;
  this.colour = colour;
  this.barrelSize = this.sizeX / 8;
  this.barrelLength = this.sizeY * 3 / 4;

  this.show = function() {
    fill(255, 0, 0);
    strokeWeight(2);
    rect(this.x, this.y, this.sizeX, this.sizeY);
    fill(200, 0, 10);
    noStroke();
    rect(this.x, this.y, this.sizeX / 3, this.sizeY);
    rect(this.x + this.sizeX * 2 / 3, this.y, this.sizeX / 3, this.sizeY);
    stroke(0);
    line(this.x + this.sizeX / 3, this.y, this.x + this.sizeX / 3, this.y + this.sizeY);
    line(this.x + this.sizeX * 2 / 3, this.y, this.x + this.sizeX * 2 / 3, this.y + this.sizeY);
    for (var i = this.tread; i < this.sizeY; i += this.tread) {
      line(this.x, this.y + i, this.x + this.sizeX / 3, this.y + i);
      line(this.x + this.sizeX * 2 / 3, this.y + i, this.x + this.sizeX, this.y + i);
    }
    fill(75, 0, 0);
    rect(this.x + this.sizeX / 2 - this.barrelSize / 2, this.y + this.sizeY * 2 / 3 - this.barrelLength, this.barrelSize, this.barrelLength);
    ellipse(this.x + this.sizeX / 2, this.y + this.sizeY * 2 / 3, this.radius, this.radius);
  };
}

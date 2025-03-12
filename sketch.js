let fishes = [];
let frameRange = [];
let curentFrame = 5000;
let table;
let Xrange = [-8.0, 8.0]; // the range of x values in the data
let Yrange = [-8.0, 8.0]; // the range of y values in the data
let imageCenter = { x: 0, y: 0 };
let outPutScaleX; // the scale of the output visualisation
let outPutScaleY; // the scale of the output visualisation
function preload() {
  //  load csv file
  table = loadTable('LC_field_tracks.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight); // poster is resized automatically
  frameRange = countFrames();
  console.log(frameRange);
  //curentFrame = frameRange[0];
  console.log(getCurrentFrame());
  // populate with fish
  noStroke();
   outPutScaleX = width * 30; // the scale of the output visualisation
   outPutScaleY = height * 30; // the scale of the output visualisation
}


function draw() {
  console.log(curentFrame);
  background(0, 0, 0);
  fill(255);
  let centroid = mapPosition(getCurrentFrame());
  imageCenter.x = centroid.x * 0.1 + imageCenter.x * 0.9; // weighted moving average to smooth out the centroid
  imageCenter.y = centroid.y * 0.1 + imageCenter.y * 0.9; // weighted moving average to smooth out the centroid
  push();
  // user the centroid to keep the fish in the center of the screen
  translate(width / 2 - imageCenter.x, height / 2 - imageCenter.y);
  // rectangular grid
  let gridSpacing = 200;
  let gridColor = color(50, 50, 50)
  for (let i = 0; i < outPutScaleX * 2; i += gridSpacing) {
    stroke(gridColor);
    line(i, 0, i, outPutScaleY);
  }
  for (let i = 0; i < outPutScaleY * 2; i += gridSpacing) {
    stroke(gridColor);
    line(0, i, outPutScaleX, i);
  }
  noStroke();
  // draw fish
  for (let i = 0; i < fishes.length; i++) {
    fishes[i].display();
  }
  fill(0, 0, 255);
  // circle(centroid.x, centroid.y, 10);
  pop()
}

function getCurrentFrame() {
  // check csv for current frame and return object with all fish in all frames that share the same FRAME_ID
  let currentFish = [];

  let averagePosition = { x: 0, y: 0 };
  let fishCount = 0;
  for (let i = 0; i < table.getRowCount(); i++) {
    try {
      let frame = table.getNum(i, "FRAME_IDX");
      if (frame == curentFrame) {
        // object literal with fish properties
        let data = {
          x: table.getNum(i, "X"),
          y: table.getNum(i, "Y"),
          heading: table.getNum(i, "DIRECTION"),
          ID: table.getNum(i, "IDENTITY")
        }
        fishCount++;
        averagePosition.x += data.x;
        averagePosition.y += data.y;
        //if ID doesn't exist in fishes array, then push new fish
        let found = false;
        for (let j = 0; j < fishes.length; j++) {
          if (fishes[j].ID == data.ID) {
            found = true;
            // update fish parameters 
            fishes[j].update(data.x, data.y, data.heading);
          }
        }

        if (!found) {
          // not found, add new fish to array
          let size = random(10, 15);
          let f = new fish(data.x, data.y, data.heading, size, data.ID);
          fishes.push(f);
        }
        currentFish.push(data);
      }
    } catch (e) {
      console.log("error");
    }
  }
  averagePosition.x /= fishCount;
  averagePosition.y /= fishCount;
  curentFrame++;
  return averagePosition;
}



function countFrames() {
  // scan throught the FRAME_IDX column in csv, and get the lowest and highest value
  let minFrame = 1000000;
  let maxFrame = 0;
  for (let i = 0; i < table.getRowCount(); i++) {
    let frame = table.getNum(i, "FRAME_IDX");
    if (frame < minFrame) {
      minFrame = frame;
    }
    if (frame > maxFrame) {
      maxFrame = frame;
    }
  }
  return [minFrame, maxFrame];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  outPutScaleX = width * 30; // the scale of the output visualisation
  outPutScaleY = height * 30; // the scale of the output visualisation
}

function mapPosition(arg1, arg2) {
  let position = { x: 0, y: 0 };

  Yrange
  let xlow = Xrange[0];
  let xhigh = Xrange[1];
  let ylow = Xrange[0];
  let yhigh = Xrange[1];

  if (typeof arg1 === 'object') {
    // If the first argument is an object, assume it has x and y properties
    position.x = map(arg1.x, xlow, xhigh, 0, outPutScaleX);
    position.y = map(arg1.y, ylow, yhigh, 0, outPutScaleY);
  } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    // If the first and second arguments are numbers, use them as x and y
    position.x = map(arg1, xlow, xhigh, 0, outPutScaleX);
    position.y = map(arg2, ylow, yhigh, 0, outPutScaleY);
  } else {
    throw new Error('Invalid arguments passed to mapPosition');
  }

  return position;
}

class fish {

  constructor(x, y, heading, size, ID) {
    let pos = mapPosition(x, y);
    this.x = pos.x;
    this.y = pos.y;
    this.heading = heading;
    this.size = size;
    this.ID = ID;
    this.tail;
    this.shade = 254;
    // See segment.js for more information.
    let point = new p5.Vector(this.x, this.y);

    let current = new Segment(point, 5, 0);
    for (let i = 0; i < 20; i++) {
      let next = new Segment(current, 5, i);
      current.child = next;
      current = next;
    }
    this.tail = current;
  }

  update(x, y, heading) {
    let pos = mapPosition(x, y);
    this.x = pos.x;
    this.y = pos.y;
    this.heading = heading;
    this.tail.follow(this.x, this.y);
    this.tail.update();
    this.shade = 254;
  }

  display() {
    // fish animation based on kinematics 
    // body

  
    this.shade -= 3; // slowly fade fish when it's not updated
    let c = color(255, 255, 255, this.shade);
    // tail of circles trailing behind body based on heading using inverse kinematics
    this.tail.show(c);
    let next = this.tail.par;
    while (next) {
      next.follow();
      next.update();
      next.show(c);
      next = next.par;
    }
    fill(255, 0, 0)
    noStroke();
   // text(this.ID, this.x, this.y);
  }

}


class Segment {
  // borowed from daniel Shiffman 

  /* Unlike in Java, JavaScript does not implement
   * function overloading, which means we cannot simply have
   * two different constructors for our Segment class as Shiffman does in
   * his pde example. Instead, we must have one constructor function
   * which behaves differently depending on the type of arguments we pass.
   */
  constructor(point, len, i) {
    if (point.hasOwnProperty("angle")) {
      this.par = point;
      this.a = this.par.b.copy();

    } else {

      this.par = false;
      this.a = point;

    }

    this.b = new p5.Vector();
    this.angle = 0;
    this.sw = map(i, 0, 20, 1, 20);
    this.len = len;
    this.calculateB();
  }


  follow(tx, ty) {
    if (typeof (ty) == "undefined") {

      let targetX = this.child.a.x;
      let targetY = this.child.a.y;
      this.follow(targetX, targetY);

    } else {

      let target = new p5.Vector(tx, ty);
      let dir = p5.Vector.sub(target, this.a);
      this.angle = dir.heading();

      dir.setMag(this.len);
      dir.mult(-1);
      this.a = p5.Vector.add(target, dir);

    }
  }

  calculateB() {
    let dx = this.len * cos(this.angle);
    let dy = this.len * sin(this.angle)
    this.b.set(this.a.x + dx, this.a.y + dy);
  }

  update() {
    this.calculateB();
  }

  show(color) {
    //fill(shade,0,255);
    stroke(color);
    strokeWeight(this.sw);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

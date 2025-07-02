let testLine;
let points = [
  { a: [100, 100], b: [300, 100] },
  { a: [200, 200], b: [250, 350] },
  { a: [400, 100], b: [100, 300] }
];
let currentIndex = 0;
let switchFrame = 0;
let interval = 1; // switch every 90 frames (1.5 seconds at 60fps)

function setup() {
  new Canvas(600, 400);
  world.gravity.y = 0;

  testLine = new Sprite(0, 0, [100, 0], 'static');
  testLine.stroke = 'red';
  testLine.strokeWeight = 10;
}

function draw() {
  background(240);

  if (frameCount - switchFrame > interval) {
    currentIndex = (currentIndex + 1) % points.length;
    let { a, b } = points[currentIndex];

    let midX = (a[0] + b[0]) / 2;
    let midY = (a[1] + b[1]) / 2;
    let len = dist(a[0], a[1], b[0], b[1]);
    let angle = atan2(b[1] - a[1], b[0] - a[0]);

    testLine.pos.x = midX;
    testLine.pos.y = midY;
    testLine.rotation = degrees(angle);
    testLine.w = len;

    switchFrame = frameCount;
  }
}

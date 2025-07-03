let angle1 = 0;
let angle2 = 0;
let zPos = 0;
let dir = 1;

function setup() {
  createCanvas(600, 400, WEBGL);
}

function draw() {
  background(200);

  // First box rotation
  push();
  translate(-100, 0, zPos); // move along z-axis
  rotateY(angle1);
  box(50);
  pop();

  // Second box rotation
  push();
  translate(100, 0, 0);
  rotateX(angle2);
  box(50);
  pop();

  angle1 += 2;
  angle2 += 2;

  // Animate z-position
  zPos += dir * 2;
  if (zPos > 200 || zPos < -200) dir *= -1; // bounce in and out

}

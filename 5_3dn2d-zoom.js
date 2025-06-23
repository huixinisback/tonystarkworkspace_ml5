let g3D;
let player;
let zoomZ = 400; // distance from the box (higher = farther)
let rotX = 0;
let rotY = 0;
let rotVelX = 0;
let rotVelY = 0;
let threshold = 5;


function setup() {
  createCanvas(800, 600); // p5play needs 2D canvas
  new Canvas(800, 600);   // p5play's Canvas wrapper

  world.gravity.y = 10;

  // Sprites
  player = new Sprite(400, 100, 50, 50, 'dynamic');
  player2 = new Sprite(400,100,50,50,'none');
  // Create 3D graphics buffer
  g3D = createGraphics(800, 600, WEBGL);
}

function draw() {
  clear(); // clear p5play world
  background(240);
  let debugVal = "player.dist(player.x, player.y, player2.x, player2.y):" + dist(player.x, player.y, player2.x, player2.y);
  text(debugVal, 300,30);
 // --- 3. 2D SPRITE TRACKING MOUSE ---
  player.moveTowards(mouse, 0.2); // smooth tracking

    // Handle zoom with keys
  if (dist(player.x, player.y, player2.x, player2.y)> 150) zoomZ -= 5;
  if (dist(player.x, player.y, player2.x, player2.y)<100) zoomZ += 5;

  // Clamp zoom so it doesn't flip or get too close
  zoomZ = constrain(zoomZ, 100, 1000);

  // Custom camera with zoom
  g3D.camera(0,300, zoomZ, 0, 0, 0, 0, 1, 0); // eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ
  
  //  Draw 3D scene into g3D
  g3D.push();
  g3D.clear();
  g3D.background(0, 0);
  // Apply impulse if velocity exceeds threshold
  if (abs(player.vel.x) > threshold) {
    rotVelY = player.vel.x * 0.08;
  }
  if (abs(player.vel.y) > threshold) {
    rotVelX = player.vel.y * 0.08;
  }

  // Apply damping (easing)
  rotVelX *= 0.9;
  rotVelY *= 0.9;

  // Accumulate rotation
  rotX += rotVelX;
  rotY += rotVelY;

  // Apply to g3D
  g3D.rotateX(rotX);
  g3D.rotateY(rotY);

  g3D.fill(100, 200, 255);
  g3D.box(150);
  g3D.pop();

  // 3Draw 3D canvas as an image (will be behind sprites)
  image(g3D, 0, 0);

  


}

let handPose;
let video;
let hands = [];

let pinchCircle;

let baseAngle = 0;

let handPresent = false;
function preload() {
  handPose = ml5.handPose();
}

function setup() {
  new Canvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose.detectStart(video, gotHands);

  // Create circle sprite
  pinchCircle = new Sprite(320, 240, 50);
  pinchCircle.collider = 'none';
  pinchCircle.color = 'green';
  pinchCircle.stroke = 'black';
  pinchCircle.strokeWeight = 2;
  pinchCircle.visible = false; // initially hidden
}

function draw() {
  clear();
  image(video, 0, 0, width, height);

  if (hands.length > 0) {
    let finger = hands[0].index_finger_tip;
    let thumb = hands[0].thumb_tip;

    let dx = finger.x - thumb.x;
    let dy = finger.y - thumb.y;
    let centerX = (finger.x + thumb.x) / 2;
    let centerY = (finger.y + thumb.y) / 2;
    let pinch = dist(finger.x, finger.y, thumb.x, thumb.y);
    let currentAngle = atan2(dy, dx);

    // New hand appeared
    if (!handPresent) {
      baseAngle = currentAngle;
      handPresent = true;
    }

    let relativeAngle = currentAngle - baseAngle;

    // Update sprite
    pinchCircle.visible = true;
    pinchCircle.pos.set(centerX, centerY);
    pinchCircle.d = pinch;

    // Calculate and apply rotation
    //let angleDeg = atan2(dy, dx); // rotation in degrees
    pinchCircle.rotation = relativeAngle;

    // Show angle on screen
    noStroke();
    fill(0);
    textSize(18);
    textAlign(LEFT, TOP);
    text('Rotation: ' + nf(relativeAngle, 1, 2) + '°', 10, 10);
  } else {
    pinchCircle.visible = false;
    handPresent = false; // reset state so next appearance is "new"
  }
}

function gotHands(results) {
  hands = results;
}

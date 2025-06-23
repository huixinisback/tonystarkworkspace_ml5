let g3D;
let player;
let zoomZ = 400; // distance from the box (higher = farther)
let rotX = 0;
let rotY = 0;
let rotVelX = 0;
let rotVelY = 0;
let threshold = 5;
let handPose;
let video;
let shape;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
// Create options for model settings
let options = {
  maxHands: 1,
  flipped: true,
  runtime: "tfjs",
  modelType: "full",
  detectorModelUrl: undefined, //default to use the tf.hub model
  landmarkModelUrl: undefined, //default to use the tf.hub model
}

 // Create constraints for video settings
  let constraints = {
    video: {
      mandatory: {
        minWidth: 1280,
        minHeight: 720
      },
      optional: [{ minFrameRate: 50 }]
    },
    audio: false,
    flipped:true,
  };

let playerSprites = [] // to store player sprites that will be used for detection

function preload() {
  handPose = ml5.handPose(options); // using the hand pose models with settings
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  fingerPoints = new Group();
  fingerPoints.color = 'rgba(255, 255, 255, 0.50)';
  fingerPoints.strokeWeight = 0;
  createdSprites = new Group();
  
  for(i = 0; i < 1; i++){
    // Create Sprites
    let thumb = new fingerPoints.Sprite(-20,0, 200, 200, 'none');
    let index = new fingerPoints.Sprite(-20,0,40, 'none');
    let middle = new fingerPoints.Sprite(-20,0,100,50, 'dynamic'); 
    middle.gravityScale = 0;
    let fingers = [thumb, index, middle];
    playerSprites.push(fingers);
  }

  // Instruction
  let instructionSprite = new Sprite(width/2, 30, 50, 50, 'none');
  instructionSprite.color = 'rgba(0,0,0,0)';
  instructionSprite.strokeWeight = 0;
  instructionSprite.text = 'Keep your hand in view to start, sit about 1 metre away for best control.'
  instructionSprite.textSize = 45;
  // Create the video and hide it
  video = createCapture(constraints);
  video.size(width,height);
  video.hide();

  // Start detecting hands from the webcam video
  handPose.detectStart(video, gotHands); 
  world.gravity.y = 10;

  // Create 3D graphics buffer
  g3D = createGraphics(windowWidth, windowHeight, WEBGL); 
}

function draw() {
  clear(); // clear p5play world
  background(240);


  push();
  tint(255, 127); // R,G,B,A — 127 = 50% opacity
  image(video, 0, 0, width, width * video.height / video.width);
  //background(0);
  pop();
  
  for (let i = 0; i < 1; i++) {
    let hand = hands[i];
    let player = playerSprites[i];
    drawKeyPoints(hand, player);
  }

}

// Callback function for when handPose outputs data
function gotHands(results) {
  // Save the output to the hands variable
  hands = results;
}

function drawKeyPoints(hand, player){
  if (hand){
      if(hand.keypoints[4] && hand.keypoints[8] && hand.keypoints[12]){
        let thumb = hand.keypoints[4];
        let thumbSprite = player[0];
        thumbSprite.x = lerp(thumbSprite.x, thumb.x, 0.3);
        thumbSprite.y = lerp(thumbSprite.y, thumb.y, 0.3);

        let index = hand.keypoints[8];
        let indexSprite = player[1];
        indexSprite.x = lerp(indexSprite.x,index.x, 0.3);
        indexSprite.y = lerp(indexSprite.y, index.y, 0.3);

        let middle = hand.keypoints[12];
        let middleSprite = player[2];
        middleSprite.moveTowards(middle.x, middle.y, 0.2)

        sphereControl(thumbSprite,indexSprite,middleSprite);
      }

  }else{
    let thumbSprite = player[0];
    thumbSprite.x = 0;
    thumbSprite.y = 0;
    let indexSprite = player[1];
    indexSprite.x = 0;
    indexSprite.y = 0;
    let middleSprite = player[2];
    middleSprite.x = 0;
    middleSprite.y = 0;
  }
}

function sphereControl(finger1,finger2,finger3){
  if(finger1.overlapping(finger2)){
    // Handle zoom with keys
    if (dist(finger1.x, finger1.y, finger2.x, finger2.y)> 25) zoomZ -= 5;
    if (dist(finger1.x, finger1.y, finger2.x, finger2.y)< 75) zoomZ += 5;
  }

  // Clamp zoom so it doesn't flip or get too close
  zoomZ = constrain(zoomZ, 100, 1000);

  // Custom camera with zoom
  g3D.camera(0,300, zoomZ, 0, 0, 0, 0, 1, 0); // eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ
  
  //  Draw 3D scene into g3D
  g3D.push();
  g3D.clear();
  g3D.background(0, 0);

  if(finger2.overlapping(finger3)){
    // Apply impulse if velocity exceeds threshold
    if (abs(finger3.vel.x) > threshold) {
      rotVelY = finger3.vel.x * 0.08;
    }
    if (abs(finger3.vel.y) > threshold) {
      rotVelX = finger3.vel.y * 0.08;
    }
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
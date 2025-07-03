let handPose;
let video;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
// Create options for model settings
let options = {
  maxHands: 2,
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

let connectIndices = [0,1,2,3,4,5,6,7,8,12,16,20,19,18,17,0]; // create bounding border for hand collision

let ball, floor;

function preload() {
  handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup() {
  new Canvas(windowWidth,windowHeight);
  //createCanvas(windowWidth, windowHeight, WEBGL);
  world.gravity.y = 10;
  // create bouncy ball
  ball = new Sprite(width/2,30,50, 'dynamic');
  ball.bounciness = 0.9;   // High bounce (0 to 1)
  ball.friction = 0.01;    // Low friction so it doesn't stick
  ball.mass = 1;           // Medium mass, adjusts response to gravity
  ball.drag = 0.01;        // Small air resistance

  floor = new Sprite(width/2, height -30, width, height * 0.1, 'static'); 
  // Create the video and hide it
  video = createCapture(constraints);
  video.size(width,height);
  video.hide();

  // Start detecting hands from the webcam video
  handPose.detectStart(video, gotHands); 
    
}


// Callback function for when handPose outputs data
function gotHands(results) {
  // Save the output to the hands variable
  hands = results;
}


function draw() {
  clear();
  //translate(-width / 2, -height / 2);
  push();
  tint(255, 127); // R,G,B,A — 127 = 50% opacity
  image(video, 0, 0, width, width * video.height / video.width);
  pop();

  drawBoundingLines();
  drawKeyPoints();
}


function drawKeyPoints(){
  push();
  // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
    let keypoint = hand.keypoints[j];
    fill(0, 255, 0);
    noStroke();
    circle(keypoint.x, keypoint.y, 10);
    }
  }
  pop();
}
// draws lines between each point (manually)
function drawBoundingLines() {
  for (let hand of hands) {
    //if (!hand.keypoints || hand.keypoints.length < 21) continue;

    for (let i = 0; i < connectIndices.length - 1; i++) {
      let a = connectIndices[i];
      let b = connectIndices[i + 1];

      let p1 = hand.keypoints[a];
      let p2 = hand.keypoints[b];
      console.log("p1: ", p1,", p2:", p2);

      if (!p1 || !p2 ) continue;

      let x1 = p1.x;
      let y1 = p1.y;
      let x2 = p2.x;
      let y2 = p2.y;

      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2;
      let len = dist(x1, y1, x2, y2);
      let angle = atan2(y2 - y1, x2 - x1);
      //console.log("x1: ",x1,",x2: ",x2,"y1: ", y1,", y2: ",y2);
      //console.log(atan2(y2 - y1, x2 - x1));
      //console.log(degrees(atan2(y2 - y1, x2 - x1)))
      let edge = new Sprite(midX, midY, [len, angle], 'static');
      edge.collider = 'static';
      edge.stroke = 'cyan';
      edge.strokeWeight = 3 ;
      edge.life = 5;
      edge.debug = true;
      //console.log("len: ",len,", angle:", angle,", edge: ",edge);
    }
  }
}
// draws lines between each point (using p5play polygon)
function drawBoundingBox() {
  for (let hand of hands) {
    let polyPoints = [];

    for (let i = 0; i < connectIndices.length; i++) {
      let idx = connectIndices[i];
      let kp = hand.keypoints[idx];
      if (kp) {
        polyPoints.push([kp.x, kp.y]);
      }
    }

    if (polyPoints.length >= 3) {
      let poly = new Sprite(polyPoints, 'static');
      poly.stroke = 'purple';
      poly.strokeWeight = 2;
      poly.color = 'purple';
      poly.opacity = 20;
      poly.life = 5;
    }
  }
}

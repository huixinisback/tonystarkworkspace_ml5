let handPose;
let video;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
// Create options for model settings
let options = {
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

function preload() {
  handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup() {
  new Canvas(windowWidth,windowHeight);
  //createCanvas(windowWidth, windowHeight, WEBGL);
  world.gravity.y = 10;
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

  drawMeshHand();
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

function drawMeshHand() {
	for(let hand of hands){
		let connections = [
			[0, 1], [1, 2], [2, 3], [3, 4],     // thumb
			[5, 6], [6, 7], [7, 8],             // index
			[9, 10], [10, 11], [11, 12],        // middle
			[13, 14], [14, 15], [15, 16],       // ring
			[17, 18], [18, 19], [19, 20],       // pinky
			[5, 9], [9, 13], [13, 17], [17, 0], [2, 5] // palm outline
		];

		for (let [a, b] of connections) {
			let p1 = hand.keypoints[a];
			let p2 = hand.keypoints[b];
			if (!p1 || !p2) continue;

			let x1 = p1.x;
			let y1 = p1.y;
			let x2 = p2.x;
			let y2 = p2.y;

			let midX = (x1 + x2) / 2;
			let midY = (y1 + y2) / 2;
			let len = dist(x1, y1, x2, y2);
			let angle = atan2(y2 - y1, x2 - x1);

			// Estimate stroke size based on hand size for VISUALS only
			let wrist = hand.keypoints[0];      // wrist
			let middleTip = hand.keypoints[12]; // middle fingertip
			let handSize = dist(wrist.x, wrist.y, middleTip.x, middleTip.y);
			let thickness = map(handSize, 80, 300, 2, 25); // adjust range to your camera


			let edge = new Sprite(midX, midY, [len, angle], 'static');
			edge.stroke = 'rgba(252, 218, 115, 0.8)';
			edge.strokeWeight = thickness;
			edge.life = 5;
		}

		drawPalmFill(hand);
	}
}

function drawPalmFill(hand) {
  // Use a loop of keypoints that form the palm
  let palmIndices = [0, 1, 2, 5, 9, 13, 17, 0];
  let palmPoints = [];

  for (let i of palmIndices) {
    let kp = hand.keypoints[i];
    if (kp) palmPoints.push([kp.x, kp.y]);
  }

  if (palmPoints.length >= 3) {
    let palm = new Sprite(palmPoints, 'static');
    palm.color =  'rgba(252, 218, 115, 0.8)';
    palm.stroke = 'rgba(0,0,0,0)';
    palm.life = 5;
  }
}

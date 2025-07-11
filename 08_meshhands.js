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

let handEdgePool = [];
const MAX_HAND_EDGES = 30; // should cover one or two hands

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

	for (let i = 0; i < MAX_HAND_EDGES; i++) {
  let edge = new Sprite(0, 0, [10, 0], 'static'); // dummy
  edge.color = 'transparent';
  edge.stroke = 'rgba(252, 218, 115, 0.8)';
  edge.strokeWeight = 2;
  edge.debug = false;
  edge.visible = false;
  handEdgePool.push(edge);
}
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

  drawMeshHand_v3();
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

function drawHandPolyMesh() {
  // Define your custom mesh path by keypoint indices
  let indices = [12, 17, 0, 2, 5, 12];
		let polyPoints = [];
		for(let hand of hands){

		for (let i of indices) {
			let kp = hand.keypoints[i];
			if (kp) polyPoints.push([kp.x, kp.y]);
		}

		// Only create if at least 3 valid points
		if (polyPoints.length >= 3) {
			let meshPoly = new Sprite(polyPoints, 'static');
			meshPoly.color = 'rgba(252, 218, 115, 0.2)';
			meshPoly.stroke = 'rgba(252, 218, 115, 0.8)';
			meshPoly.strokeWeight = 2;
			meshPoly.life = 5;
			meshPoly.debug = false;
		}
	}
}

function drawMeshHand_v2() {
  let edgeIndex = 0;

  for (let hand of hands) {
    let connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],     // thumb
      [5, 6], [6, 7], [7, 8],             // index
      [9, 10], [10, 11], [11, 12],        // middle
      [13, 14], [14, 15], [15, 16],       // ring
      [17, 18], [18, 19], [19, 20],       // pinky
      [5, 9], [9, 13], [13, 17], [17, 0], [2, 5] // palm
    ];

    let wrist = hand.keypoints[0];
    let middleTip = hand.keypoints[12];
    let handSize = dist(wrist.x, wrist.y, middleTip.x, middleTip.y);
    let thickness = map(handSize, 80, 300, 2, 25);

    for (let [a, b] of connections) {
      if (edgeIndex >= handEdgePool.length) break;

      let p1 = hand.keypoints[a];
      let p2 = hand.keypoints[b];
      let midX = (p1.x + p2.x) / 2;
      let midY = (p1.y + p2.y) / 2;
      let len = dist(p1.x, p1.y, p2.x, p2.y);
      let angle = atan2(p2.y - p1.y, p2.x - p1.x);

      let edge = handEdgePool[edgeIndex];
      edge.pos.x = lerp(midX,edge.pos.x,0.1);
      edge.pos.y = lerp(midY,edge.pos.y, 0.1);
      edge.rotation = angle;
      edge.w = len;
      edge.visible = true;
      edgeIndex++;
    }
  }

}

let handEdgePools = []; // array of arrays: one pool per hand
const EDGES_PER_HAND = 21; // safe default for full mesh


function drawMeshHand_v3() {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [5, 6], [6, 7], [7, 8],
    [9, 10], [10, 11], [11, 12],
    [13, 14], [14, 15], [15, 16],
    [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17], [17, 0]
  ];

  for (let h = 0; h < hands.length; h++) {
    let hand = hands[h];

    // Ensure pool exists
    if (!handEdgePools[h]) {
      handEdgePools[h] = [];
    }

    let pool = handEdgePools[h];

    // Ensure enough edges in pool
    while (pool.length < connections.length) {
      let edge = new Sprite(0, 0, [10, 0], 'static');
      edge.color = 'transparent';
      edge.stroke = 'rgba(252, 218, 115, 0.8)';
      edge.strokeWeight = 2;
      edge.debug = false;
      edge.visible = false;
      pool.push(edge);
    }

    // Update active edges
    let wrist = hand.keypoints[0];
    let mid = hand.keypoints[12];
    let handSize = dist(wrist.x, wrist.y, mid.x, mid.y);
    let thickness = map(handSize, 80, 300, 2, 25);

    for (let i = 0; i < connections.length; i++) {
      let [a, b] = connections[i];
      let p1 = hand.keypoints[a];
      let p2 = hand.keypoints[b];
      let edge = pool[i];

      let midX = (p1.x + p2.x) / 2;
      let midY = (p1.y + p2.y) / 2;
      let len = dist(p1.x, p1.y, p2.x, p2.y);
      let angle = atan2(p2.y - p1.y, p2.x - p1.x);

      edge.pos.x = lerp(midX,edge.pos.x,0.1);
      edge.pos.y = lerp(midY,edge.pos.y, 0.1);
      edge.rotation = angle;
      edge.w = len;
			edge.strokeWeight = 50;
      edge.visible = true;
    }

    // Hide unused (if pool longer than needed)
    for (let i = connections.length; i < pool.length; i++) {
      pool[i].visible = false;
    }
  }

  // Hide unused hand pools (e.g., if only 1 hand now)
  for (let h = hands.length; h < handEdgePools.length; h++) {
    for (let edge of handEdgePools[h]) {
      edge.visible = false;
    }
  }
}


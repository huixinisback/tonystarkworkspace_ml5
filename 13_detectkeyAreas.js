let video;
let bodyPose;
let poses = [];
let connections;

function preload() {
  // Load the MoveNet model
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(640, 480);

  // Setup webcam
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Start detecting poses from webcam feed
  bodyPose.detectStart(video, gotPoses);

  // Get built-in skeleton connection pairs
  connections = bodyPose.getConnections();
}

function draw() {
  image(video, 0, 0, width, height);

  // Draw keypoints
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    let kp = pose.keypoints;

    let saber1up = kp[10];  // left heel
    let saber1down = kp[8]; // left knee
    let saber2up = kp[9];  // right heel
    let saber2down = kp[7]; // right knee

    stroke(0, 255, 255); // cyan
    strokeWeight(4);

    if (saber1up && saber1down && saber1up.confidence > 0.1 && saber1down.confidence > 0.1) {
        line(saber1up.x, saber1up.y, saber1down.x, saber1down.y);
    }

    if (saber2up && saber2down && saber2up.confidence > 0.1 && saber2down.confidence > 0.1) {
        line(saber2up.x, saber2up.y, saber2down.x, saber2down.y);
    }

    // for (let j = 0; j < pose.keypoints.length; j++) {
    //   let keypoint = pose.keypoints[j];
    //   if (keypoint.confidence > 0.1) {
    //     fill(0, 255, 0);
    //     noStroke();
    //     circle(keypoint.x, keypoint.y, 10);
    //   }
    // }
  }
}

// Callback to store the results
function gotPoses(results) {
  poses = results;
}

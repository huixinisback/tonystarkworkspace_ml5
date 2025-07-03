let video;
let bodyPose;
let poses = [];
let connections;

let saber1, saber2;

function preload() {
  bodyPose = ml5.bodyPose();
}

function setup() {
  new Canvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  bodyPose.detectStart(video, gotPoses);

  // Create chain placeholders
  saber1 = new Sprite([[0, 0], [0, 0]], 'static');
  saber1.stroke = 'white';
  saber1.strokeWeight = 4;

  saber2 = new Sprite([[0, 0], [0, 0]], 'static');
  saber2.stroke = 'white';
  saber2.strokeWeight = 4;
}

function draw() {
  image(video, 0, 0, width, height);

  if (poses.length > 0) {
    let kp = poses[0].keypoints;

    // Get points
    let s1up = kp[10]; // left wrist
    let s1down = kp[8]; // left elbow
    let s2up = kp[9];  // right wrist
    let s2down = kp[7]; // right elbow

    // Update saber1 chain if confident
    if (s1up.confidence > 0.1 && s1down.confidence > 0.1) {
      saber1.vertices = [
        [s1up.x, s1up.y],
        [s1down.x, s1down.y]
      ];
    }

    // Update saber2 chain if confident
    if (s2up.confidence > 0.1 && s2down.confidence > 0.1) {
      saber2.vertices = [
        [s2up.x, s2up.y],
        [s2down.x, s2down.y]
      ];
    }
  }
}

// Pose callback
function gotPoses(results) {
  poses = results;
}

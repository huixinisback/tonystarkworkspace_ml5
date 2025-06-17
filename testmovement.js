let handPose;
let video;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
let options = {
  maxHands: 1,
  flipped: false,
  runtime: "tfjs",
  modelType: "full",
  detectorModelUrl: undefined, //default to use the tf.hub model
  landmarkModelUrl: undefined, //default to use the tf.hub model
}


function preload() {
    handPose = ml5.handPose(options);
}

function setup() {
    createCanvas(640, 480);
    // Create the video and hide it
    video = createCapture(VIDEO);
    video.size(640, 480);
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
    image(video, 0, 0, width, height);
    // Draw all the tracked hand points
    for (let i = 0; i < hands.length; i++) {
        
        let hand = hands[i];
        for (let j = 0; j < hand.keypoints.length; j++) {
            if(j == 4){
                let thumb = hand.keypoints[j];
                fill(0, 255, 0);
                noStroke();
                circle(thumb.x, thumb.y, 10);
            }

            if(j == 4 || j == 8 ){
                let index = hand.keypoints[j];
                fill(0, 255, 0);
                noStroke();
                circle(index.x, index.y, 10);
            }

            // Original Code: Shows all the keypoints on the hands
            // let keypoint = hand.keypoints[j];
            // fill(0, 255, 0);
            // noStroke();
            // circle(keypoint.x, keypoint.y, 10);
            
        }
    }
}


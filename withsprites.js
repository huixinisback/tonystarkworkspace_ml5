let handPose;
let video;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
let options = {
  maxHands: 2,
  flipped: true,
  runtime: "tfjs",
  modelType: "full",
  detectorModelUrl: undefined, //default to use the tf.hub model
  landmarkModelUrl: undefined, //default to use the tf.hub model
}

let playerSprites = [] // to store player sprites that will be used for detection


function preload() {
    handPose = ml5.handPose(options);
}

function setup() {
    createCanvas(640, 480);
    fingerPoints = new Group();
    fingerPoints.color = 'rgba(255, 255, 255, 0.50)';
    fingerPoints.strokeWeight = 0;
    fingerPoints.collider = 'none';
    

    // Create Sprites
    for(i = 0; i < 2; i++){
        let thumb = new fingerPoints.Sprite(-20,0,20);
        let index = new fingerPoints.Sprite(-20,0,20);
        let lowerthumb = new fingerPoints.Sprite(-20,0,20);
        let fingers = [thumb, index, lowerthumb];
        playerSprites.push(fingers);
    }
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
    clear();
    push();
    tint(255, 127); // R,G,B,A — 127 = 50% opacity
    //Flip the video for a mirroring effect
    translate(width, 0); // Move origin to right edge
    scale(-1, 1);        // Flip horizontally
    image(video, 0, 0, width, height);
    pop();
    for (let i = 0; i < 2; i++) {
        let hand = hands[i];
        let player = playerSprites[i];
        if (hand){
            if(hand.keypoints[4]){
                let thumb = hand.keypoints[4];
                let thumbSprite = player[0];
                thumbSprite.x = lerp(thumbSprite.x, thumb.x, 0.3);
                thumbSprite.y = lerp(thumbSprite.y, thumb.y,0.3);
            }

            if(hand.keypoints[8]){
                let index = hand.keypoints[8];
                let indexSprite = player[1];
                indexSprite.x = lerp(indexSprite.x,index.x, 0.3);
                indexSprite.y = lerp(indexSprite.y, index.y, 0.3);
            }

            if(hand.keypoints[3]){
                let lowerthumb = hand.keypoints[3];
                let lowerthumbSprite = player[2];
                lowerthumbSprite.x = lerp(lowerthumbSprite.x, lowerthumb.x, 0.3);
                lowerthumbSprite.y = lerp(lowerthumbSprite.y, lowerthumb.y, 0.3);
            }

        }else{
            let thumbSprite = player[0];
            thumbSprite.x = 0;
            thumbSprite.y = 0;
            let indexSprite = player[1];
            indexSprite.x = 0;
            indexSprite.y = 0;
            let lowerthumbSprite = player[2];
            lowerthumbSprite.x = 0;
            lowerthumbSprite.y = 0;
        }
    }
    
}


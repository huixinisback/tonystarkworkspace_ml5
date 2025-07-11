let handPose;
let video;
let shape;
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

let playerSprites = [] // to store player sprites that will be used for detection

function preload() {
    handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    fingerPoints = new Group();
    fingerPoints.color = 'rgba(255, 255, 255, 0.50)';
    fingerPoints.diameter = 40;
    fingerPoints.strokeWeight = 0;
    fingerPoints.collider = 'none';

    createdSprites = new Group();
    

    for(i = 0; i < 2; i++){
        // Create Sprites
        let thumb = new fingerPoints.Sprite(-20,0);
        let index = new fingerPoints.Sprite(-20,0);
        let middle = new fingerPoints.Sprite(-20,0);
        let fingers = [thumb, index, middle];
        playerSprites.push(fingers);
    }

    // Create the video and hide it
    video = createCapture(constraints);
    video.size(width,height);
    video.hide();

    // Start detecting hands from the webcam video
    handPose.detectStart(video, gotHands); 

    // Create the p5.Geometry object.
    shape = buildGeometry(createShape);
    
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
    image(video, 0, 0, width, width * video.height / video.width);
    //background(0);
    pop();
    
    for (let i = 0; i < 2; i++) {
        let hand = hands[i];
        let player = playerSprites[i];
        drawKeyPoints(hand, player);
    }

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
            middleSprite.x = lerp(middleSprite.x, middle.x, 0.3);
            middleSprite.y = lerp(middleSprite.y, middle.y, 0.3);

            // functionality of sprites
            if(middleSprite.overlaps(indexSprite)){
                new createdSprites.Sprite(indexSprite.x,indexSprite.y);
                // start timer for how long visual effects will show
                createVisualTimer++;
            }

            if(thumbSprite.overlaps(createdSprites)){
                for(let singleSprite of createdSprites){
                    if(thumbSprite.overlaps(singleSprite)){
                        selectedSprite = singleSprite;
                        break;
                    }
                }
            }

            if(thumbSprite.overlapping(middleSprite) && selectedSprite){
                middleSprite.color ='rgb(59, 229, 255)';
                middleSprite.text ='moving!';
                selectedSprite.x = lerp(selectedSprite.x,middleSprite.x,0.4);
                selectedSprite.y = lerp(selectedSprite.y,middleSprite.y,0.4);
            } else if (thumbSprite.overlapped(middleSprite) && selectedSprite){
                movePauseFrameCount = frameCount + 60;
                selectedSprite = null;
            } else if(!thumbSprite.overlapping(middleSprite) && selectedSprite && movePauseFrameCount<=frameCount){
                middleSprite.color = 'rgba(255, 255, 255, 0.50)';
                middleSprite.text = '';
                selectedSprite.remove();
                selectedSprite = null;
                //  start timer for how long visual effects will show
                deleteVisualTimer++;
            } else{
                movePauseFrameCount = frameCount + 1
            }

           
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



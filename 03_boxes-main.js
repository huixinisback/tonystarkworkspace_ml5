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

let playerSprites = [] // to store player sprites that will be used for detection
let playerData = [] // to store player specific data

function preload() {
    handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup() {
    new Canvas();
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
        let createVisualTimer = 0;
        let deleteVisualTimer = 0;
        let movePauseFrameCount = 0;
        let selectedSprite = null;
        let info = [createVisualTimer,deleteVisualTimer, movePauseFrameCount, selectedSprite]
        playerData.push(info);
    }

    // Instruction
    let instructionSprite = new Sprite(width/2, 30, 50, 50, 'none');
    instructionSprite.color = 'rgba(0,0,0,0)';
    instructionSprite.strokeWeight = 0;
    instructionSprite.text = 'create - index and middle; delete - thumb & middle; move - thumb and index';
    instructionSprite.textSize = 45;
    
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
    push();
    tint(255, 127); // R,G,B,A — 127 = 50% opacity
    image(video, 0, 0, width, width * video.height / video.width);
    //background(0);
    pop();
    
    for (let i = 0; i < 2; i++) {
        let hand = hands[i];
        let player = playerSprites[i];
        let playerDatum = playerData[i]
        drawKeyPoints(hand, player, playerDatum);
    }

}

function drawKeyPoints(hand, player, playerDatum){
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

            let createVisualTimer = playerDatum[0];
            let deleteVisualTimer = playerDatum[1];
            let movePauseFrameCount = playerDatum[2];
            let selectedSprite = playerDatum[3];

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

            if(thumbSprite.overlapping(indexSprite) && selectedSprite){
                indexSprite.color ='rgb(59, 229, 255)';
                indexSprite.text ='moving!';
                selectedSprite.x = lerp(selectedSprite.x,indexSprite.x,0.4);
                selectedSprite.y = lerp(selectedSprite.y,indexSprite.y,0.4);
            } else if (thumbSprite.overlapped(indexSprite) && selectedSprite){
                movePauseFrameCount = frameCount + 60;
                selectedSprite = null;
            } else if(thumbSprite.overlapping(middleSprite) && selectedSprite && movePauseFrameCount<=frameCount){
                indexSprite.color = 'rgba(255, 255, 255, 0.50)';
                indexSprite.text = '';
                selectedSprite.remove();
                selectedSprite = null;
                //  start timer for how long visual effects will show
                deleteVisualTimer++;
            } else{
                movePauseFrameCount = frameCount + 1
            }

            // visual cue for sprites
            if(createVisualTimer>0 && createVisualTimer<=60){
                indexSprite.color = 'rgba(0, 255, 76, 0.80)';
                indexSprite.text = 'create!';
                createVisualTimer++;
            }else{
                indexSprite.color = 'rgba(255, 255, 255, 0.50)';
                indexSprite.text = '';
                createVisualTimer = 0;
            }

            if(deleteVisualTimer>0 && deleteVisualTimer<=60){
                thumbSprite.color = 'rgba(255, 0, 0, 0.8)';
                thumbSprite.text = 'delete!'; 
                deleteVisualTimer++;
            }else{
                thumbSprite.color = 'rgba(255, 255, 255, 0.50)';
                thumbSprite.text = '';
                deleteVisualTimer = 0;
            }

            playerDatum[0]=createVisualTimer;
            playerDatum[1]=deleteVisualTimer;
            playerDatum[2]=movePauseFrameCount;
            playerDatum[3]=selectedSprite;
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



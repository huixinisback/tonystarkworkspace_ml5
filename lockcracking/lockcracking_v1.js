let dial, dialButton, hintSprite, infoIcon, infoSprite, infoImg, infoText;
let combo = [70, 40, 10]; // The 3-number combination
let input = [];
let direction = 1; // 1 = clockwise, -1 = counter-clockwise
let previousDirection = 1;
let previousNumber = 0;
let lastAngle = 0;
let cracked = false;
let dialStopped = false;
let inputDelay = 0;
let dialImg, dialButtonImg, infoBookImg, infoIconImg,infoAsciiImg;
let pause = false;
let unlockedCount = 0;
let hintCounter = 0;
let pageCounter = 0;
let rotated = 0;
// for handposes
let handPose;
let video;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
let player;
let playerSprites = [] // to store player sprites that will be used for detection
// hand mechanics for tracking
let baseAngles = []; // base angles per hand
let handDetected = []; // to track hand presence for each hand
// Store previous y positions for delta
let prevThumbY = [0, 0]; // per player
let prevIndexY = [0, 0];
let angleOffset = [0, 0];
let prevDialRotation = [0, 0];
let accumulatedAngle = [0, 0]; // track delta since last step


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


function preload() {
    dialImg = loadImage("assets/lockImg.png");
    infoBookImg = loadImage("assets/open-old-book.png");
    infoIconImg = loadImage("assets/helpbook.png");
    infoAsciiImg = loadImage("assets/ascii_table.jpg");
    dialButtonImg = loadImage("assets/dialbutton.png");
    handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup() {
    new Canvas("16:9");// aspect ratio - only in p5play
    // fingers
    fingerPoints = new Group();
    fingerPoints.color = 'rgba(255, 255, 255, 0.50)';
    fingerPoints.strokeWeight = 0;
    
    // Create the video and hide it
    video = createCapture(constraints);
    video.size(width,height);
    video.hide();

    // Start detecting hands from the webcam video
    handPose.detectStart(video, gotHands); 


    // game sprites
    dial = new Sprite(width / 2, height / 2, width*0.23, 'kinematic');
    dial.image = dialImg;
    dial.img.scale.x = dial.w / dial.img.width;
    dial.img.scale.y = dial.h / dial.img.height;
    dial.rotation = 0;
    dial.rotationLock = false; // allow rotation

    dialButton = new Sprite(width / 2, height / 2, width*0.11, 'kinematic'); // the knob to turn
    dialButton.image = dialButtonImg;
    dialButton.img.scale.x = dialButton.w / dialButton.img.width;
    dialButton.img.scale.y = dialButton.h / dialButton.img.height;
    dialButton.rotationLock = true; // dont allow rotation

    hintSprite = new Sprite(25/1280*width,25/720*height,50/1280*width,50/720*height,'none');
    infoSprite = new Sprite(width/2, height/2,width * 0.99, height * 0.99,'none');
    infoSprite.img = infoBookImg.get();
    infoSprite.img.scale.x = infoSprite.w / infoSprite.img.width;
    infoSprite.img.scale.y = infoSprite.h / infoSprite.img.height;
    infoImg = new Sprite(width*0.29,height/2,width*0.38,height * 0.86,'none');
    infoImg.img = infoAsciiImg;
    infoImg.img.scale.x = infoImg.w / infoImg.img.width;
    infoImg.img.scale.y = infoImg.h / infoImg.img.height;
    infoText = new Sprite(width * 0.74,height/2, width * 0.38 ,height * 0.86,'none');
    infoText.color ='rgba(0,0,0,0)';
    infoText.strokeWeight = 0;
    infoText.textSize = 18/720 * height;  
    textFont('Courier New');
    hintInfo();
    infoIcon = new Sprite(60/1280*width, height * 0.92, 100/1280*width, 100/720*height,'kinematic');
    infoIcon.img = infoIconImg;
    infoIcon.img.scale.x = infoIcon.w / infoIcon.img.width;
    infoIcon.img.scale.y = infoIcon.h / infoIcon.img.height;
    //hide everything
    infoSprite.visible = false;
    infoImg.visible = false;
    infoText.visible = false;

    // finger sprites
    for(i = 0; i < 1; i++){
        // Create Sprites
        let thumb = new fingerPoints.Sprite(-20,0,40/1280*width, 'none');
        let index = new fingerPoints.Sprite(-20,0,40/1280*width, 'none');
        let fingers = [thumb, index];
        playerSprites.push(fingers);
    }

    // 1 SET of finger control tracking
    baseAngles = [null, null];  // match playerSprites indices
    handDetected = [false, false];
    angleMode(DEGREES); 

}

function draw() {
    clear();
    push();
    tint(255, 127); // R,G,B,A — 127 = 50% opacity
    image(video, 0, 0, width, width * video.height / video.width);
    //background(0);
    pop();
    push();
    strokeWeight(10/1280*width);
    stroke("rgb(184, 14, 14)");
    line(width/2,height/2 - dial.d/2,width/2, height/2-dial.d/4*3);
    pop();
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        let player = playerSprites[i];
        drawKeyPoints(hand, player, i);
    }
    textSize(24/1280*width);
    textAlign(CENTER);
    if (frameCount%60 ==0){
        hints(combo);
    }

    if(infoIcon.mouse.presses('left')){
        if(infoIcon.img == infoIconImg){
            openBook();
        }else{
            closeBook();
        }   
    }
    
    if (!pause){
        // Rotate with left/right arrow keys
        if (kb.pressing('left')) dial.rotation -= 3.6;
        if (kb.pressing('right')) dial.rotation += 3.6;
    }
    
    // Track direction of rotation
    let delta = dial.rotation - lastAngle;

    // wrapping the digits based on angle changed
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    direction = delta > 0 ? 1 : delta < 0 ? -1 : direction;
    lastAngle = dial.rotation;

    // Calculate number on top of the dial (0° = top)
    let currentAngle = ((-dial.rotation % 360) + 360) % 360; // invert rotation direction
    let currentNumber = int(map(currentAngle, 0, 360, 0, 100)) % 100;
    let directionChanged = direction !== previousDirection && abs(delta) > 0.5; // at least changed value by 1

    console.log("dial.rotation: ",dial.rotation,", delta: ",delta, ", abs(delta): ", abs(delta), ", direction: ", direction);

    if (!cracked && inputDelay === 0 && direction !== 0 && directionChanged && input.length < 2) {
        console.log("printed input, direction: ", direction, ", previous direction: ",previousDirection);
        input.push(previousNumber);
        inputDelay = 30; // prevent accidental double inputs
    }

    // for the last number
    if (input.length === 2 && kb.presses('down')){
        input.push(previousNumber);
        validateCombo();
    } 

    if (inputDelay > 0) inputDelay--;

    previousDirection = direction;
    previousNumber = currentNumber;

    fill(0);
    text("Dial: " + nf(currentNumber, 2), width *0.5, height * 0.07);

    if (cracked) {
        fill("green");
        text("🔓 LOCK CRACKED!", width *0.5, height * 0.93); 
    }else{
        text("Input: " + input.join(" - "), width *0.5, height * 0.93);
    }

}

// Callback function for when handPose outputs data
function gotHands(results) {
  // Save the output to the hands variable
  hands = results;
}

function drawKeyPoints(hand, player, i){
    if (!hand) {
        handDetected[i] = false;
        return;
    }

    if (hand){
        if(hand.keypoints[4] && hand.keypoints[8]){
            let thumb = hand.keypoints[4];
            let thumbSprite = player[0];
            thumbSprite.x = lerp(thumbSprite.x, thumb.x, 0.7);
            thumbSprite.y = lerp(thumbSprite.y, thumb.y, 0.7);

            let index = hand.keypoints[8];
            let indexSprite = player[1];
            indexSprite.x = lerp(indexSprite.x,index.x, 0.7);
            indexSprite.y = lerp(indexSprite.y, index.y, 0.7);

            // Store previous Y
            let dyThumb = thumbSprite.y - prevThumbY[i];
            let dyIndex = indexSprite.y - prevIndexY[i];
            prevThumbY[i] = thumbSprite.y;
            prevIndexY[i] = indexSprite.y;

            // Check if both fingers are pinching the dial button and moving down
            if (thumbSprite.overlapping(dialButton) && indexSprite.overlapping(dialButton) && dyThumb > 10 && dyIndex > 10){
                if (input.length === 2) {
                    input.push(previousNumber);
                    validateCombo();
                }
            } else if (thumbSprite.overlapping(dialButton) && indexSprite.overlapping(dialButton)) {
                let dx = index.x - thumb.x;
                let dy = index.y - thumb.y;
                let angleBetween = atan2(dy, dx); // angle in degrees

                if (!handDetected[i]) {
                    baseAngles[i] = angleBetween;
                    handDetected[i] = true;
                    accumulatedAngle[i] = 0;
                }

                let deltaAngle = angleBetween - baseAngles[i];

                // Normalize across -180 to 180
                if (deltaAngle > 180) deltaAngle -= 360;
                if (deltaAngle < -180) deltaAngle += 360;

                accumulatedAngle[i] += deltaAngle;
                baseAngles[i] = angleBetween;

                // Every 3° of hand rotation, rotate dial by 1°
                while (accumulatedAngle[i] >= 3) {
                    dial.rotation += 1;
                    accumulatedAngle[i] -= 3;
                }
                while (accumulatedAngle[i] <= -3) {
                    dial.rotation -= 1;
                    accumulatedAngle[i] += 3;
                }
            } else {
                handDetected[i] = false;
            }


        }
    }else{
        let thumbSprite = player[0];
        thumbSprite.x = 0;
        thumbSprite.y = 0;
        let indexSprite = player[1];
        indexSprite.x = 0;
        indexSprite.y = 0;
    }
}

function validateCombo() {
    if (input[0] === combo[0] && input[1] === combo[1] && input[2] === combo[2]) {
        cracked = true;
        pause = true;
        
        shakeY(dial, 20, 2, 100).then(()=>{
            dial.rotateTo(1080, 5).then(() => {
                let one =  Math.round(Math.random() * 50 + 50);
                let two = Math.round(Math.random() * 50);
                let three = Math.round(Math.random() * one - two);
                combo = [one, two, three];
                pause = false;
                cracked = false;
                input = [];
                previousDirection = 1;
            }); // rotate - clearing animation
        }); // shake before rotating

        
        unlockedCount+=1;
    } else {
        pause = true;
        shakeY(dial, 20, 2, 100); // shake before rotating
        dial.rotateTo(1080, 2).then(() => {
            input = [];
            pause = false;
            previousDirection = 1;
        }); // rotate - clearing animation
    }
}

function hints(combo){
    let number = combo[hintCounter];
    if (number == combo[0]){
        hintSprite.color = 'rgb(255, 255, 255)';
        hintSprite.text = combo[0].toString();
    }else{
        let choice = Math.round(Math.random()*3);
        switch (choice) {
        case 0:
            hintSprite.color = 'rgb(255, 3, 3)';
            hintSprite.text = encodeAscii(number).toString();
            break;
        case 1:
            hintSprite.color = 'rgb(251, 255, 3)';
            hintSprite.text = multipliedBy2(number).toString();
            break;
        default:
            hintSprite.color = 'rgb(3, 167, 255)';
            hintSprite.text = encodePlus60(number).toString();
            break;
        }
    }

    if(hintCounter ==2){
        hintCounter = 0;
    }else{
        hintCounter+=1;
    }

}

function encodeAscii(number){
    if (number> 32){
        let character = String.fromCharCode(number);
        return character;
    }else{
        return encodePlus60(number);
    }
}

function encodePlus60(number){
    return (number+60);
}

function multipliedBy2(number){
    return (number*2);
}

function openBook(){
    bookOpen = true;
    infoIcon.img = infoBookImg.get();
    infoIcon.w *=1.25;
    infoIcon.h *=0.75;
    infoIcon.x = infoIcon.w/2 + 10;
    infoIcon.img.scale.x = infoIcon.w / infoIcon.img.width;
    infoIcon.img.scale.y = infoIcon.h / infoIcon.img.height;
    infoSprite.visible = true;
    infoImg.visible = true;
    infoText.visible = true;
}

function closeBook(){
    bookOpen = false;
    infoIcon.img = infoIconImg;
    infoIcon.w /=1.25;
    infoIcon.h /=0.75;
    infoIcon.x = infoIcon.w/2 + 10;
    infoIcon.img.scale.x = infoIcon.w / infoIcon.img.width;
    infoIcon.img.scale.y = infoIcon.h / infoIcon.img.height;
    infoSprite.visible = false;
    infoImg.visible = false;
    infoText.visible = false;
}


function hintInfo() {
    clear();
    let lines = [];
    lines.push("Code Cracker Guidebook".padEnd(50));
    lines.push("");
    lines.push("🔲 White background: ".padEnd(50));
    lines.push("Number is the first number in sequence.".padEnd(50));
    lines.push("🔷 Blue background: ".padEnd(50));
    lines.push("Number = correct number + 60".padEnd(50));
    lines.push("🟡 Yellow background: ".padEnd(50));
    lines.push("Number = correct number × 2".padEnd(50));
    lines.push("🔴 Red background: ".padEnd(50));
    lines.push("Symbol represents the correct number as an ASCII".padEnd(50));
    lines.push("character. ASCII reference on the left.".padEnd(50));
    lines.push("");
    lines.push("🌀 Rotation Rules:".padEnd(50));
    lines.push("1. Turn dial clockwise to the first number.".padEnd(50));
    lines.push("2. Turn dial anti-clockwise to the second number".padEnd(50));
    lines.push("which confirms the first number.".padEnd(50));
    lines.push("3. Turn dial clockwise to the third number".padEnd(50));
    lines.push("which confirms the second number.".padEnd(50));
    lines.push("4. Move dial down to confirm the third number".padEnd(50));
    lines.push("and unlock.".padEnd(50));
    lines.push("");
    lines.push("Make sure your fingers are on the knob to rotate.".padEnd(50));
    lines.push("Alternatively, use arrow keys.".padEnd(50));
    lines.push("");
    lines.push("Use the clues carefully to deduce the actual".padEnd(50));
    lines.push("combination!".padEnd(50));
    infoText.text = lines.join("\n");
}

// extra animation for the unlocking vibe
function shakeY(sprite, amplitude = 20, times = 2, speed = 100) {
    return new Promise((resolve) => {
        let count = 0;
        let originalY = sprite.y;
        let goingUp = true;

        const interval = setInterval(() => {
            if (goingUp) {
                sprite.y = originalY - amplitude;
            } else {
                sprite.y = originalY;
            }

            goingUp = !goingUp;
            count++;

            if (count >= times * 2) {
                sprite.y = originalY;
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}
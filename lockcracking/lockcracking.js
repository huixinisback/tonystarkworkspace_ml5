let dial, dialButton, hintSprite, infoIcon, infoSprite, infoImg, infoText;
let combo = [30, 70, 10]; // The 3-number combination
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
    createCanvas(windowWidth, windowHeight);
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
    dial = new Sprite(width / 2, height / 2, 300, 'kinematic');
    dial.image = dialImg;
    dial.img.scale.x = dial.w / dial.img.width;
    dial.img.scale.y = dial.h / dial.img.height;
    dial.rotation = 0;
    dial.rotationLock = false; // allow rotation

    dialButton = new Sprite(width / 2, height / 2, 150, 'kinematic');
    dialButton.image = dialButtonImg;
    dialButton.img.scale.x = dialButton.w / dialButton.img.width;
    dialButton.img.scale.y = dialButton.h / dialButton.img.height;
    dialButton.rotationLock = true; // dont allow rotation

    hintSprite = new Sprite(25,25,50,50,'none');
    infoSprite = new Sprite(width/2, height/2, width-10, height-10,'none');
    infoSprite.img = infoBookImg.get();
    infoSprite.img.scale.x = infoSprite.w / infoSprite.img.width;
    infoSprite.img.scale.y = infoSprite.h / infoSprite.img.height;
    infoImg = new Sprite(width/4+50,height/2,width/2-150,height-100,'none');
    infoImg.img = infoAsciiImg;
    infoImg.img.scale.x = infoImg.w / infoImg.img.width;
    infoImg.img.scale.y = infoImg.h / infoImg.img.height;
    infoText = new Sprite(width/4*3-30,height/2, width/2-150,height-100,'kinematic');
    infoText.color ='rgba(0,0,0,0)';
    infoText.strokeWeight = 0;
    infoText.textSize = 20;  
    textFont('Courier New');
    hintInfo();
    infoIcon = new Sprite(60, height-60, 100,100,'none');
    infoIcon.img = infoIconImg;
    infoIcon.img.scale.x = infoIcon.w / infoIcon.img.width;
    infoIcon.img.scale.y = infoIcon.h / infoIcon.img.height;
    infoIcon.overlaps(allSprites)
    //hide everything
    infoSprite.visible = false;
    infoImg.visible = false;
    infoText.visible = false;

    // finger sprites
    for(i = 0; i < 1; i++){
        // Create Sprites
        let thumb = new fingerPoints.Sprite(-20,0,40, 'none');
        let index = new fingerPoints.Sprite(-20,0,40, 'none');
        let fingers = [thumb, index];
        playerSprites.push(fingers);
    }

    // 1 SET of finger control tracking
    baseAngles = [null, null];  // match playerSprites indices
    handDetected = [false, false];

}

function draw() {
    clear();
    push();
    tint(255, 127); // R,G,B,A — 127 = 50% opacity
    image(video, 0, 0, width, width * video.height / video.width);
    //background(0);
    pop();
    
    if(hands.length>playerSprites.length){
        // Create Sprites
        let thumb = new fingerPoints.Sprite(-20,0,40, 'none');
        let index = new fingerPoints.Sprite(-20,0,40, 'none');
        let fingers = [thumb, index];
        playerSprites.push(fingers);
    }

    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        let player = playerSprites[i];
        drawKeyPoints(hand, player, i);
    }

    textAlign(CENTER);
    textSize(24);
    if (frameCount%60 ==0){
        hints(combo);
    }

    if(infoIcon.mouse.presses('left')){
        console.log("icon pressed")
        if(infoIcon.img == infoIconImg){
            openBook();
        }else{
            closeBook();
        }   
    }
    
    if (!pause){
        // Rotate with left/right arrow keys
        if (kb.pressing('left')) dial.rotation -= 18;
        if (kb.pressing('right')) dial.rotation += 18;
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
    
    // prevent too many turns
    if (direction === previousDirection){
        rotated+=delta;
    }

    if (abs(rotated)>720){
        rotated=0;
        validateCombo();
    }

    if (!cracked && inputDelay === 0 && direction !== 0 && direction !== previousDirection && input.length < 2) {
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
    text("Dial: " + nf(currentNumber, 2), width / 2, 50);

    if (cracked) {
        fill("green");
        text("🔓 LOCK CRACKED!", width / 2, height-50); 
    }else{
        text("Input: " + input.join(" - "), width / 2, height - 50);
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


            let dx = index.x - thumb.x;
            let dy = index.y - thumb.y;
            let currentAngle = atan2(dy, dx);

            // If new hand detected
            if (!handDetected[i]) {
                baseAngles[i] = currentAngle;
                handDetected[i] = true;
            }

            let relativeAngle = currentAngle - baseAngles[i];

            // Optional: Clamp or reset if angle jumps too much
            if (abs(relativeAngle) > PI) {
                relativeAngle = 0;
                baseAngles[i] = currentAngle;
            }
            if (thumbSprite.overlapping(dial) && indexSprite.overlapping(dial) && !thumbSprite.overlapping(dialButton) && !indexSprite.overlapping(dialButton)){
                // Simulate dial rotation
                if (!pause) {
                    dial.rotation += relativeAngle;  // scaled down for control
                }
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
            dial.rotateTo(1080, 2).then(() => {
                let one =  Math.round(Math.random() * 100);
                let two = Math.round(Math.random() * 100);
                let three = Math.round(Math.random() * 100);
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
    lines.push("");
    lines.push("🔷 Blue background: ".padEnd(50));
    lines.push("Number = correct number + 60".padEnd(50));
    lines.push("");
    lines.push("🟡 Yellow background: ".padEnd(50));
    lines.push("Number = correct number × 2".padEnd(50));
    lines.push("");
    lines.push("🔴 Red background: ".padEnd(50));
    lines.push("Symbol represents the correct number as an ASCII".padEnd(50));
    lines.push("character. ASCII reference on the left.".padEnd(50));
    lines.push("");
    lines.push("🌀 Rotation Rules:".padEnd(50));
    lines.push("1. Turn dial clockwise to the first number.".padEnd(50));
    lines.push("");
    lines.push("2. Turn dial anti-clockwise to the second number".padEnd(50));
    lines.push("which confirms the first number.".padEnd(50));
    lines.push("");
    lines.push("3. Turn dial clockwise to the third number".padEnd(50));
    lines.push("which confirms the second number.".padEnd(50));
    lines.push("");
    lines.push("4. Move dial down to confirm the third number".padEnd(50));
    lines.push("and unlock.".padEnd(50));

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


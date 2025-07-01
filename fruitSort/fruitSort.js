//ML hand setup variables
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
// Images
let appleImg, durianImg, orangeImg, appleBasketImg, orangeBasketImg, trashImg;
let fruitTypes, fruits, appleBasket,orangeBasket;

const defaultStats = {
    apples: 0,
    oranges: 0,
    durian: 0,
    correctApple: 0,
    correctOrange: 0,
    wrongDurian: 0,
    wastedFruits: 0
};

let stats = { ...defaultStats }; // clone

let startGame = false;
let endGame = false;
let startTime = 0;
let pauseTime = 0;
const GAME_DURATION_FRAMES = 900;
const PAUSE_DURATION_FRAMES = 720;
let selectedObjects = []; // 1 selected per hand

//ending stats
let receipt;

function preload(){
    appleImg = loadImage('assets/apple.png');
    durianImg = loadImage('assets/durian.png');
    orangeImg = loadImage('assets/orange.png');
    bg = loadImage('assets/woodenbg.jpg');
    fruitTypes = [appleImg,durianImg,orangeImg];
    appleBasketImg = loadImage('assets/applebasket.png');
    orangeBasketImg = loadImage('assets/orangebasket.png');
    trashImg = loadImage('assets/trashbin.png');
    receiptFont = loadFont("assets/Merchant Copy Doublesize.ttf"); //custom fonts, find free ones online
    handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup(){
    new Canvas();
    world.gravity = {x:0, y:2}
    fruits = new Group();
    fruits.collider = 'dynamic';


    basket = new Group();
    appleBasket = new basket.Sprite(width/2-400,height-150,220,200,'static');
    appleBasket.img = appleBasketImg;
    appleBasket.img.scale.x = appleBasket.w / appleBasket.img.width;
    appleBasket.img.scale.y = appleBasket.h / appleBasket.img.height;
    appleBasket.totalNo = 0;
    orangeBasket = new basket.Sprite(width/2+400,height-150,220,200,'static');
    orangeBasket.img = orangeBasketImg;
    orangeBasket.img.scale.x = orangeBasket.w / orangeBasket.img.width;
    orangeBasket.img.scale.y = orangeBasket.h / orangeBasket.img.height;
    orangeBasket.totalNo = 0;

    trashBin = new basket.Sprite(width/2,height-150, 110, 150, 'static');
    trashBin.img = trashImg;
    trashBin.img.scale.x = trashBin.w / trashBin.img.width;
    trashBin.img.scale.y = trashBin.h / trashBin.img.height;
    // ending sprite
    receipt = new Sprite(width/2, height/2, 0.3 * width, height - 100 , 'none');
    receipt.textAlign = 'left top';
    receipt.textSize = 16;
    receipt.textColor = 'black';
    receipt.color = 'white';
    receipt.visible = false;

    //ML settings for hand
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


function draw(){
    clear();
    image(bg, 0, 0, width, height); 
    // Cull fruits 40px beyond the screen edges
    fruits.cull(60);

    if(!startGame && hands.length>0 && (pauseTime + PAUSE_DURATION_FRAMES < frameCount ||pauseTime ==0) && frameCount!=pauseTime){
        startGame = true;
        endGame = false;
        startTime = frameCount;
        receipt.visible = false;
        stats = { ...defaultStats }; // resets to fresh copy
    }else if (endGame && receipt.visible){
        printReceiptStats();  
    }

    if(startGame){
        pauseTime = 0;
        let secondsLeft = startTime + GAME_DURATION_FRAMES - frameCount;
        push();
        textAlign(CENTER, TOP);
        fill(255);
        stroke(0);
        textSize(40);
        text("Time Left: "+ secondsLeft, width/2, 20);
        pop();
        if (fruits.length < 10 && frameCount % 60 === 0) {
            spawnFruit();
        }

        moveFruits();
        tallyFruits();

        if(startTime + GAME_DURATION_FRAMES < frameCount ){
            startGame = false;
            endGame = true;
            pauseTime = frameCount;
            printReceiptStats();
        }
    }else {
        // show instructions or receipt sprite after game
        push();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        textFont(receiptFont)
        text("Show Hand to Start Game", width/2, height/2);
        pop();
  }

  drawMeshHand();
   
}

function spawnFruit() {
    let fruitData = random(fruitTypes); // pick one at random
    let fruit = new fruits.Sprite(random(50, width-50), 30 , 100); // spawn at bottom
    fruit.img = fruitData;
    // make the images as big as the sprite
    fruit.img.scale.x = fruit.w / fruit.img.width;
    fruit.img.scale.y = fruit.h / fruit.img.height;
    if (fruitData === appleImg) {
        fruit.fruitType = "apple";
    } else if (fruitData === durianImg) {
        fruit.fruitType = "durian";
    } else if (fruitData === orangeImg) {
        fruit.fruitType = "orange";
    }
}

function moveFruits() {
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let index;
    if (hand) {index = hand.keypoints[8];}

    if (!hand || !index) {
      selectedObjects[i] = null;
      continue;
    }

    let selected = selectedObjects[i];

    // Check if current selection is invalid or removed
    if (!selected || !fruits.includes(selected)) {
      let nearby = world.getSpriteAt(index.x, index.y, fruits);
      if (nearby && fruits.includes(nearby)) {
        selectedObjects[i] = nearby;
        selected = nearby;
      } else {
        selectedObjects[i] = null;
        continue;
      }
    }

    // Move the selected fruit with the fingertip
    selected.pos.x = index.x;
    selected.pos.y = index.y;
    selected.vel.set(0, 0); // freeze physics
  }
  
}


// function moveFruits() {
//   for (let i = 0; i < hands.length; i++) {
//     let hand = hands[i];
//     if (!hand) {
//       selectedObjects[i] = null;
//       continue;
//     }

//     let index = hand.keypoints[8]; // index fingertip
//     if (!index) {
//       selectedObjects[i] = null;
//       continue;
//     }

//     let selected = selectedObjects[i];

//     // If nothing selected or it's no longer valid, try to pick a nearby fruit
//     if (!selected || !fruits.includes(selected)) {
//       let nearby = world.getSpriteAt(index.x, index.y, fruits);
//       if (nearby && dist(index.x, index.y, nearby.x, nearby.y) < 60) {
//         selectedObjects[i] = nearby;
//         selected = nearby;
//       } else {
//         selectedObjects[i] = null;
//       }
//     }

//     // Move the selected fruit with the fingertip
//     if (selected) {
//       selected.pos.x = index.x;
//       selected.pos.y = index.y;
//       selected.vel.set(0, 0); // stop physics
//     }
//   }
// }


function tallyFruits(){
    if(fruits.collides(basket)){
        for(let fruit of fruits){
            if (fruit.collides(appleBasket)){
                if (fruit.fruitType == 'apple'){
                    stats.correctApple +=1;
                    appleBasket.totalNo +=1;
                }else if(fruit.fruitType =='durian'){
                    stats.wrongDurian+=1;
                    stats.wastedFruits += appleBasket.totalNo;
                    appleBasket.totalNo=0;
                }
                stats.apples+=1; 
                fruit.remove();
                break;
            }else if(fruit.collides(orangeBasket)){
                if (fruit.fruitType == 'orange'){
                    stats.correctOrange +=1;
                    orangeBasket.totalNo +=1;
                }else if(fruit.fruitType =='durian'){
                    stats.wrongDurian+=1;
                    stats.wastedFruits += orangeBasket.totalNo;
                    orangeBasket.totalNo=0;
                }

                stats.oranges+=1;
                fruit.remove();
                break;
            }else if(fruit.collides(trashBin)){
                if (fruit.fruitType == 'durian'){
                    stats.wrongDurian+=1;
                }else{
                    if (fruit.fruitType == 'orange'){
                        stats.oranges+=1;
                    }else if(fruit.fruitType =='apple'){
                        stats.apples+=1;
                    }
                }

                fruit.remove();
                break;
            }
        }
    }
}

function printReceiptStats() {
    textFont(receiptFont); // Apply monospaced font
    let lines = [];
    // textAlign is center by default
    // pad text to be 32 charcters wide
    lines.push("RECEIPT SUMMARY");
    lines.push(""); // empty line for spacing

    lines.push("Fruit Sorted");
    lines.push(formatRow("Item", "Qty", "Price"));
    lines.push(formatRow("Apple", stats.correctApple, stats.correctApple * 0.5));
    lines.push(formatRow("Orange", stats.correctOrange, stats.correctOrange * 0.5));
    lines.push("-".repeat(32));
    lines.push("");
    lines.push("Wrongly Sorted");
    lines.push(formatRow("Item", "Qty", "Price"));
    lines.push(formatRow("Apple", (stats.apples - stats.correctApple), (stats.apples - stats.correctApple) * -0.5));
    lines.push(formatRow("Orange", (stats.oranges - stats.correctOrange), (stats.oranges - stats.correctOrange) * -0.5));
    lines.push("-".repeat(32));
    lines.push("");
    lines.push("Other Incidents");
    lines.push(formatRow("Durian", stats.wrongDurian, 0));
    lines.push(formatRow("Wasted Produce", stats.wastedFruits, stats.wastedFruits * -0.5));
    lines.push("-".repeat(32));
    lines.push("");
    let totalEarned = (stats.correctApple + stats.correctOrange) * 0.5 + stats.wastedFruits * -0.5 + (stats.apples - stats.correctApple) * -0.5 + (stats.oranges - stats.correctOrange) * -0.5;
    let total = "Total".padEnd(20) + totalEarned.toString().padStart(12);
    lines.push(total);
    lines.push("");
    if((pauseTime + PAUSE_DURATION_FRAMES)>= frameCount){
        let secondsLeft = ((pauseTime+PAUSE_DURATION_FRAMES)-frameCount)/60;
        let stateWait = "Wait " + secondsLeft.toFixed(1) +" seconds to continue..."
        lines.push(stateWait);
    }else{
        lines.push("Show hand to start again.");
    }

    receipt.text = lines.join("\n");
    receipt.visible = true;
}

function formatRow(item, qty, price) {
    // In case, the qty and price is 0 which might pass as NULL
    qty = Number(qty) || 0;
    price = Number(price) || 0;
    // Format to fixed 2 decimal places and pad consistently
    const itemCol = item.padEnd(20);               // Item name column
    const qtyCol = qty.toString().padStart(4);     // Quantity column
    const priceCol = price.toFixed(2).padStart(8); // Price with 2 decimal places

    return itemCol + qtyCol + priceCol;
}
// Draw hands
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


			let edge = new Sprite(midX, midY, [len, angle]);
            if(a ==7 && b ==8 ){
                edge.overlaps(allSprites);
            }else{
                edge.collider = 'static';
            }
			edge.stroke = 'rgba(252, 218, 115, 1)';
			edge.strokeWeight = thickness;
			edge.life = 2;
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

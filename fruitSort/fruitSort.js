//ML hand setup variables
let handPose;
let video;
let hands = []; // store an array of detected hands, and each hand has a property keypoints that will contain an array of keypoints.
let handEdgePools = []; // array of arrays: one pool per hand
const EDGES_PER_HAND = 21; // safe default for full mesh, how much bounding lines per hand

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
let fruitTypes, fruits, appleBasket,orangeBasket, trashBin;

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
const GAME_DURATION_FRAMES = 1800; // 60 frames *  nth seconds
const PAUSE_DURATION_FRAMES = 720;
let selectedObjects = []; // 1 selected per hand

//info sprites
let receipt;

function preload(){
    appleImg = loadImage('assets/apple.png');
    durianImg = loadImage('assets/durian.png');
    orangeImg = loadImage('assets/orange.png');
    fruitTypes = [appleImg,durianImg,orangeImg];
    appleBasketImg = loadImage('assets/applebasket.png');
    orangeBasketImg = loadImage('assets/orangebasket.png');
    trashImg = loadImage('assets/trashbin.png');
    receiptFont = loadFont('assets/Merchant Copy Doublesize.ttf'); //custom fonts, find free ones online
    handPose = ml5.handPose(options); // using the hand pose models with settings
}

function setup(){
    new Canvas();
    world.gravity = {x:0, y:0.5}
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

    trashBin = new basket.Sprite(width/2,height-150, 150, 200, 'static');
    trashBin.img = trashImg;
    trashBin.img.scale.x = trashBin.w / trashBin.img.width;
    trashBin.img.scale.y = trashBin.h / trashBin.img.height;
    // ending sprite
    receipt = new Sprite(width/2, height/2, 0.3 * width, height - 100 , 'none');
    receipt.textSize = 16;
    receipt.textColor = 'black';
    receipt.color = 'white';
    receipt.visible = false;
	//Text settings
	textFont(receiptFont);
	fill(255);
	stroke(0);
	// info, static image
	infoG = createGraphics(500, 120);
	infoG.textFont(receiptFont);
	infoG.textSize(16);
	infoG.fill(255);
	infoG.stroke(0);
	infoG.textAlign(LEFT, TOP);
	infoG.textWrap(WORD);
	infoG.text(
		"Rules\n+0.5 Correct fruit\n-0.5 Wrong basket\nDurian in basket -> all fruits wasted\nDurian in trash -> no effect\n-0.5 per wasted fruit",
		0, 0
	);
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
    image(video, 0, 0, width, width * video.height / video.width);
	image(infoG, 10, 10); // show info image
    // Cull fruits 40px beyond the screen edges
    fruits.cull(40);

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
        let secondsLeft = (startTime + GAME_DURATION_FRAMES - frameCount)/60;
        push();
        textAlign(CENTER, TOP);
        fill(255);
        textSize(40);
        text("Time Left: "+ secondsLeft.toFixed(2), width/2, 20);
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
        text("Show Hand to Start Game", width/2, height/2);
        pop();
  }

  drawMeshHand();
   
}

function spawnFruit() {
    let fruitData = random(fruitTypes); // pick one at random
    let fruit = new fruits.Sprite(random(50, width-50), 30 , 100); //spawn at the top
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
		if (hand) {
			index = hand.keypoints[8];
			circle(index.x, index.y, 20); // visualize fingertip, glue point
		}
	

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
				selected.vel.set(0, 0); // freeze physics
			} else {
				selectedObjects[i] = null;
				continue;
			}
		}
		// Move the selected fruit with the fingertip
		selected.pos.x = lerp(selected.pos.x, index.x, 0.35);
		selected.pos.y = lerp(selected.pos.y, index.y, 0.35);
	}
}
 
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


function drawMeshHand() {
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

    // Ensure pool exists, chreate new edges if there is new hands, pre-preped 2 hands
    // New edges created will be reatined her for later use
    if (!handEdgePools[h]) {
      handEdgePools[h] = [];
    }

    let pool = handEdgePools[h];

    // Create new edges if not enough
    while (pool.length < connections.length) {
      let edge = new Sprite(0, 0, [10, 0], 'static');
      edge.color = 'transparent';
      edge.stroke = 'rgba(252, 218, 115, 0)';
      edge.strokeWeight = 2;
      edge.visible = false;
      pool.push(edge);
    }

    // Update active edges

    for (let i = 0; i < connections.length; i++) {
        let [a, b] = connections[i];
        let p1 = hand.keypoints[a];
        let p2 = hand.keypoints[b];
        let edge = pool[i];

        let midX = (p1.x + p2.x) / 2;
        let midY = (p1.y + p2.y) / 2;
        let len = dist(p1.x, p1.y, p2.x, p2.y);
        let angle = atan2(p2.y - p1.y, p2.x - p1.x);
        if ([a,b] == [7, 8]){edge.collider = 'none';}
        edge.pos.x = lerp(midX,edge.pos.x,0.1);
        edge.pos.y = lerp(midY,edge.pos.y, 0.1);
        edge.rotation = angle;
        edge.w = len;
        edge.strokeWeight = 50;
        edge.visible = true;
        edge.debug = false;
        }

    // Hide unused (if pool longer than needed)
    for (let i = connections.length; i < pool.length; i++) {
      pool[i].visible = false;
    }
  }

  // Hide unused hand pools (e.g., if only 1 hand now) and move them out of the screen to prevent collisions
  for (let h = hands.length; h < handEdgePools.length; h++) {
    for (let edge of handEdgePools[h]) {
        edge.visible = false;
        edge.pos.x = -15;
        edge.pos.y = -15;
    }
  }
}

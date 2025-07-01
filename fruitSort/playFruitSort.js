
// Images
let appleImg, durianImg, orangeImg, appleBasketImg, orangeBasketImg;
let fruitType, fruits, appleBasket,orangeBasket;
let selectedObject = null;
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
let startTime = 0;
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
    receiptFont = loadFont("assets/Merchant Copy Doublesize.ttf"); //custom fonts, find free ones online
}

function setup(){
    new Canvas();
    world.gravity = {x:0, y:3}
    fruits = new Group();
    fruits.collider = 'dynamic';

    fruitBasket = new Group();
    appleBasket = new Sprite(width/2-400,height-100,220,200,'static');
    appleBasket.img = appleBasketImg;
    appleBasket.img.scale.x = appleBasket.w / appleBasket.img.width;
    appleBasket.img.scale.y = appleBasket.h / appleBasket.img.height;
    appleBasket.totalNo = 0;
    orangeBasket = new Sprite(width/2+400,height-100,220,200,'static');
    orangeBasket.img = orangeBasketImg;
    orangeBasket.img.scale.x = orangeBasket.w / orangeBasket.img.width;
    orangeBasket.img.scale.y = orangeBasket.h / orangeBasket.img.height;
    orangeBasket.totalNo = 0;
    // ending sprite
    receipt = new Sprite(width/2, height/2, 0.3 * width, height - 100 , 'none');
    receipt.textAlign = 'left top';
    receipt.textSize = 16;
    receipt.textColor = 'black';
    receipt.color = 'white';
    receipt.visible = false;
}

function draw(){
    clear();
    image(bg, 0, 0, width, height); 

    if(!startGame && mouse.presses()){
        startGame = true;
        startTime = frameCount;
        receipt.visible = false;
        stats = { ...defaultStats }; // resets to fresh copy
    }

    if(startGame){
        if (frameCount % 60 === 0) {
            spawnFruit();
        }

        moveFruits();
        tallyFruits();

        if(startTime + 900 < frameCount){
            startGame = false;
            printReceiptStats();
        }
    }else {
      // show instructions or receipt sprite after game
      push();
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(24);
      textFont(receiptFont)
      text("Click to Start Game", width/2, height/2);
      pop();
  }
   
}

function spawnFruit() {
    let fruitData = random(fruitTypes); // pick one at random
    let fruit = new fruits.Sprite(random(50, width-50), 30 , 100, 100, 'dynamic'); // spawn at bottom
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
  if (mouse.pressing()) {
    if (!selectedObject) {
      selectedObject = world.getSpriteAt(mouse.x, mouse.y, fruits);
    }

    if (selectedObject) {
      selectedObject.pos.x = mouse.x;
      selectedObject.pos.y = mouse.y;
      selectedObject.vel.set(0, 0); // stop physics force from interfering
    }
  } else {
    selectedObject = null; // release when mouse is up
  }
}


function tallyFruits(){
    if(fruits.collides(appleBasket)||fruits.collides(orangeBasket)){
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
            }
        }
    }
}

function printReceiptStats() {
    clear();
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
    lines.push(formatRow("Wasted by Durian", stats.wastedFruits, stats.wastedFruits * -0.5));
    lines.push("-".repeat(32));
    lines.push("");
    let totalEarned = (stats.correctApple + stats.correctOrange) * 0.5 + stats.wastedFruits * -0.5 + (stats.apples - stats.correctApple) * -0.5 + (stats.oranges - stats.correctOrange) * -0.5;
    let total = "Total".padEnd(20) + totalEarned.toString().padStart(12);
    lines.push(total);
    lines.push("");
    lines.push("Click anywhere to start again")

    receipt.text = lines.join("\n");
    receipt.visible = true;
    setTimeout(draw,5000);
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


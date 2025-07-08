let beats;
let currentLayer = 1000; // start high so first blocks are in front
//music settings
let beatInterval = 1; // seconds per block (4 per sec)
let nextBeatTime = 0;
let beatStarted = false;
let leadTime = 0.5; // optional, for visual anticipation
let started = false;
let songPlay;
let mouseSprite;


let score = 0;
let hitThreshold = 100; // beats must be this large or bigger to be hittable


function preload() {
    songPlay = loadSound("test_sodapop.mp3"); 
}

function setup() {
    createCanvas(windowWidth,windowHeight);
    beats = new Group();

    songPlay.onended(() => {
        started = false;
        beatStarted = false;
        promptRestart();
    });

    mouseSprite = new Sprite();
    mouseSprite.d = 50; // circular shape
    mouseSprite.collider = 'none'; // no physics, just overlap check
    mouseSprite.color = 'blue';
    mouseSprite.layer = 9999; // keep it on top

}

function draw(){
    clear();
    background(220);
    fill(0);
    noStroke();
    textSize(24);
    textAlign(LEFT, TOP);
    text("Score: " + score, 10, 10);
    mouseSprite.moveTowards(mouse.x, mouse.y, 0.2);

    if (!started && !songPlay.isPlaying()) {
        promptRestart();
    }


    if (started && songPlay && songPlay.isPlaying()) {
        let now = songPlay.currentTime();

        if (now >= nextBeatTime - leadTime) {
            // always spawn 1 block at (x position, y posistion, z position, size)
            spawnBlock(random(width/2-20, width/2+20), random(height/2-20,height/2+20));

            // 30% chance to spawn a 2nd block simultaneously
            if (random() < 0.3) {
                // spawn block at (x position, y posistion, z position, size)
                spawnBlock(random(width/2-20, width/2+20), random(height/2-20,height/2+20));
            }

            nextBeatTime += beatInterval;
        }
    }

    for (let i = beats.length - 1; i >= 0; i--) {
        let beat = beats[i];
        if (beat.w >= hitThreshold && mouseSprite.overlaps(beat)) {
            score += 1;
            beat.remove();
        }

        if (beat.y < -100 || beat.x < -100 || beat.x > width + 100 || beat.y > height + 100) {
            score -= 1;
            beat.remove();
        }
    }


    
    // movement of sprite
    for (let beat of beats) {
        beat.zDepth -= 0.2;

        // scale and size based on depth
        let scl = map(beat.zDepth, 20, 1, 0.2, 2.5);
        beat.w = beat.h = beat.baseSize * scl;

        // fake perspective shift based on distance from center
        let centerX = width / 2;
        let centerY = height / 2;

        // how far from center (normalized -1 to 1)
        let dx = (beat.x - centerX) / centerX;
        let dy = (beat.y - centerY) / centerY;

        // // shift rate increases closer to edge
        beat.x += dx * 15;  // tune `2` for more/less lateral speed
        beat.y += dy * 15;  // tune `2` for more/less vertical speed

        let distance = dist(beat.x, beat.y, centerX, centerY);
        if (abs(distance)> 200 || beat.w >=120){
            let speedFactor = pow((distance - 100) / 100, 2);  // exponential acceleration
            let angle = atan2(dy, dx);
            beat.x += cos(angle) * speedFactor;
            beat.y += sin(angle) * speedFactor;
        }

    }

}

function spawnBlock(x=50, y=50 , z = 10, size = 50) {
    let beat = new Sprite(x, y);
    beat.zDepth = z;           // custom fake Z-depth
    beat.baseSize = size;      // base size to scale from
    beat.color = 'red';        // or random color
    beat.layer = currentLayer;  // assign layer
    currentLayer--;              // decrement so newer blocks go behind
    beat.collider = 'static';    // no physical collider needed
    let defaultDraw = beat._draw;

    beat.draw = function () {
        stroke(180);
        fill(200);

        let scl = this.w / this.baseSize;
        let depth = 20 * scl;

        let x1 = -this.w / 2;
        let y1 = -this.h / 2;
        let x2 =  this.w / 2;
        let y2 =  this.h / 2;

        let centerX = width / 2;
        let centerY = height / 2;

        // vector pointing outward from center
        let dirX = (this.x - centerX);
        let dirY = (this.y - centerY);
        let mag = sqrt(dirX * dirX + dirY * dirY);

        let unitX = dirX / -mag;
        let unitY = dirY / -mag;

        // scaled depth vector in trail direction
        let dx = unitX * depth;
        let dy = unitY * depth;

        //Left face
        quad(
            x1, y1,             // top-left front
            x1 + dx, y1 + dy,   // top-left back
            x1 + dx, y2 + dy,   // bottom-left back
            x1, y2              // bottom-left front
        );

        // Right face
        quad(
            x2, y1,
            x2 + dx, y1 + dy,
            x2 + dx, y2 + dy,
            x2, y2
        );

        // Bottom face
        quad(
            x1, y2,
            x2, y2,
            x2 + dx, y2 + dy,
            x1 + dx, y2 + dy
        );

        //Top face
        quad(
            x1, y1,             // top-left front
            x2, y1,             // top-right front
            x2 + dx, y1 + dy,   // top-right back
            x1 + dx, y1 + dy    // top-left back
        );

        // Draw the sprite and this
        defaultDraw.call(this);
    };

    beat.onMousePressed = () => {
        score += 1;
        beat.remove(); // remove clicked beat
    };


    beats.push(beat);     // add to blockGroup for updates  
    return beat;
}


function keyPressed() {
    if (key === "=") {
        if (!started) {
            beats.removeAll(); // clear old beats
            started = true;
            beatStarted = true;
            songPlay.play();
            nextBeatTime = songPlay.currentTime() + leadTime;
        }
    }
}

function promptRestart() {
    fill(0);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Song ended. Press '=' to restart.", width / 2, height / 2);
}

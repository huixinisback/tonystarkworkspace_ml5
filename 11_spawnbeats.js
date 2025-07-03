let beats;
let currentLayer = 1000; // start high so first blocks are in front
function setup() {
    createCanvas(windowWidth,windowHeight);
    beats = new Group();
}

function draw(){
    clear();
    background(220);
    if (frameCount % 30 === 0) {
        // spawn block at (x position, y posistion, z position, size)
        spawnBlock(random(width/2-100, width/2+100), random(height/2-100,height/2+100));
    }

    beats.cull(500); // remove sprites that are no longer in view
    for (let beat of beats) {
        beat.zDepth -= 0.2;

        // scale and size based on depth
        let scale = map(beat.zDepth, 20, 1, 0.2, 2.5);
        beat.w = beat.h = beat.baseSize * scale;

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

function spawnBlock(x=50, y=50 , z = 20, size = 50) {
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

        // Draw the red face
        defaultDraw.call(this);
    };

    beats.push(beat);     // add to blockGroup for updates
    return beat;
}



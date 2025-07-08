let beats;
let currentLayer = 10000;

let songAnalyse, songPlay;
let fft, peak;
let beatData = [];
let analysisDone = false;
let started = false;
let playing = false;
let lastBeat = 0;
let currentIndex = 0;

let analysisStartTime = 0;
let countdownDuration = 0;
let showPlayPrompt = false;

function preload() {
    songAnalyse = loadSound('test_sodapop.mp3');
    songPlay = loadSound('test_sodapop.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    textSize(24);
    let gain = new p5.Gain();
    songAnalyse.disconnect();      // remove from master output
    songAnalyse.connect(gain);     // connect to gain
    gain.amp(0);          

    fft = new p5.FFT();
    peak = new p5.PeakDetect();
    fft.setInput(songAnalyse);

    beats = new Group();
}

function draw() {
    background(0);
    fill(255);

    if (!started) {
        text("Click to start beat analysis", width / 2, height / 2);
        return;
    }

    // During fast analysis
    if (started && !analysisDone) {
        let t = songAnalyse.currentTime() / 4;
        fft.analyze();
        peak.update(fft);

        if (peak.isDetected && t - lastBeat > 0.15) {
            beatData.push(t);
            lastBeat = t;
        }

        countdownDuration = max(0, songAnalyse.duration() / 4 - songAnalyse.currentTime());
        text("Analyzing song... " + nf(countdownDuration, 1, 2) + "s", width / 2, height / 2);

        if (!songAnalyse.isPlaying()) {
            analysisDone = true;
            showPlayPrompt = true;
        }
    }

    // After analysis is done
    if (showPlayPrompt && !playing) {
        text("Analysis done! Click to play & start!", width / 2, height / 2);
        console.log(beatData);
    }

    // Play phase
    if (playing && songPlay.isPlaying()) {
        let now = songPlay.currentTime();

        while (currentIndex < beatData.length && now >= beatData[currentIndex]) {
            spawnBlock(random(width / 2 - 100, width / 2 + 100), random(height / 2 - 100, height / 2 + 100));
            currentIndex++;
        }
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

function mousePressed() {
    // Required by browser
    if (getAudioContext().state !== "running") {
        getAudioContext().resume();
    }

    // Start analysis phase
    if (!started) {
        started = true;

        let gain = new p5.Gain();
        songAnalyse.disconnect();
        songAnalyse.connect(gain);
        gain.amp(0); // muted but analyzable

        songAnalyse.rate(4);
        songAnalyse.play();

        fft.setInput(songAnalyse);  // ✅ safely set input after play
    }

    // After analysis, start song playback
    else if (analysisDone && !playing) {
        playing = true;
        songPlay.setVolume(1);
        songPlay.rate(1);
        songPlay.play();
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
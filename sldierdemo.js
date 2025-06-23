// Adjust the range sliders to change the camera's position.

let xSlider;
let ySlider;
let zSlider;

function setup() {
  createCanvas(500, 500, WEBGL);

  // Create slider objects to set the camera's coordinates.
  xSlider = createSlider(-400, 400, 400);
  xSlider.position(0, 100);
  xSlider.size(100);
  ySlider = createSlider(-400, 400, -200);
  ySlider.position(0, 120);
  ySlider.size(100);
  zSlider = createSlider(0, 1600, 800);
  zSlider.position(0, 140);
  zSlider.size(100);

  describe(
    'A white cube drawn against a gray background. Three range sliders appear beneath the image. The camera position changes when the user moves the sliders.'
  );
}

function draw() {
  background(200);

  // Get the camera's coordinates from the sliders.
  let x = xSlider.value();
  let y = ySlider.value();
  let z = zSlider.value();

  // Move the camera.
  camera(x, y, z);

  // Draw the box.
  box();
}
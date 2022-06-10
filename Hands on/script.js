//initialize global variables
var scene,
  camera,
  cameras,
  cameraIndex,
  renderer,
  controls,
  clock,
  player,
  food,
  model,
  player_box,
  player_box_b,
  mixer,
  actions,
  sun,
  crateTexture,
  crateNormalMap,
  crateBumpMap,
  crateBox,
  b,
  rayCaster,
  search = [],
  search_b = [],
  lag = 0.08,
  box,
  box1,
  flags,
  box2,
  box3,
  box4,
  box5,
  box6, box7,box0,
  anims,model0,model1,model2,model3,model4,model5,model6;

var isPaused = false;
var run_f = true;
var run_b = true;
var turn_l = true;
var turn_r = true;
var g_o = false;
var crates = [];
var eaten=false;
var grab = 0;
var foodlist = [[0,8],[21,65],[61,46],[23,19]]
var boxes = [box0,box1,box2,box3,box4,box5,box6]
var models = [model0,model1,model2,model3,model4,model5,model6]
var enemypos = [[30,18],[34,24],[-69,64],[-26,51],[-14,7],[3,63],[41,49]]

var loadingManager = null;
var RESOURCES_LOADED = false;
loadingManager = new THREE.LoadingManager();
const loader = new THREE.GLTFLoader(); 

const start_time = 2;
let time = (start_min = 60);

const countdown = document.getElementById("countdown");
setInterval(updateCountDown, 1000);
// setInterval(addtime,10000)

function updateCountDown() {
  const min = Math.floor(time / 60);
  let sec = time % 60;

  sec = sec < 10 ? "0" + sec : sec;

  countdown.innerHTML = `${min}:${sec}`;
  time--;
  time = time < 0 ? 0 : time;
}

function addtime(){
  time+=1;
}
function LostOnTime(){

  if(time==0){
    time="l";
    alert("you lost on time");
    window.location.replace('./menu.html');
  }
}

function Enemy(){
  if(g_o){
    alert("Enemy got u");
    window.location.replace('./menu.html');
  }
}

//call the init function
init();
function subclip(sourceClip, name, startFrame, endFrame, fps) {
  fps = fps || 30;

  var clip = sourceClip.clone();
  clip.name = name;

  var tracks = [];

  for (var i = 0; i < clip.tracks.length; ++i) {
    var track = clip.tracks[i];
    var valueSize = track.getValueSize();

    var times = [];
    var values = [];

    for (var j = 0; j < track.times.length; ++j) {
      var frame = track.times[j] * fps;

      if (frame < startFrame || frame >= endFrame) continue;

      times.push(track.times[j]);

      for (var k = 0; k < valueSize; ++k) {
        values.push(track.values[j * valueSize + k]);
      }
    }

    if (times.length === 0) continue;

    track.times = THREE.AnimationUtils.convertArray(
      times,
      track.times.constructor
    );
    track.values = THREE.AnimationUtils.convertArray(
      values,
      track.values.constructor
    );

    tracks.push(track);
  }

  clip.tracks = tracks;

  // find minimum .times value across all tracks in the trimmed clip
  var minStartTime = Infinity;

  for (var i = 0; i < clip.tracks.length; ++i) {
    if (minStartTime > clip.tracks[i].times[0]) {
      minStartTime = clip.tracks[i].times[0];
    }
  }

  // shift all tracks such that clip begins at t=0

  for (var i = 0; i < clip.tracks.length; ++i) {
    clip.tracks[i].shift(-1 * minStartTime);
  }

  clip.resetDuration();

  return clip;
}
//create the init function
function init() {
  //reference to the assets
  const assetPath = "assets";
  clock = new THREE.Clock(); //initialize a new clock
    //adds scene, camera and lights
  cameraLightAction();
    //create and add skybox
  addSkybox();
    //creates renderer
      //creates floor/ground
  createGround();
      // animates the avatar
  animateAvatar();
      //creates loading manager and adds textures
  loadTextures();
      //adds maze to scene
  createMaze();
  mazeConfigurations();
  loadLoadables();
  const btn = document.getElementById("camera-btn");
  btn.addEventListener("click", changeCamera);
  window.addEventListener("resize", resize, false);
}
//loads food and adds the food to scene
function loadFood(){
  
    //loads food on to scene
    loader.load(
      "assets/bought_bread/scene.gltf",
      function (gltf) {
        food = gltf.scene;
        food.scale.set(25, 25, 25);
        scene.add(food);
  
        food.position.set(box2.position.x, 2, box2.position.z);
      },
      undefined,
      function (e) {
        console.error(e);
      }
    );
}
// loads an attacker and adds it to scene
function loadAttacker(box){
  loader.load(
    "assets/Skull.gltf",
    function (gltf) {
      for(var i=0;i<models.length;i++){
      models[i] = gltf.scene;
      models[i].scale.set(2, 2, 2);
      scene.add(models[i]);
      models[i].position.set(boxes[i].position.x, 0, boxes[i].position.z);
      console.log(models[i].position)
    }
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );
}
//upload flags
function loadFlag(){
  loader.load(
    "assets/flag/scene.gltf",
    function (gltf) {
      flags = gltf.scene;
    flags.scale.set(9, 9, 0.2);
      scene.add(flags);
      flags.position.set(box7.position.x, 0,box7.position.z);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );
}
//used to load avatar model, animate it and add it to scene
function loadAvatar(){
  loader.load("assets/fred.glb", (object) => {
    // console.log(object.animations[0]);
    mixer = new THREE.AnimationMixer(object.scene);
    // console.log(object);
    mixer.addEventListener("finished", (e) => {
      if (e.action.next != undefined) playAction(e.action.next);
    });
    object.scene.children[0].rotation.x = 0;
    actions = {};

    object.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  anims.forEach((anim) => {
    const clip = subclip(
      object.animations[0],
      anim.name,
      anim.start,
      anim.end
    );
    const action = mixer.clipAction(clip);
    if (!anim.loop) {
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
    }
    if (anim.next != undefined) action.next = anim.next;
    actions[anim.name] = action;
  });

  player = new THREE.Object3D();
  sun.target = player;

  object.scene.children[0].scale.set(0.02, 0.02, 0.02);
  player.add(object.scene.children[0]);
  player.scale.set(0.5, 1, 1);

  createCameras();
  addKeyboardControl();

  playAction("idle");

  scene.add(player);
  update();
});
}
//call all the loaders in one function
function loadLoadables(){

    //loads food to the scene
  loadFood();
    //loads an attacker to the scene
  loadAttacker();
    //loads the flag 
  loadFlag();
    //loads actual avatar to scene
  loadAvatar();
}
//function used to create skeleton for the maze
function mazeSkeleton(gx, gy, gz, px, py, pz) {
  var cratename = new THREE.Mesh(
    new THREE.BoxGeometry(gx, gy, gz),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,

      map: crateTexture,
     // bumpMap: crateBumpMap,
      //normalMap: crateNormalMap,
    })
  );

  cratename.position.set(px, py, pz);
  cratename.receiveShadow = true;
  cratename.castShadow = true;
  scene.add(cratename);
  cratename.name = "block";
  crates.push(cratename);
}
//creates the maze using the mazeSkeleton function
function createMaze() {
  mazeSkeleton(20, 5, 3, 12, 3 / 2, 2.5);
  mazeSkeleton(3, 5, 8, -2.5, 3 / 2, 2.5);
  mazeSkeleton(80, 5, 3, 43, 3 / 2, -3);
  mazeSkeleton(3, 5, 5, -2.5, 3 / 2, -3);
  mazeSkeleton(3, 5, 32, -2.5, 3 / 2, 25);
  mazeSkeleton(3, 5, 85, 83, 3 / 2, 32);
  mazeSkeleton(3, 5, 23, 20, 3 / 2, 15);
  mazeSkeleton(13, 5, 3, 15, 3 / 2, 28);
  mazeSkeleton(3, 5, 20, 10, 3 / 2, 35);
  mazeSkeleton(12, 5, 3, 21, 3 / 2, 34);
  mazeSkeleton(160, 5, 3, 2, 3 / 2, 75);
  mazeSkeleton(3, 5, 12, 18, 3 / 2, 70);
  mazeSkeleton(3, 5, 12, 35, 3 / 2, 70);
  mazeSkeleton(3, 5, 45, -8, 2 / 2, 55);
  mazeSkeleton(75, 5, 3, -40, 3 / 2, -3);
  mazeSkeleton(3, 5, 70, -78, 3 / 2, 32);
  mazeSkeleton(3, 5, 65, 55, 3 / 2, 37);
  mazeSkeleton(44, 5, 3, 55, 3 / 2, 40);
  mazeSkeleton(3, 5, 60, -40, 3 / 2, 40);
  mazeSkeleton(54, 5, 3, -40, 3 / 2, 40);
}

//sets the camera, scene and the lighting
function cameraLightAction() {
  //initializes a renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //add a scene
  scene = new THREE.Scene();
  let col = 0xffffff;
  scene.background = new THREE.Color(col);
  scene.fog = new THREE.Fog(col, 10, 100); //adds fog to scene

  //add a perspective camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  
  camera.position.set(0, 4, 7);
  camera.lookAt(0, 1.5, 0);
  controls.update(); 

  //add ambient light
  const ambient = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambient);
  //add directional light
  const light1 = new THREE.DirectionalLight(0xffffff, 2);
  light1.position.set(10, 50, 50);
  const light2 = new THREE.DirectionalLight(0xffffff, 2);
  light2.position.set(0, 1, 100);
  light1.castShadow = true;
  // Will not light anything closer than 0.1 units or further than 25 units
  light1.shadow.camera.near = 0.1;
  light1.shadow.camera.far = 25;
  
  sun = light1; //sun is directional light one
}

function morelight(){
  var finishLight = new THREE.SpotLight(0xffffff);
  finishLight.position.set(-3, 20, -3);
  finishLight.shadowCameraNear = 0.1;
  finishLight.shadowCameraFar = 25;
  finishLight.castShadow = true;
  finishLight.intensity = 0.5;
  
  var finishTarget = new THREE.Object3D();
  finishTarget.position.set(-45, 1, 60);
  finishLight.target = finishTarget;
  scene.add(finishLight);
}

morelight()
function enableShadows() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
}
enableShadows()

//implements a skybox for the scene
function addSkybox(){
  var skybox = new THREE.CubeTextureLoader();
  var texture = skybox.load([
    "img/cocoa_ft.jpg",
    "img/cocoa_bk.jpg",
    "img/cocoa_up.jpg",
    "img/cocoa_dn.jpg",
    "img/cocoa_rt.jpg",
    "img/cocoa_lf.jpg",
  ]);
  scene.background = texture;
}
//used to animate the avatar
function animateAvatar(){
    anims = [
    { start: 30, end: 59, name: "backpedal", loop: true },
    { start: 489, end: 548, name: "idle", loop: true },
    { start: 768, end: 791, name: "run", loop: true },
    { start: 839, end: 858, name: "shuffleLeft", loop: true },
    { start: 899, end: 918, name: "shuffleRight", loop: true },
    { start: 1264, end: 1293, name: "walk", loop: true },
  ];
}
//creates ground, where scene will be added on
function createGround(){
  const planeGeometry = new THREE.PlaneBufferGeometry(200, 200);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);
}
//loads texture scenes
function loadTextures() {
  var textureLoader = new THREE.TextureLoader(loadingManager);
  crateTexture = textureLoader.load("assets/crate0/imgpp.png");
 // crateBumpMap = textureLoader.load("assets/crate0/material_1_baseColor.jpeg");
  //crateNormalMap = textureLoader.load("assets/crate0/material_2_baseColor.jpeg");
}
//creates camera views for toggle purposes
function createCameras() {
  cameras = [];
  cameraIndex = 0;

  const followCam = new THREE.Object3D();
  followCam.position.copy(camera.position);
  player.add(followCam);
  cameras.push(followCam);

  const frontCam = new THREE.Object3D();
  frontCam.position.set(0, 3, -8);
  player.add(frontCam);
  cameras.push(frontCam);

  const overheadCam = new THREE.Object3D();
  overheadCam.position.set(0, 20, 0);
  cameras.push(overheadCam);
}
//used to toggle the camera views
function changeCamera() {
  cameraIndex++;
  if (cameraIndex >= cameras.length) cameraIndex = 0;
}
//self explanatory really
function addKeyboardControl() {
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
}
//function on keydown event
function keyDown(evt) {
  let forward =
    player.userData.move !== undefined ? player.userData.move.forward : 0;
  let turn = player.userData.move !== undefined ? player.userData.move.turn : 0;

  switch (evt.keyCode) {
    case 87: //W
      forward = 1;
      break;
    case 83: //S
      forward = -1;
      break;
    case 65: //A
      turn = 1;
      break;
    case 68: //D
      turn = -1;
      break;
  }

  playerControl(forward, turn);
}
//function on keyup event
function keyUp(evt) {
  let forward =
    player.userData.move !== undefined ? player.userData.move.forward : 0;
  let turn = player.userData.move !== undefined ? player.userData.move.turn : 0;

  switch (evt.keyCode) {
    case 87: //W
      forward = 0;
      break;
    case 83: //S
      forward = 0;
      break;
    case 65: //A
      turn = 0;
      break;
    case 68: //D
      turn = 0;
      break;
  }

  playerControl(forward, turn);
}
//adds controls to player movement for smoothness 
function playerControl(forward, turn) {
  if (forward == 0 && turn == 0) {
    delete player.userData.move;
  } else {
    if (player.userData.move) {
      player.userData.move.forward = forward;
      player.userData.move.turn = turn;
    } else {
      player.userData.move = {
        forward,
        turn,
        time: clock.getElapsedTime(),
        speed: 1,
      };
      cameraIndex = 1;
    }
  }
}

function enemy_creation(i){
  boxes[i]= new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshPhongMaterial({
      color: 0x444444,
    })
  );
  var x = enemypos[i][0];
  var z = enemypos[i][1];
  boxes[i].position.set(x, 0, z);
  scene.add(boxes[i]);
}
function mazeConfigurations(){

  for(var i=0;i<boxes.length;i++){
    enemy_creation(i)
  }
  box7 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshPhongMaterial({
      color: 0x444444,
    })
  );
  
  box7.position.set(-71, 0, 67);
  scene.add(box7);
  
  box = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.05),
    new THREE.MeshPhongMaterial({
      color: 0xff0000,
    })
  );
  box.position.set(0, 0, 0);
  scene.add(box);
  box.name = "player";
  
    box2 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshPhongMaterial({
      color: 0xffff00,
    })
  );
  box2.position.set(0, 0, 8);
  scene.add(box2);
  box2.name = "food";
}


function Physics(){

  function resetFood(){
    if(grab>=foodlist.length){
      grab = 0;
    }
  }

  function Full(){
    if(!eaten){
    }
  }
  // console.log(foodlist.length)
  console.log(foodlist[grab])
  console.log(grab)
  console.log(player.position)
  b = [];
  for (let i = 0; i < scene.children.length; i++) {
    if (scene.children[i].isMesh) {
      b[i] = scene.children[i];
      // console.log(b[i]);
    }
  }
  // b.shift();
  // b.shift();
  // b.shift();
  
  // console.log(b);
  // console.log(scene.children);
  
  rayCaster = new THREE.Raycaster();
  search = [];
  search_b = [];
  lag = 0.1;
  
  for (let i = 0; i < 360; i += 3) {
    search[i] = new THREE.Vector3(Math.cos(i), 0, Math.sin(i));
  }

function chase() {
  // console.log(b)
  // b.shift();
  // b.shift();
  for(var i=0;i<boxes.length;i++){
    // console.log(box1.position)
  // console.log(model.position)

  search.forEach((direction) => {
    rayCaster.set(boxes[i].position, direction, 0, 100);
    const intersects = rayCaster.intersectObjects(scene.children, false);

    if (intersects.length > 0) {
      if (intersects[0].object.name == "player") {
        boxes[i].position.x += direction.x * lag;
        boxes[i].position.z += direction.z * lag;
        // if (!typeof model === 'undefined'){
          models[i].position.set(boxes[i].position.x, 0, boxes[i].position.z);
          if(intersects[0].distance<1){
            g_o = true;
            Enemy()
            g_o = false;
            boxes[i].position.set(100, 0,100);
          }
        // }
      }
    }
  });
  }
  
}
function checkFood() {
  // resetFood();
  search.forEach((direction) => {
    rayCaster.set(box.position, direction, 0, 50);
    const intersects = rayCaster.intersectObjects(b, false);
    if(!eaten){
    if (intersects.length > 0) {
      if (intersects[0].object.name == "food") {
        if (intersects[0].distance < 2) {
          arr = foodlist[grab]
          box2.position.x = foodlist[grab][0];
          box2.position.z = foodlist[grab][1];
   
          food.position.set(box2.position.x, 2, box2.position.z);
          eaten = false
          grab++;
          resetFood()
          addtime()
        }
      }
    }
  }
  });
}

function checkWin() {
  // resetFood();
  b.shift();
  b.shift();
  search.forEach((direction) => {
    rayCaster.set(box7.position, direction, 0, 50);
    const intersects = rayCaster.intersectObjects(b, false);
    if(!eaten){
    if (intersects.length > 0) {
      if (intersects[0].object.name == "player") {
        if (intersects[0].distance < 2) {
          alert("Win")
        }
      }
    }
  }
  });
}

for (let i = 0; i < 360; i += 3) {
  search_b[i] = new THREE.Vector3(Math.cos(i), 0, Math.sin(i));
}
function checkCollision() {
  b.shift();
  b.shift();
  search_b.forEach((direction) => {
    rayCaster.set(box.position, direction, 0, 50);
    const intersects = rayCaster.intersectObjects(b, false);
    // check the collisions with blocks
    if (intersects.length > 0) {
      if (intersects[0].object.name == "block") {
        if (intersects[0].distance < 1) {
          // console.log(player.position);
          box.position.x -= direction.x * 0.5;
          // box.position.y += curr_position.y;
          box.position.z -= direction.z * 0.5;

          player.position.x = box.position.x;
          player.position.z = box.position.z;
        }
      }
    }
  });
}
checkWin()
chase()
checkCollision()
checkFood()


}



function update() {
  // player_box.update();
  // console.log(player.position);
  box.position.x = player.position.x;
  box.position.z = player.position.z;

  // checkCollision();
  // checkFood();
  // chase();
  Physics()
  LostOnTime()
  requestAnimationFrame(update);
  renderer.render(scene, camera);

  const dt = clock.getDelta();
  mixer.update(dt);

  if (player.userData.move !== undefined) {
    if (player.userData.move.forward > 0 && player.userData.move.speed < 10)
      player.userData.move.speed += 0.1;
    player.translateZ(
      player.userData.move.forward * dt * player.userData.move.speed
    );
    player.rotateY(player.userData.move.turn * dt);

    //Update actions here
    if (player.userData.move.forward < 0) {
      playAction("backpedal");
    } else if (player.userData.move.forward == 0) {
      if (player.userData.move.turn < 0) {
        playAction("shuffleLeft");
      } else {
        playAction("shuffleRight");
      }
    } else if (player.userData.move.speed > 5) {
      playAction("run");
    } else {
      playAction("walk");
    }
  } else {
    playAction("idle");
  }

  camera.position.lerp(
    cameras[cameraIndex].getWorldPosition(new THREE.Vector3()),
    0.05
  );
  const pos = player.position.clone();
  pos.y += 3;
  camera.lookAt(pos);

  if (this.sun != undefined) {
    sun.position.x = player.position.x;
    sun.position.y = player.position.y + 10;
    sun.position.z = player.position.z - 10;
    sun.target = this.player;
  }
}


function playAction(name) {
  if (player.userData.actionName == name) return;
  const action = actions[name];
  player.userData.actionName = name;
  mixer.stopAllAction();
  action.reset();
  action.fadeIn(0.5);
  action.play();
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

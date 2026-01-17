import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#experience-canvas");

/* ================= SCENE ================= */
const scene = new THREE.Scene();

const yAxisFans = [];
const xAxisFans = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const raycasterObject = [];
let currentIntersects = [];
/* ================= SIZES ================= */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const socialLinks = {
  GitHub: "https://github.com/ThomasShikalepo",
  LinkedIn: "www.linkedin.com/in/thomas-shikalepo",
  Instagrem: "https://www.instagram.com/thomas__deon/",
};

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
});

window.addEventListener("click", (click) => {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });
  }
});

/* ================= CAMERA ================= */
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(-4.877604882995123, -8.271879094271918, 9.847558929262831);

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.minDistance = 0.5;
controls.maxDistance = 50;

controls.target.set(
  -2.1994280240124406,
  -10.324640060721578,
  6.457151867306472
);
controls.update();

/* ================= LIGHT ================= */
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

/* ================= VIDEO TEXTURE ================= */
const videoElement = document.createElement("video");
videoElement.src = "/texture/video/Screen.mp4"; // make sure the path is correct
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play().catch(() => {});

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.flipY = false;
videoTexture.colorSpace = THREE.SRGBColorSpace;

/* ================= LOADERS ================= */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("/texture/skybox")

  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

/* ================= LOAD GLB ================= */
gltfLoader.load(
  "/model/rom_compressed.glb",
  (glb) => {
    glb.scene.traverse((child) => {
      if (child.isMesh) {
        console.log(child.name || "(unnamed mesh)");
      }

      if (child.isMesh && child.name.includes("_Pointer_Hover")) {
        child.material = child.material.clone();
        raycasterObject.push(child);
      }

      if (child.isMesh && child.name === "computer_Screen") {
        // Apply the video texture only to the pc_screen mesh
        child.material = new THREE.MeshStandardMaterial({
          map: videoTexture,
          roughness: 0.5,
          metalness: 0,
        });
      }
      if (child.name.includes("Computer_Glass")) {
        child.material = new THREE.MeshPhysicalMaterial({
          transmission: 1,
          opacity: 1,
          metalness: 0,
          roughness: 0,
          ior: 1.5,
          thickness: 0.01,
          specularIntensity: 1,
          specularColor: 0xffffff,
          envMapIntensity: 1,
          lightIntensity: 1,
          exposure: 1,
        });
      }

      if (child.name.includes("Computer_Fan_")) {
        if (child.name.includes("4_") || child.name.includes("5_")) {
          yAxisFans.push(child);
        } else {
          xAxisFans.push(child);
        }
      }
    });

    // Center the whole model
    const box = new THREE.Box3().setFromObject(glb.scene);
    const center = box.getCenter(new THREE.Vector3());
    glb.scene.position.sub(center);

    scene.add(glb.scene);
  },
  undefined,
  (error) => console.error("Error loading GLB:", error)
);
/* ===============
== RESIZE ================= */
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* ================= ANIMATE ================= */
const render = () => {
  controls.update();

  yAxisFans.forEach((fan) => {
    fan.rotation.y += 0.08;
  });

  xAxisFans.forEach((fan) => {
    fan.rotation.x += 0.08;
  });

  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObject, true);

  raycasterObject.forEach((obj) => {
    if (obj.material?.color) {
      obj.material.color.set(0xffffff);
    }
  });

  if (currentIntersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();

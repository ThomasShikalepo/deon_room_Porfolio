import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

const canvas = document.querySelector("#experience-canvas");

/* ================= SCENE ================= */
const scene = new THREE.Scene();

const yAxisFans = [];
const xAxisFans = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const raycasterObject = [];
let currentIntersects = [];

let plank1,
  plank2,
  workBtn,
  aboutBtn,
  contactBtn,
  boba,
  github,
  linkedin,
  insta;

let currentHoveredObject = null;

const model = {
  work: document.querySelector(".model.work"),
  about: document.querySelector(".model.about"),
  contact: document.querySelector(".model.contact"),
};

let touchHappened = false;

document.querySelectorAll(".model-exit-button").forEach((button) => {
  button.addEventListener(
    "touchend",
    (event) => {
      touchHappened = true;
      const model = event.target.closest(".model");
      hideModel(model);
    },
    { passive: false },
  );

  button.addEventListener(
    "click",
    (event) => {
      if (touchHappened) return;
      const model = event.target.closest(".model");
      hideModel(model);
    },
    { passive: false },
  );
});

let isModelOpen = false;

const showModel = (model) => {
  model.style.display = "block";
  isModelOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(model, { opacity: 0 });

  gsap.to(model, {
    opacity: 1,
    duration: 0.5,
  });
};

const hideModel = (model) => {
  isModelOpen = false;
  controls.enabled = true;
  gsap.to(model, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      model.style.display = "none";
    },
  });
};

/* ================= SIZES ================= */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const socialLinks = {
  GitHub: "https://github.com/ThomasShikalepo",
  LinkedIn: "https://www.linkedin.com/in/thomas-shikalepo",
  Instagrem: "https://www.instagram.com/thomas__deon/",
};

window.addEventListener("mousemove", (event) => {
  touchHappened = false;
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
  pointer.y = -(event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener(
  "touchstart",
  (event) => {
    if (isModelOpen) return;
    event.preventDefault();
    pointer.x = (event.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(event.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false },
);

window.addEventListener(
  "touchend",
  (event) => {
    if (isModelOpen) return;
    event.preventDefault();
    pointer.x = (event.changedTouches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(event.changedTouches[0].clientY / sizes.height) * 2 + 1;
    handleRaycasterInteractions();
  },
  { passive: false },
);

function handleRaycasterInteractions() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });

    if (object.name.includes("Work_Button")) showModel(model.work);
    else if (object.name.includes("About_Button")) showModel(model.about);
    else if (object.name.includes("Contact_Button")) showModel(model.contact);
  }
}

window.addEventListener("click", handleRaycasterInteractions);

/* ================= CAMERA ================= */
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000,
);
camera.position.set(-7, -8.5, 11.5);

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement);

controls.minDistance = 6;
controls.maxDistance = 18;
controls.minPolarAngle = -Math.PI * 0.22;
controls.maxPolarAngle = Math.PI / 2;

controls.minAzimuthAngle = -Math.PI / 0.42;
controls.maxAzimuthAngle = -0.57;

console.log(controls.getAzimuthalAngle());

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.target.set(-2.2, -10.3, 6.45);
controls.update();
console.log(camera.position.distanceTo(controls.target));

const targetMin = new THREE.Vector3(-3, -12, 4);
const targetMax = new THREE.Vector3(1, -8, 8);

const cameraMin = new THREE.Vector3(-8, -16, 4);
const cameraMax = new THREE.Vector3(2, -6, 16);

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
  "/model/wosh-v1.glb",
  (glb) => {
    glb.scene.traverse((child) => {
      if (!child.isMesh) return;

      if (child.name.includes("Pointer")) {
        raycasterObject.push(child);
      }

      // Hover objects
      if (child.name.includes("Hover")) {
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = child.position.clone();
        child.userData.initialRotation = child.rotation.clone();
      }
      // Buttons
      if (
        child.name.includes("My_Work_Button") ||
        child.name.includes("About_Button") ||
        child.name.includes("Contact_Button") ||
        child.name.includes("Hanging_Plank") ||
        child.name.includes("Boba") ||
        child.name.includes("GitHub") ||
        child.name.includes("LinkedIn") ||
        child.name.includes("Instagram")
      ) {
        child.userData.initialScale =
          child.userData.initialScale || child.scale.clone(); // ensure initialScale exists
        console.log(
          "📌 Button / Plank found:",
          child.name.includes("Boba"),
          "initialScale:",
          child.name.includes("Boba"),
        );
      }
      // Set initial scale for intro animation
      if (child.name.includes("Hanging_Plank_1")) {
        plank1 = child;
        child.scale.set(0, 0, 1);
      } else if (child.name.includes("Hanging_Plank_2")) {
        plank2 = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("My_Work_Button")) {
        workBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("About_Button")) {
        aboutBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Contact_Button")) {
        contactBtn = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Boba_Plushie_Fourth_Raycaster_Hover")) {
        boba = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("GitHub")) {
        github = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("LinkedIn")) {
        linkedin = child;
        child.scale.set(0, 0, 0);
      } else if (child.name.includes("Instagram")) {
        insta = child;
        child.scale.set(0, 0, 0);
      }

      if (child.name === "computer_Screen") {
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
          envMap: environmentMap,
          roughness: 0,
          ior: 1.5,
          thickness: 0.01,
          specularIntensity: 1,
          specularColor: 0xffffff,
          envMapIntensity: 1,
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

    /* ================= CENTER MODEL ================= */
    const box = new THREE.Box3().setFromObject(glb.scene);
    const center = box.getCenter(new THREE.Vector3());
    glb.scene.position.sub(center);

    scene.add(glb.scene);
    setTimeout(playIntroAnimation, 100);
  },
  undefined,
  (error) => console.error("Error loading GLB:", error),
);

function playIntroAnimation() {
  // ================= TIMELINE 1 (UI / PLANKS) =================
  const t1 = gsap.timeline({
    defaults: { duration: 0.8, ease: "back.out(1.8)" },
  });

  t1.timeScale(0.8);

  if (plank1) t1.to(plank1.scale, { x: 1, z: 1 });
  if (plank2) t1.to(plank2.scale, { x: 1, y: 1, z: 1 }, "-=0.5");

  if (workBtn) t1.to(workBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
  if (aboutBtn) t1.to(aboutBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
  if (contactBtn) (t1.to(contactBtn.scale, { x: 1, y: 1, z: 1 }), "-=0.6");

  // ================= TIMELINE 2 (SOCIALS / BOBA) =================
  const t2 = gsap.timeline({
    defaults: { duration: 0.8, ease: "back.out(1.8)" },
    delay: 0.25, // starts slightly after t1
  });

  if (boba) t2.to(boba.scale, { x: 1, y: 1, z: 1, delay: 0.4 }, "-=0.5");
  if (github) t2.to(github.scale, { x: 1, y: 1, z: 1 }, "-=0.5");
  if (linkedin) t2.to(linkedin.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
  if (insta) t2.to(insta.scale, { x: 1, y: 1, z: 1 }, "-=0.6");

  // ================= SETTLE BACK (FOR BOTH) =================
  t2.eventCallback("onComplete", settleBackToInitial);
}

function settleBackToInitial() {
  [
    plank1,
    plank2,
    workBtn,
    aboutBtn,
    contactBtn,
    boba,
    github,
    linkedin,
    insta,
  ].forEach((obj) => {
    if (!obj || !obj.userData.initialScale) return;

    gsap.to(obj.scale, {
      x: obj.userData.initialScale.x,
      y: obj.userData.initialScale.y,
      z: obj.userData.initialScale.z,
      duration: 0.35,
      ease: "power2.out",
    });
  });
}

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

function playHoverAnimation(object, isHovering) {
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * 1.2,
      y: object.userData.initialScale.y * 1.2,
      z: object.userData.initialScale.z * 1.2,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });

    gsap.to(object.rotation, {
      y: object.userData.initialRotation.y + Math.PI / 8,
      duration: 0.5,
      ease: "bounce.out(1.8)",
    });
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    });

    gsap.to(object.rotation, {
      y: object.userData.initialRotation.y,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    });
  }
}
/* ================= ANIMATE ================= */
const render = () => {
  controls.update();

  controls.target.clamp(targetMin, targetMax);

  // Clamp camera position
  camera.position.clamp(cameraMin, cameraMax);

  yAxisFans.forEach((fan) => {
    fan.rotation.y += 0.08;
  });

  xAxisFans.forEach((fan) => {
    fan.rotation.x += 0.08;
  });

  if (!isModelOpen) {
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(raycasterObject, true);

    if (currentIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;

      if (currentIntersectObject.name.includes("Hover")) {
        if (currentIntersectObject !== currentHoveredObject) {
          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false);
          }

          playHoverAnimation(currentIntersectObject, true);
          currentHoveredObject = currentIntersectObject;
        }
      }

      if (currentIntersectObject.name.includes("Pointer")) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false);
        currentHoveredObject = null;
      }
      document.body.style.cursor = "default";
    }
  }
  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();

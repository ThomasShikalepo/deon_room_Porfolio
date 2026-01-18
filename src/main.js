import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
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

const showModel = (model) => {
  model.style.display = "block";

  gsap.set(model, { opacity: 0 });

  gsap.to(model, {
    opacity: 1,
    duration: 0.5,
  });
};

const hideModel = (model) => {
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
    event.preventDefault();
    pointer.x = (event.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(event.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false },
);

window.addEventListener(
  "touchend",
  (event) => {
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
  6.457151867306472,
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
      if (!child.isMesh) return;

      if (child.name.includes("Pointer")) {
        raycasterObject.push(child);
      }

      if (child.name.includes("Hover")) {
        child.userData.initialScale = child.scale.clone();
        child.userData.initialPosition = child.position.clone();
        child.userData.initialRotation = child.rotation.clone();
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
  },
  undefined,
  (error) => console.error("Error loading GLB:", error),
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

  yAxisFans.forEach((fan) => {
    fan.rotation.y += 0.08;
  });

  xAxisFans.forEach((fan) => {
    fan.rotation.x += 0.08;
  });

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

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();

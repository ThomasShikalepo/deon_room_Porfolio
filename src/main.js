import "./style.scss";

import { Howl } from "howler";

import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

import smokeVertexShader from "./shaders/smoke/vertex.glsl";
import smokeFragmentShader from "./shaders/smoke/fragment.glsl";

const canvas = document.querySelector("#experience-canvas");

/* ================= SCENE ================= */
const scene = new THREE.Scene();

const xAxisFans = [];
const yAxisFans = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const raycasterObject = [];
let currentIntersects = [];
let keyboardKeys = [];
let chairTop;
let nameLatters = [];
let hourHand;
let minuteHand;

let sofa = [];
let plants = [];
let pictureFrames = [];
let pillows = [];
const overlay = document.querySelector(".overlay");
const BACKGROUND_MUSIC_VOLUME = 1;
const textureLoader = new THREE.TextureLoader();

const screens = {
  Computer_Screen: "/texture/video/monitor_screen.webm",
  Laptop_Screen: "/texture/video/blender.webm",
  Tap_Screen: "/texture/video/tablet.mp4",
  Phone_Screen: "/texture/video/phone.mp4",
  TV_Screen: "/texture/video/.mp4",
};

const useOriginalMeshObjects = [
  "Frame",
  "Plant",
  "Pillow",
  "Slipper",
  "Headphones",
  "Art_book",
  "Strees_Lamp",
];
const hitboxToObjectMap = new Map();

const backgroundMusic = new Howl({
  src: ["/audio/music/song.ogg"],
  loop: true,
  volume: 0.5,
});

let isMuted = false;

const buttonSounds = {
  click: new Howl({
    src: ["/audio/click/bubble.ogg"],
    preload: true,
    volume: 0.5,
  }),
};

let workBtn, aboutBtn, contactBtn, github, linkedin, insta;

let currentHoveredObject = null;

const model = {
  work: document.querySelector(".model.work"),
  about: document.querySelector(".model.about"),
  contact: document.querySelector(".model.contact"),
};

let touchHappened = false;
overlay.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    const model = document.querySelector('.model[style*="display: block"]');
    if (model) hideModel(model);
  },
  { passive: false },
);
let objectsWithIntroAnimations = [];
const muteToggleButton = document.querySelector(".mute-toggle-button");

document.querySelectorAll(".model-exit-button").forEach((button) => {
  function handleModelExit(e) {
    e.preventDefault();
    const modal = e.target.closest(".model");

    gsap.to(button, {
      scale: 5,
      duration: 0.5,
      ease: "back.out(2)",
      onStart: () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.set(button, {
              clearProps: "all",
            });
          },
        });
      },
    });

    buttonSounds.click.play();
    hideModel(modal);
  }

  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      handleModelExit(e);
    },
    { passive: false },
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      handleModelExit(e);
    },
    { passive: false },
  );
});

let isModelOpen = true;

const showModel = (modal) => {
  modal.style.display = "block";
  overlay.style.display = "block";

  isModelOpen = true;
  controls.enabled = false;

  if (currentHoveredObject) {
    playHoverAnimation(currentHoveredObject, false);
    currentHoveredObject = null;
  }
  document.body.style.cursor = "default";
  currentIntersects = [];

  gsap.set(modal, {
    opacity: 0,
    scale: 0,
  });
  gsap.set(overlay, {
    opacity: 0,
  });

  gsap.to(overlay, {
    opacity: 1,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: "back.out(2)",
  });
  buttonSounds.click.play();
};

const hideModel = (model) => {
  isModelOpen = false;
  controls.enabled = true;

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
  });

  gsap.to(model, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.in(2)",
    onComplete: () => {
      model.style.display = "none";
      overlay.style.display = "none";
    },
  });
};

// Smoke Shader setup
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(0.33, 1, 0.33);

const perlinTexture = textureLoader.load("/shaders/perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

const smokeMaterial = new THREE.ShaderMaterial({
  vertexShader: smokeVertexShader,
  fragmentShader: smokeFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPerlinTexture: new THREE.Uniform(perlinTexture),
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smoke.position.y = 1.83;
smoke.rotation.y = Math.PI / 2;
smoke.renderOrder = 10;

/* ================= SIZES ================= */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const soundOffSvg = document.querySelector(".sound-off-svg");
const soundOnSvg = document.querySelector(".sound-on-svg");

const updateMutedState = (muted) => {
  if (muted) {
    backgroundMusic.volume(0);
    buttonSounds.click.mute(muted);
  } else {
    backgroundMusic.volume(BACKGROUND_MUSIC_VOLUME);
  }

  buttonSounds.click.mute(muted);
};

const handleMuteToggle = (e) => {
  e.preventDefault();

  isMuted = !isMuted;
  updateMutedState(isMuted);
  buttonSounds.click.play();

  if (!backgroundMusic.playing()) {
    backgroundMusic.play();
  }

  gsap.to(muteToggleButton, {
    rotate: -45,
    scale: 5,
    duration: 0.5,
    ease: "back.out(2)",
    onStart: () => {
      if (!isMuted) {
        soundOffSvg.style.display = "none";
        soundOnSvg.style.display = "block";
      } else {
        soundOnSvg.style.display = "none";
        soundOffSvg.style.display = "block";
      }

      gsap.to(muteToggleButton, {
        rotate: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.set(muteToggleButton, {
            clearProps: "all",
          });
        },
      });
    },
  });
};

muteToggleButton.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    handleMuteToggle(e);
  },
  { passive: false },
);

muteToggleButton.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    handleMuteToggle(e);
  },
  { passive: false },
);

const socialLinks = {
  GitHub: "https://github.com/ThomasShikalepo",
  LinkedIn: "https://www.linkedin.com/in/thomas-shikalepo",
  Instagram: "https://www.instagram.com/thomas__deon/",
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

// Loadig Screen & Intro Animation

const manager = new THREE.LoadingManager();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-button");
const noSoundButton = document.querySelector(".no-sound-button");
const loadingMiffy = document.querySelector(".loading-miffy");

manager.onLoad = function () {
  loadingMiffy.style.display = "none";
  loadingScreenButton.style.border = "8px solid #414833";
  loadingScreenButton.style.background = "#656D4A";
  loadingScreenButton.style.color = "#e6dede";
  loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
  loadingScreenButton.textContent = "Enter!";
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  noSoundButton.textContent = "Enter without Sound :(";

  function handleEnter(withSound = true) {
    if (isDisabled) return;

    noSoundButton.textContent = "";
    loadingScreenButton.style.cursor = "default";
    loadingScreenButton.style.border = "8px solid #414833";
    loadingScreenButton.style.background = "#656D4A";
    loadingScreenButton.style.color = "#e6dede";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "~ Hellow ~";
    loadingScreen.style.background = "#656D4A";
    isDisabled = true;

    if (!withSound) {
      isMuted = true;
      updateMutedState(true);

      soundOnSvg.style.display = "none";
      soundOffSvg.style.display = "block";
    } else {
      backgroundMusic.play();
    }

    playReveal();
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(true);
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });

  noSoundButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter(false);
  });
};

function playReveal() {
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        isModelOpen = false;
        playIntroAnimation();
        loadingScreen.remove();
      },
    },
    "-=0.1",
  );
}

function handleRaycasterInteractions() {
  if (currentIntersects.length > 0) {
    const hitbox = currentIntersects[0].object;
    const object = hitboxToObjectMap.get(hitbox) || hitbox;

    if (!object) return;

    if (object.name.includes("Button")) {
      buttonSounds.click.play();
    }
    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });

    if (object.name.includes("Work_Button")) showModel(model.work);
    else if (object.name.includes("About__Button")) showModel(model.about);
    else if (object.name.includes("Contact_Button")) showModel(model.contact);
  }
}

window.addEventListener("click", handleRaycasterInteractions);
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000,
);

/* ================= RENDERER ================= */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* ================= CONTROLS ================= */
const controls = new OrbitControls(camera, renderer.domElement);

controls.minDistance = 5;
controls.maxDistance = 45;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.update();

/* ================= CAMERA ================= */

if (window.innerWidth > 768) {
  camera.position.set(
    15.961815961949501,
    12.09745458326452,
    12.868349009006998,
  );
  controls.target.set(
    -23.325196944217364,
    -15.396531237148738,
    -22.5677637643661,
  );
} else {
  camera.position.set(
    14.21246070016042,
    21.534818660970846,
    50.773592794520795,
  );
  controls.target.set(
    -5.561447882288654,
    -9.900617778667879,
    -29.45987324666294,
  );
}

/* ================= LIGHT ================= */
scene.add(new THREE.AmbientLight(0xffffff, 2));
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const videoElements = [];

Object.entries(screens).forEach(([screensName, videoPath]) => {
  const video = document.createElement("video");
  video.src = videoPath;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;

  video.play().catch(() => {});

  const texture = new THREE.VideoTexture(video);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  videoElements[screensName] = texture;
});

/* ================= LOADERS ================= */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader(manager);
gltfLoader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("/texture/skybox")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

function collectIntroObjects() {
  objectsWithIntroAnimations = [
    workBtn,
    aboutBtn,
    contactBtn,
    github,
    linkedin,
    insta,
    ...keyboardKeys,
    ...nameLatters,
    ...plants,
    ...sofa,
    ...pillows,
    ...pictureFrames,
  ].filter(Boolean);
}

/* ================= LOAD GLB ================= */
gltfLoader.load("/model/room-v1.glb", (glb) => {
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

    if (child.name.includes("Chair_Top")) {
      chairTop = child;
      child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
    }

    if (child.name.includes("Hour_Hand")) {
      hourHand = child;
      child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
    }

    if (child.name.includes("Minute_Hand")) {
      minuteHand = child;
      child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
    }

    if (child.name.includes("Coffee")) {
      child.add(smoke); // 🔥 parent smoke to mug
      smoke.position.set(0, 0.2, 0); // local offset above mug

      raycasterObject.push(child);
      hitboxToObjectMap.set(child, child);
    }

    if (child.name.includes("My_Work_Button")) {
      workBtn = child;
      child.scale.set(0, 0, 0);
    } else if (child.name.includes("About__Button")) {
      aboutBtn = child;
      child.scale.set(0, 0, 0);
    } else if (child.name.includes("Contact_Button")) {
      contactBtn = child;
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
    } else if (child.name.includes("Keycaps")) {
      keyboardKeys.push(child);
      child.scale.set(0, 0, 0);
    }

    if (child.name.includes("Screen")) {
      const screenVideoTexture = videoElements[child.name];
      if (!screenVideoTexture) return;

      child.material = new THREE.MeshStandardMaterial({
        map: screenVideoTexture,
        roughness: 0.5,
        metalness: 0,
      });
    }

    if (child.name.includes("Glass")) {
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        envMap: environmentMap,
      });
    }

    if (child.name.includes("Name_Letter")) {
      nameLatters.push(child);
      child.scale.set(0, 0, 0);

      raycasterObject.push(child);
      hitboxToObjectMap.set(child, child);
    }

    if (child.name.includes("Plant")) {
      plants.push(child);
      child.scale.set(0, 0, 0);
    }

    if (child.name.includes("Sofa")) {
      sofa.push(child);
      child.scale.set(0, 0, 0);

      raycasterObject.push(child);
      hitboxToObjectMap.set(child, child);
    }

    if (child.name.includes("Pillow")) {
      pillows.push(child);
      child.scale.set(0, 0, 0);
    }
    if (child.name.includes("Frame")) {
      pictureFrames.push(child);
      child.scale.set(0, 0, 0);
    }

    if (child.name.includes("FAN")) {
      if (
        child.name.includes("1") ||
        child.name.includes("2") ||
        child.name.includes("3")
      ) {
        xAxisFans.push(child);
      } else {
        yAxisFans.push(child);
      }
    }

    if (child.name.includes("Raycaster")) {
      const raycastObject = createStaticHitbox(child);

      if (raycastObject !== child) {
        scene.add(raycastObject);
        raycasterObject.push(raycastObject);
        hitboxToObjectMap.set(raycastObject, child); // crucial
      } else {
        raycasterObject.push(child);
        hitboxToObjectMap.set(child, child);
      }
    }
  });

  collectIntroObjects();

  // /* ================= CENTER MODEL ================= */
  // const box = new THREE.Box3().setFromObject(glb.scene);
  // const center = box.getCenter(new THREE.Vector3());
  // glb.scene.position.sub(center);

  scene.add(glb.scene);
});

function shouldUseOriginalMesh(objectName) {
  return useOriginalMeshObjects.some((meshName) =>
    objectName.includes(meshName),
  );
}

function createStaticHitbox(originalObject) {
  // Check if we should use original mesh
  if (shouldUseOriginalMesh(originalObject.name)) {
    if (!originalObject.userData.initialScale) {
      originalObject.userData.initialScale = new THREE.Vector3().copy(
        originalObject.scale,
      );
    }
    if (!originalObject.userData.initialPosition) {
      originalObject.userData.initialPosition = new THREE.Vector3().copy(
        originalObject.position,
      );
    }
    if (!originalObject.userData.initialRotation) {
      originalObject.userData.initialRotation = new THREE.Euler().copy(
        originalObject.rotation,
      );
    }

    originalObject.userData.originalObject = originalObject;
    return originalObject;
  }

  if (!originalObject.userData.initialScale) {
    originalObject.userData.initialScale = new THREE.Vector3().copy(
      originalObject.scale,
    );
  }
  if (!originalObject.userData.initialPosition) {
    originalObject.userData.initialPosition = new THREE.Vector3().copy(
      originalObject.position,
    );
  }
  if (!originalObject.userData.initialRotation) {
    originalObject.userData.initialRotation = new THREE.Euler().copy(
      originalObject.rotation,
    );
  }

  const currentScale = originalObject.scale.clone();
  const hasZeroScale =
    currentScale.x === 0 || currentScale.y === 0 || currentScale.z === 0;

  if (hasZeroScale && originalObject.userData.originalScale) {
    originalObject.scale.copy(originalObject.userData.originalScale);
  }

  const box = new THREE.Box3().setFromObject(originalObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  if (hasZeroScale) {
    originalObject.scale.copy(currentScale);
  }

  let hitboxGeometry;
  let sizeMultiplier = { x: 1.1, y: 1.75, z: 1.1 };

  hitboxGeometry = new THREE.BoxGeometry(
    size.x * sizeMultiplier.x,
    size.y * sizeMultiplier.y,
    size.z * sizeMultiplier.z,
  );

  const hitboxMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    visible: false,
  });

  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.copy(center);
  hitbox.name = originalObject.name + "_Hitbox";
  hitbox.userData.originalObject = originalObject;

  if (originalObject.name.includes("Headphones")) {
    hitbox.rotation.x = 0;
    hitbox.rotation.y = Math.PI / 4;
    hitbox.rotation.z = 0;
  }
  return hitbox;
}

function playIntroAnimation() {
  const master = gsap.timeline();

  // ================= UI =================
  const uiTL = gsap.timeline({
    defaults: { duration: 0.8, ease: "back.out(1.8)" },
  });

  uiTL.timeScale(0.8);

  if (workBtn) uiTL.to(workBtn.scale, { x: 1, y: 1, z: 1 }, 0);
  if (aboutBtn) uiTL.to(aboutBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
  if (contactBtn) uiTL.to(contactBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");

  // ================= SOCIALS =================
  const socialsTL = gsap.timeline({
    defaults: { duration: 0.8, ease: "back.out(1.8)" },
  });

  if (github) socialsTL.to(github.scale, { x: 1, y: 1, z: 1 }, 0);
  if (linkedin) socialsTL.to(linkedin.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
  if (insta) socialsTL.to(insta.scale, { x: 1, y: 1, z: 1 }, "-=0.6");

  // ================= KEYBOARD (explicit!) =================
  const keyboardTL = gsap.timeline({
    defaults: { duration: 0.6, ease: "back.out(2)" },
  });

  if (keyboardKeys.length) {
    keyboardTL.to(
      keyboardKeys.map((key) => key.scale),
      {
        x: 1,
        y: 1,
        z: 1,
        stagger: 0.03,
      },
    );
  }

  // ================= NAME LETTERS =================
  const nameTL = gsap.timeline({
    defaults: { duration: 0.6, ease: "back.out(2)" },
  });

  if (nameLatters.length) {
    nameTL.to(
      nameLatters.map((letter) => letter.scale),
      {
        x: 1,
        y: 1,
        z: 1,
        stagger: 0.1,
      },
    );
  }

  // ================= SCENE OBJECTS =================
  const sceneTL = gsap.timeline({
    defaults: { duration: 0.6, ease: "back.out(2)" },
  });

  const sceneItems = [...plants, ...sofa, ...pillows, ...pictureFrames];

  if (sceneItems.length) {
    sceneTL.to(
      sceneItems.map((obj) => obj.scale),
      {
        x: 1,
        y: 1,
        z: 1,
        stagger: 0.06,
      },
    );
  }

  // ================= MASTER =================
  master
    .add(sceneTL) // 👈 FIRST
    .add(uiTL, "-=0.3")
    .add(socialsTL, "-=0.3")
    .add(keyboardTL, "-=0.2")
    .add(nameTL, "-=0.4");
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

function playHoverAnimation(objectHitbox, isHovering) {
  const object = hitboxToObjectMap.get(objectHitbox) || objectHitbox; // fallback
  if (!object) return; // safety check
  let scale = 1.4;

  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (object.name.includes("Coffee") && typeof smoke !== "undefined") {
    gsap.killTweensOf(smoke.scale);
    if (isHovering) {
      gsap.to(smoke.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.5,
        ease: "back.out(2)",
      });
    } else {
      gsap.to(smoke.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }

  if (isHovering) {
    // Scale animation
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scale,
      y: object.userData.initialScale.y * scale,
      z: object.userData.initialScale.z * scale,
      duration: 0.5,
      ease: "back.out(2)",
    });

    if (
      object.name.includes("GitHub") ||
      object.name.includes("LinkedIn") ||
      object.name.includes("Instagram")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 10,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y + 0.2,
        duration: 0.5,
        ease: "back.out(2)",
      });
    }
  } else {
    // Reset scale
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "back.out(2)",
    });

    if (
      object.name.includes("About_Button") ||
      object.name.includes("Contact_Button") ||
      object.name.includes("My_Work_Button") ||
      object.name.includes("GitHub") ||
      object.name.includes("LinkedIn") ||
      object.name.includes("Instagram")
    ) {
      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }

    if (object.name.includes("Name_Letter")) {
      gsap.to(object.position, {
        y: object.userData.initialPosition.y,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  }
}

const clock = new THREE.Clock();

const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);
  const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

  minuteHand.rotation.y = -minuteAngle;
  hourHand.rotation.y = -hourAngle;
};

/* ================= ANIMATE ================= */
const render = (timestamp) => {
  const elapsedTime = clock.getElapsedTime();

  // Update Shader Univform
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  //Update Orbit Controls
  controls.update();

  // Update Clock hand rotation
  updateClockHands();

  xAxisFans.forEach((fan) => {
    fan.rotation.x += 0.08;
  });

  yAxisFans.forEach((fan) => {
    fan.rotation.y += 0.08;
  });

  // chair Animation
  if (chairTop) {
    const time = timestamp * 0.001;
    const baseAmplitude = Math.PI / 8;

    const rotationOffset =
      baseAmplitude *
      Math.sin(time * 1.0) *
      (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);

    chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
  }

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

  // console.log(camera.position);
  // console.log("##########################");
  // console.log(controls.target);

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();

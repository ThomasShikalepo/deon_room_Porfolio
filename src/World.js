import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

export default class World {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.yAxisFans = [];
    this.xAxisFans = [];
    this.raycasterObject = [];

    this.plank1 = null;
    this.plank2 = null;
    this.workBtn = null;
    this.aboutBtn = null;
    this.contactBtn = null;
    this.boba = null;
    this.github = null;
    this.linkedin = null;
    this.insta = null;

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.sizes.width / this.sizes.height,
      0.1,
      1000,
    );
    this.camera.position.set(-7, -8.5, 11.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(-2.2, -10.3, 6.45);
    this.controls.update();

    this.targetMin = new THREE.Vector3(-3, -12, 4);
    this.targetMax = new THREE.Vector3(1, -8, 8);
    this.cameraMin = new THREE.Vector3(-8, -16, 4);
    this.cameraMax = new THREE.Vector3(2, -6, 16);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    const video = document.createElement("video");
    video.src = "/texture/video/Screen.mp4";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(() => {});

    this.videoTexture = new THREE.VideoTexture(video);
    this.videoTexture.flipY = false;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.environmentMap = new THREE.CubeTextureLoader()
      .setPath("/texture/skybox")
      .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

    this.loadModel();
    window.addEventListener("resize", this.resize);
  }

  loadModel() {
    this.gltfLoader.load("/model/wosh-v1.glb", (glb) => {
      glb.scene.traverse((child) => {
        if (!child.isMesh) return;

        if (child.name.includes("Pointer")) {
          this.raycasterObject.push(child);
        }

        if (child.name.includes("Hover")) {
          child.userData.initialScale = child.scale.clone();
          child.userData.initialPosition = child.position.clone();
          child.userData.initialRotation = child.rotation.clone();
        }

        if (child.name.includes("Hanging_Plank_1")) {
          this.plank1 = child;
          child.scale.set(0, 0, 1);
        } else if (child.name.includes("Hanging_Plank_2")) {
          this.plank2 = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("My_Work_Button")) {
          this.workBtn = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("About_Button")) {
          this.aboutBtn = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("Contact_Button")) {
          this.contactBtn = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("Boba_Plushie_Fourth_Raycaster_Hover")) {
          this.boba = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("GitHub")) {
          this.github = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("LinkedIn")) {
          this.linkedin = child;
          child.scale.set(0, 0, 0);
        } else if (child.name.includes("Instagram")) {
          this.insta = child;
          child.scale.set(0, 0, 0);
        }

        if (child.name === "computer_Screen") {
          child.material = new THREE.MeshStandardMaterial({
            map: this.videoTexture,
            roughness: 0.5,
            metalness: 0,
          });
        }

        if (child.name.includes("Computer_Glass")) {
          child.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            opacity: 1,
            metalness: 0,
            envMap: this.environmentMap,
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
            this.yAxisFans.push(child);
          } else {
            this.xAxisFans.push(child);
          }
        }
      });

      const box = new THREE.Box3().setFromObject(glb.scene);
      const center = box.getCenter(new THREE.Vector3());
      glb.scene.position.sub(center);

      this.scene.add(glb.scene);
      setTimeout(() => this.playIntroAnimation(), 100);
    });
  }

  playIntroAnimation() {
    const t1 = gsap.timeline({
      defaults: { duration: 0.8, ease: "back.out(1.8)" },
    });

    t1.timeScale(0.8);

    if (this.plank1) t1.to(this.plank1.scale, { x: 1, z: 1 });
    if (this.plank2) t1.to(this.plank2.scale, { x: 1, y: 1, z: 1 }, "-=0.5");

    if (this.workBtn) t1.to(this.workBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
    if (this.aboutBtn)
      t1.to(this.aboutBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
    if (this.contactBtn)
      t1.to(this.contactBtn.scale, { x: 1, y: 1, z: 1 }, "-=0.6");

    const t2 = gsap.timeline({
      defaults: { duration: 0.8, ease: "back.out(1.8)" },
      delay: 0.25,
    });

    if (this.boba)
      t2.to(this.boba.scale, { x: 1, y: 1, z: 1, delay: 0.4 }, "-=0.5");
    if (this.github) t2.to(this.github.scale, { x: 1, y: 1, z: 1 }, "-=0.5");
    if (this.linkedin)
      t2.to(this.linkedin.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
    if (this.insta) t2.to(this.insta.scale, { x: 1, y: 1, z: 1 }, "-=0.6");

    t2.eventCallback("onComplete", () => this.settleBackToInitial());
  }

  settleBackToInitial() {
    [
      this.plank1,
      this.plank2,
      this.workBtn,
      this.aboutBtn,
      this.contactBtn,
      this.boba,
      this.github,
      this.linkedin,
      this.insta,
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

  resize = () => {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  update() {
    this.controls.update();
    this.controls.target.clamp(this.targetMin, this.targetMax);
    this.camera.position.clamp(this.cameraMin, this.cameraMax);

    this.yAxisFans.forEach((fan) => (fan.rotation.y += 0.08));
    this.xAxisFans.forEach((fan) => (fan.rotation.x += 0.08));
  }
}

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
    this.buttons = [];
    this.icons = [];

    this.frames = [];

    this.headPhone = null;
    this.flowers = [];
    this.tableLamp = null;
    this.boxs = [];
    this.totoro = null;
    this.flowerBusket = null;
    this.pets = [];
    this.calender = null;

    this.mic = null;
    this.slipper_1 = null;
    this.slipper_2 = null;
    this.keyboardKeys = [];
    this.coffee = null;
    this.lightBulb = [];
    this.rug = null;

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
    this.gltfLoader.load("/model/room.glb", (glb) => {
      glb.scene.traverse((child) => {
        if (!child.isMesh) return;
        if (child.isMesh && child.name.includes("Keyboard")) {
          console.log("FOUND:", child.name);
        }

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
        }

        if (
          child.name.includes("_Button") &&
          (child.name.includes("My_Work") ||
            child.name.includes("About") ||
            child.name.includes("Contact"))
        ) {
          this.buttons.push(child);
          child.scale.set(0, 0, 0);
        }

        if (
          child.name.includes("GitHub") ||
          child.name.includes("LinkedIn") ||
          child.name.includes("Instagram") ||
          child.name.includes("Boba")
        ) {
          this.icons.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Basket")) {
          this.flowerBusket = child;
          child.scale.set(0, 0, 0);
        }
        if (child.name.includes("Coffee")) {
          this.coffee = child;
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Totoro")) {
          this.totoro = child;
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Calender")) {
          this.calender = child;
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Microphone")) {
          this.mic = child;
          child.scale.set(0, 0, 0);
        }

        if (child.name.startsWith("Frame_") && child.name.includes("_Second")) {
          this.frames.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Slipper_1")) {
          this.slipper_1 = child;
          child.scale.set(0, 0, 0);
          console.log("Frame 2 loaded:", this.frame2);
        }
        if (child.name.includes("Slipper_2")) {
          this.slipper_2 = child;
          child.scale.set(0, 0, 0);
        }
        if (child.name.includes("Headphones")) {
          this.headPhone = child;
          child.scale.set(0, 0, 0);
        }
        if (child.name.includes("TableLamp")) {
          this.tableLamp = child;
          child.scale.set(0, 0, 0);
        }
        if (child.name.includes("Flower")) {
          this.flowers.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("MrRabbit_")) {
          this.pets.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.startsWith("Keyboard_")) {
          this.keyboardKeys.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.startsWith("Box_")) {
          this.boxs.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Bulb")) {
          this.lightBulb.push(child);
          child.scale.set(0, 0, 0);
        }

        if (child.name.includes("Rug")) {
          this.rug = child;
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
      // 🔑 KEYBOARD — FIX STRING SORT ORDER
      this.keyboardKeys.sort((a, b) => {
        const aNum = parseInt(a.name.match(/\d+/)[0]);
        const bNum = parseInt(b.name.match(/\d+/)[0]);
        return aNum - bNum;
      });

      this.buttons.sort((a, b) => {
        const order = ["My_Work", "About", "Contact"];

        const aIndex = order.findIndex((k) => a.name.includes(k));
        const bIndex = order.findIndex((k) => b.name.includes(k));

        return aIndex - bIndex;
      });

      this.lightBulb.sort((a, b) => {
        const aNum = parseInt(a.name.match(/\d+/)[0]);
        const bNum = parseInt(b.name.match(/\d+/)[0]);
        return aNum - bNum;
      });

      setTimeout(() => this.playIntroAnimation(), 100);
    });
  }

  playIntroAnimation() {
    const timeline = gsap.timeline({
      defaults: { duration: 0.8, ease: "back.out(1.8)" },
    });

    timeline.timeScale(0.8);

    // 🔹 Planks
    if (this.plank1) timeline.to(this.plank1.scale, { x: 1, z: 1 });
    if (this.plank2)
      timeline.to(this.plank2.scale, { x: 1, y: 1, z: 1 }, "-=0.5");

    // 🔹 Buttons (staggered)
    if (this.buttons.length) {
      timeline.to(
        this.buttons.map((b) => b.scale),
        {
          x: 1,
          y: 1,
          z: 1,
          stagger: { each: 0.2 },
          duration: 0.9,
          ease: "back.out(1.8)",
        },
        "-=0.2",
      );
    }

    // 🔹 Coffee and Rug
    if (this.coffee)
      timeline.to(this.coffee.scale, { x: 1, y: 1, z: 1 }, "-=0.6");
    if (this.rug) timeline.to(this.rug.scale, { x: 1, y: 1, z: 1 }, "-=0.6");

    // 🔹 Icons (staggered)
    if (this.icons.length) {
      timeline.to(
        this.icons.map((i) => i.scale),
        {
          x: 1,
          y: 1,
          z: 1,
          stagger: { each: 0.25 },
          duration: 0.7,
          ease: "back.out(1.6)",
        },
        "-=0.1",
      );
    }

    // 🔹 Frames (staggered)
    if (this.frames.length) {
      timeline.to(
        this.frames.map((f) => f.scale),
        {
          x: 1,
          y: 1,
          z: 1,
          stagger: { each: 0.1 },
          ease: "back.out(2)",
        },
        "-=0.2",
      );
    }

    // 🔹 Slippers, Headphones, Lamp, Totoro, Mic, Calendar (single objects)
    const others = [
      this.slipper_1,
      this.slipper_2,
      this.headPhone,
      this.tableLamp,
      this.totoro,
      this.mic,
      this.calender,
    ].filter(Boolean);
    if (others.length) {
      timeline.to(
        others.map((o) => o.scale),
        { x: 1, y: 1, z: 1, stagger: { each: 0.1 } },
        "-=0.3",
      );
    }

    // 🔹 Keyboard keys (staggered fast)
    if (this.keyboardKeys.length) {
      timeline.to(
        this.keyboardKeys.map((k) => k.scale),
        { x: 1, y: 1, z: 1, stagger: { each: 0.03 }, ease: "back.out(2)" },
        "-=0.2",
      );
    }

    // 🔹 Boxes, Flowers, Pets, (staggered)
    const groupedObjects = [this.boxs, this.flowers, this.pets];
    groupedObjects.forEach((arr) => {
      if (arr.length) {
        timeline.to(
          arr.map((o) => o.scale),
          {
            x: 1,
            y: 1,
            z: 1,
            stagger: { each: 0.03, from: "start" },
            ease: "back.out(2)",
          },
        );
      }
    });

    // 🔹 Light bulbs (slower, 1-by-1)
    if (this.lightBulb.length) {
      timeline.to(
        this.lightBulb.map((b) => b.scale),
        {
          x: 1,
          y: 1,
          z: 1,
          stagger: { each: 0.08 },
          duration: 0.6,
          ease: "back.out(2)",
        },
        "-=0.05",
      );
    }
  }

  resize = () => {
    this.sizes.width = window.innerWidth;
    SVGAElement;
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

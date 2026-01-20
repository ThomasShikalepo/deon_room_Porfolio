import * as THREE from "three";
import gsap from "gsap";

export default class Interactions {
  constructor(world) {
    this.world = world;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.currentIntersects = [];
    this.currentHoveredObject = null;
    this.isModelOpen = false;

    this.socialLinks = {
      GitHub: "https://github.com/ThomasShikalepo",
      LinkedIn: "https://www.linkedin.com/in/thomas-shikalepo",
      Instagrem: "https://www.instagram.com/thomas__deon/",
    };

    window.addEventListener("mousemove", (e) => {
      this.pointer.x = (e.clientX / this.world.sizes.width) * 2 - 1;
      this.pointer.y = -(e.clientY / this.world.sizes.height) * 2 + 1;
    });

    window.addEventListener("click", () => this.handleRaycasterInteractions());
  }

  handleRaycasterInteractions() {
    if (this.currentIntersects.length > 0) {
      const object = this.currentIntersects[0].object;

      Object.entries(this.socialLinks).forEach(([key, url]) => {
        if (object.name.includes(key)) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      });
    }
  }

  playHoverAnimation(object, isHovering) {
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

  update() {
    if (!this.isModelOpen) {
      this.raycaster.setFromCamera(this.pointer, this.world.camera);
      this.currentIntersects = this.raycaster.intersectObjects(
        this.world.raycasterObject,
        true,
      );

      if (this.currentIntersects.length > 0) {
        const currentIntersectObject = this.currentIntersects[0].object;

        if (currentIntersectObject.name.includes("Hover")) {
          if (currentIntersectObject !== this.currentHoveredObject) {
            if (this.currentHoveredObject) {
              this.playHoverAnimation(this.currentHoveredObject, false);
            }
            this.playHoverAnimation(currentIntersectObject, true);
            this.currentHoveredObject = currentIntersectObject;
          }
        }

        if (currentIntersectObject.name.includes("Pointer")) {
          document.body.style.cursor = "pointer";
        } else {
          document.body.style.cursor = "default";
        }
      } else {
        if (this.currentHoveredObject) {
          this.playHoverAnimation(this.currentHoveredObject, false);
          this.currentHoveredObject = null;
        }
        document.body.style.cursor = "default";
      }
    }
  }
}

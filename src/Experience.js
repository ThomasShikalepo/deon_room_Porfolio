import World from "./World.js";
import Interactions from "./Interactions.js";

export default class Experience {
  constructor() {
    this.canvas = document.querySelector("#experience-canvas");

    this.world = new World(this.canvas);
    this.interactions = new Interactions(this.world);

    this.render();
  }

  render = () => {
    this.world.update();
    this.interactions.update();

    this.world.renderer.render(this.world.scene, this.world.camera);
    requestAnimationFrame(this.render);
  };
}

import { Vector3 } from "three";

export default class Player {
    mesh = null;
    engine = null;

    currentMovement = new Vector3();

    position = null;
    velocity = new Vector3();
    acceleration = new Vector3();

    constructor(mesh, engine) {
        this.mesh = mesh;
        this.engine = engine;
        this.position = mesh.position.clone();

        this.addEvents();
    }

    addEvents() {
        document.addEventListener("keydown", ({ code }) => {
            switch (code) {
                case "KeyW":
                case "ArrowUp":
                    // this.currentMovement.x = 1;
                    this.acceleration.x = 1;
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.acceleration.x = -1;
                    // this.targetPosition.z += 0.05;
                    break;

                default:
                    break;
            }
        });

        const update = () => {
            this.acceleration.normalize();
            this.acceleration.multiplyScalar(0.01);
            this.velocity.add(this.acceleration);
            this.velocity.clampScalar(0, 0.01);
            this.position.add(this.velocity);

            // Apply
            this.mesh.position.copy(this.position);
        };

        this.engine.ticker.add(update);
    }

    // update(dt) {
    //     if (!this.mesh) return;
    // }
}

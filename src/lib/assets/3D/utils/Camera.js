import { PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class Camera extends PerspectiveCamera {
    controls = null;
    hasControls = false;

    constructor({
        fov = 75,
        aspect = window.innerWidth / window.innerHeight,
        min = 0.1,
        max = 1000,
        canvas,
        hasControls,
    }) {
        super(fov, aspect, min, max);

        this.position.z = 5;
        this.position.y = 1;
        this.hasControls = hasControls;

        if (canvas && this.hasControls) {
            this.controls = new OrbitControls(this, canvas);
            this.controls.enableDamping = true;
        }
    }

    resize({ w, h }) {
        this.aspect = w / h;
        this.updateProjectionMatrix();
    }

    update() {
        if (this.controls) {
            this.controls.update();
        }
    }
}

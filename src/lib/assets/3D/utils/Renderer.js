import { WebGLRenderer } from "three";

export default class Renderer extends WebGLRenderer {
    constructor(props) {
        super(props);
        this.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    resize({ w, h }) {
        this.setSize(w, h, false);
    }
}

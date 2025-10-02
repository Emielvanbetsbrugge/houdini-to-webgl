import * as THREE from "three";

import Houdini from "./assets/3D/loaders/Houdini";
import Ticker from "./assets/3D/utils/ticker";
import getUVShader from "./assets/3D/shaders/UVShader";
import Renderer from "./assets/3D/utils/Renderer";
import Camera from "./assets/3D/utils/Camera";

import World from "$lib/assets/3D/World.js";

let engine = null;

export async function create({ canvas }) {
    const loader = new Houdini();
    const ticker = new Ticker({ autoStart: true });
    const scene = new THREE.Scene();
    const camera = new Camera({ canvas, hasControls: true });
    const renderer = new Renderer({ canvas, antialias: true });

    window.addEventListener("resize", resize);
    resize();

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.resize({ w, h });
        camera.resize({ w, h });
    }

    function dispose() {
        ticker.stop();
        window.removeEventListener("resize", resize);
        renderer.dispose();
    }

    ticker.add(() => {
        if (camera.hasControls) camera.update();
        renderer.render(scene, camera);
    });

    return { renderer, scene, camera, ticker, stop, dispose, loader };
}

export async function getEngine(canvas) {
    if (engine) return engine;
    engine = await create(canvas);
    console.log(engine);

    new World(engine);
    if (import.meta.hot) {
        import.meta.hot.data.engine = engine; // persist across HMR
        import.meta.hot.accept(); // mark module as HMR-aware
    }
    return engine;
}

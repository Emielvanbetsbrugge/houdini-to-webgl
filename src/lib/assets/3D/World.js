import { Mesh } from "three";

import getUVShader from "./shaders/UVShader";
import Player from "./utils/Player";

export default class World {
    engine;
    loader;
    scene;
    constructor(engine) {
        this.engine = engine;
        this.loader = engine.loader;
        this.scene = engine.scene;
        this.init();
    }

    async init() {
        // console.log(this.engine, this.loader);
        let floor = await this.loader.loadAsGeometry("/geo/floor.hou");
        const cube = new Mesh(floor, getUVShader());
        this.scene.add(cube);

        const characterGeo =
            await this.loader.loadAsGeometry("/geo/character.hou");
        const characterMesh = new Mesh(characterGeo, getUVShader());
        new Player(characterMesh, this.engine);
        this.scene.add(characterMesh);
    }
}

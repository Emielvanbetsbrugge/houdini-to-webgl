import { DoubleSide, ShaderMaterial } from "three";

let shader = null;

const getUVShader = () => {
    if (shader) return shader;
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 color;
      uniform sampler2D map;
      uniform float opacity;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
          vec3 color = mix(vNormal, vec3(vUv, 0.0), 1.0);
          gl_FragColor = vec4(color, 1.0);
      }
    `;

    shader = new ShaderMaterial({
        uniforms: {},
        side: DoubleSide,
        vertexShader,
        fragmentShader,
    });

    return shader;
};

export default getUVShader;

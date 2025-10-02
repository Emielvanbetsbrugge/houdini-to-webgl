import * as THREE from "three";

class Houdini {
  textDecoder = new TextDecoder("utf-8");

  constructor() {}

  async load(path, { nonIndexed = true } = {}) {
    if (!path) return;
    const res = await fetch(path);
    if (!res.ok)
      throw new Error(
        `Failed to fetch ${path}: ${res.status} ${res.statusText}`,
      );
    const buffer = await res.arrayBuffer();
    return this.parse(buffer, { nonIndexed });
  }

  parse(buffer, { nonIndexed = true } = {}) {
    const view = new DataView(buffer);
    let offset = 0;

    // --- Magic (tolerant) ---
    const magicRaw = new Uint8Array(buffer, offset, 8);
    let magic = this.textDecoder.decode(magicRaw).replace(/\0/g, "").trimEnd();
    offset += 8;

    const isV2 = magic.startsWith("MYGEOv2");
    const isV3 = magic.startsWith("MYGEOv3");
    if (!isV2 && !isV3)
      throw new Error(
        `Not a MYGEO v2/v3 file (magic=${JSON.stringify(magic)})`,
      );

    // --- Header ---
    const pointCount = view.getUint32(offset, true);
    offset += 4;
    const primCount = view.getUint32(offset, true);
    offset += 4;
    const flags = view.getUint32(offset, true);
    offset += 4;
    const spaceFlag = view.getUint8(offset);
    offset += 1;
    offset += 3; // pad
    const space = spaceFlag === 1 ? "world" : "object";

    const UV_PRESENT = !!(flags & 1);
    const UV_IS_VERTEX = !!(flags & 2);

    // --- Points ---
    const points = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      points[i * 3 + 0] = view.getFloat32(offset, true);
      offset += 4;
      points[i * 3 + 1] = view.getFloat32(offset, true);
      offset += 4;
      points[i * 3 + 2] = view.getFloat32(offset, true);
      offset += 4;
    }

    // --- Prims (and optional UVs in v3) ---
    // We will produce triangles (fan) and build arrays accordingly.
    const triIndices = []; // if we go indexed
    const triPos = []; // if nonIndexed: flat positions
    const triUV = []; // if nonIndexed & v3+uvs: flat uvs

    for (let p = 0; p < primCount; p++) {
      const vcount = view.getUint32(offset, true);
      offset += 4;
      const verts = new Array(vcount);
      for (let j = 0; j < vcount; j++) {
        verts[j] = view.getUint32(offset, true);
        offset += 4;
      }

      let uvs = null;
      if (isV3 && UV_PRESENT) {
        uvs = new Array(vcount);
        for (let j = 0; j < vcount; j++) {
          const u = view.getFloat32(offset, true);
          offset += 4;
          const v = view.getFloat32(offset, true);
          offset += 4;
          uvs[j] = [u, v];
        }
      }

      // Triangulate (fan)
      for (let j = 1; j < vcount - 1; j++) {
        const a = verts[0],
          b = verts[j],
          c = verts[j + 1];

        if (nonIndexed) {
          // positions
          triPos.push(
            points[a * 3 + 0],
            points[a * 3 + 1],
            points[a * 3 + 2],
            points[b * 3 + 0],
            points[b * 3 + 1],
            points[b * 3 + 2],
            points[c * 3 + 0],
            points[c * 3 + 1],
            points[c * 3 + 2],
          );
          // uvs (if present)
          if (uvs) {
            const [ua, va] = uvs[0];
            const [ub, vb] = uvs[j];
            const [uc, vc] = uvs[j + 1];
            triUV.push(ua, va, ub, vb, uc, vc);
          }
        } else {
          // indexed positions (no UV seam splitting here)
          triIndices.push(a, b, c);
        }
      }
    }

    // Build return object
    if (nonIndexed) {
      const positions = new Float32Array(triPos);
      const result = {
        version: isV3 ? 3 : 2,
        magic,
        pointCount,
        primCount,
        flags,
        space,
        // non-indexed, one vertex per corner
        positions,
        uvs: isV3 && UV_PRESENT ? new Float32Array(triUV) : null,
        indexed: false,
      };
      return result;
    } else {
      const IndexArray = pointCount <= 0xffff ? Uint16Array : Uint32Array;
      return {
        version: isV3 ? 3 : 2,
        magic,
        pointCount,
        primCount,
        flags,
        space,
        points,
        indices: new IndexArray(triIndices),
        uvs: null, // note: not handled for indexed (needs seam splitting)
        indexed: true,
      };
    }
  }

  /**
   * Build THREE.BufferGeometry from parsed data.
   * If data.indexed === false, expects 'positions' (and optional 'uvs').
   * If data.indexed === true, expects 'points' + 'indices'.
   */
  buildGeometry(data, { computeNormals = true } = {}) {
    if (typeof THREE === "undefined") {
      throw new Error("THREE is not available in global scope.");
    }
    const geo = new THREE.BufferGeometry();

    if (data.indexed === false) {
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(data.positions, 3),
      );
      if (data.uvs) {
        geo.setAttribute("uv", new THREE.BufferAttribute(data.uvs, 2));
      }
    } else {
      geo.setAttribute("position", new THREE.BufferAttribute(data.points, 3));
      geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
      // uvs omitted in indexed path (needs seam splitting)
    }

    if (computeNormals) {
      try {
        geo.computeVertexNormals();
      } catch (_) {}
    }
    return geo;
  }

  /**
   * Convenience: load and build geometry. Defaults to non-indexed (UV-friendly).
   */
  async loadAsGeometry(
    path,
    { nonIndexed = true, computeNormals = true } = {},
  ) {
    const data = await this.load(path, { nonIndexed });
    return this.buildGeometry(data, { computeNormals });
  }
}

export default Houdini;

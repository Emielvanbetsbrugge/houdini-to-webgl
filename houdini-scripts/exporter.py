# --- MYGEO v3 exporter (positions + indices + UVs), single frame ---
import os, struct, hou

# Flags bitfield
FLAG_UV_PRESENT   = 1 << 0
FLAG_UV_IS_VERTEX = 1 << 1  # else point

def _ensure_dir(path: str):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

def _xf_point(m: hou.Matrix4, v: hou.Vector3) -> hou.Vector3:
    """Apply Matrix4 to Vector3 as a position (w=1)."""
    try:
        return m * v
    except TypeError:
        x = v[0]*m.at(0,0) + v[1]*m.at(0,1) + v[2]*m.at(0,2) + m.at(0,3)
        y = v[0]*m.at(1,0) + v[1]*m.at(1,1) + v[2]*m.at(1,2) + m.at(1,3)
        z = v[0]*m.at(2,0) + v[1]*m.at(2,1) + v[2]*m.at(2,2) + m.at(2,3)
        return hou.Vector3((x, y, z))

def export_myg_v3_pos_idx_uv(sop_path: str, file_path: str, space: str = "world"):
    """
    Write MYGEO v3 (LE) to `file_path`:
      magic[8]   = "MYGEOv3\\n"
      pointCount = u32
      primCount  = u32
      flags      = u32   (bit0 UV_PRESENT, bit1 UV_IS_VERTEX)
      space      = u8    (0=object, 1=world)
      pad[3]
    Blocks:
      points: pointCount * float32 x,y,z
      For each prim:
        vcount(u32),
        vcount * u32 (point indices),
        if UV_PRESENT: vcount * (float32 u, float32 v)  # per-corner
    """
    node = hou.node(sop_path)
    if node is None:
        raise hou.NodeError(f"SOP node not found: {sop_path}")
    if not file_path:
        raise hou.NodeError("file_path is required for v3 export")

    out_path = hou.expandString(file_path)
    _ensure_dir(out_path)

    geo = node.geometry()

    # Space
    world_xf = None
    if space.lower() == "world":
        try:
            world_xf = node.parent().worldTransform()
        except Exception:
            world_xf = None

    # Positions (per point)
    positions = []
    for p in geo.points():
        P = p.position()
        if world_xf:
            P = _xf_point(world_xf, P)
        positions.append((float(P[0]), float(P[1]), float(P[2])))

    # UV attr: prefer vertex uv, else point uv
    uv_vtx = geo.findVertexAttrib("uv")
    uv_pt  = geo.findPointAttrib("uv")
    uv_present = (uv_vtx is not None) or (uv_pt is not None)

    flags = 0
    if uv_present:
        flags |= FLAG_UV_PRESENT
        if uv_vtx:
            flags |= FLAG_UV_IS_VERTEX

    # Topology and per-corner UVs (if available)
    prims = geo.prims()
    prim_indices = []   # list[list[int]]
    prim_uvs = []       # list[list[(u,v)]], only if uv_present

    for prim in prims:
        verts = prim.vertices()
        # point indices per corner
        idxs = [v.point().number() for v in verts]
        prim_indices.append(idxs)

        # collect uv per corner if present
        if uv_present:
            uv_list = []
            if uv_vtx:
                for v in verts:
                    uv = v.attribValue(uv_vtx)
                    u = float(uv[0]); vv = float(uv[1]) if len(uv) > 1 else 0.0
                    uv_list.append((u, vv))
            else:  # point uv fallback
                for v in verts:
                    uv = v.point().attribValue(uv_pt)
                    u = float(uv[0]); vv = float(uv[1]) if len(uv) > 1 else 0.0
                    uv_list.append((u, vv))
            prim_uvs.append(uv_list)

    # Write file
    with open(out_path, "wb") as f:
        f.write(b"MYGEOv3\n")                              # magic
        f.write(struct.pack("<I", len(positions)))         # pointCount
        f.write(struct.pack("<I", len(prim_indices)))      # primCount
        f.write(struct.pack("<I", flags))                  # flags
        f.write(struct.pack("<B", 1 if world_xf else 0))   # space
        f.write(b"\x00\x00\x00")                           # pad

        # points
        for x, y, z in positions:
            f.write(struct.pack("<fff", x, y, z))

        # per-prim: indices (+uvs if present)
        if uv_present:
            uv_it = iter(prim_uvs)
            for poly in prim_indices:
                vcount = len(poly)
                f.write(struct.pack("<I", vcount))
                for idx in poly:
                    f.write(struct.pack("<I", idx))
                uvs = next(uv_it)
                for (u, vv) in uvs:
                    f.write(struct.pack("<ff", u, vv))
        else:
            for poly in prim_indices:
                vcount = len(poly)
                f.write(struct.pack("<I", vcount))
                for idx in poly:
                    f.write(struct.pack("<I", idx))

    hou.ui.displayMessage(
        f"MYGEO v3 exported:\n{len(positions)} pts, {len(prim_indices)} prims\n→ {out_path}"
    )
    return out_path

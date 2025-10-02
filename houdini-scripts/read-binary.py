import struct

def read_mygbin(path):
    with open(path, "rb") as f:
        magic = f.read(8)
        print("Magic: ", magic)
        if magic != b"MYGEOv2\n":
            raise ValueError(f"Not a MYGEO v2 file (got {magic!r})")

        # --- Header ---
        point_count = struct.unpack("<I", f.read(4))[0]
        prim_count  = struct.unpack("<I", f.read(4))[0]
        flags       = struct.unpack("<I", f.read(4))[0]
        space_flag  = struct.unpack("<B", f.read(1))[0]
        f.read(3)  # padding
        space = "world" if space_flag == 1 else "object"

        # --- Points ---
        points = []
        for _ in range(point_count):
            x, y, z = struct.unpack("<fff", f.read(12))
            points.append((x, y, z))

        # --- Primitives (indices) ---
        prims = []
        for _ in range(prim_count):
            vcount = struct.unpack("<I", f.read(4))[0]
            verts = list(struct.unpack(f"<{vcount}I", f.read(4 * vcount)))
            prims.append(verts)

    return {
        "magic": magic,
        "point_count": point_count,
        "prim_count": prim_count,
        "flags": flags,
        "space": space,
        "points": points,   # list of (x,y,z)
        "prims": prims,     # list of [i0, i1, i2, ...]
    }

if __name__ == "__main__":
    data = read_mygbin("../exports/test.hou")  # replace with your file
    print("Header:", data["point_count"], "points,", data["prim_count"], "prims,", data["space"])
    print("Magic:", data["magic"])
    print("First point:", data["points"][0] if data["points"] else None)
    print("First prim:", data["prims"][0] if data["prims"] else None)


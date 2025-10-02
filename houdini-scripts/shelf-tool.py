# Shelf Tool: Set MYGEO Path + Export (v3) — self-contained

sel = hou.selectedNodes()
if not sel:
    hou.ui.displayMessage("Select a SOP node to export.")
    raise hou.OperationInterrupted

sop = sel[0]

# --- ensure spare parm "mygeo_path" exists on the node ---
ptg = sop.parmTemplateGroup()
if ptg.find("mygeo_path") is None:
    p = hou.StringParmTemplate(
        name="mygeo_path",
        label="MYGEO Path",
        num_components=1,
        string_type=hou.stringParmType.FileReference,
    )
    p.setTags({"filechooser_mode": "write"})
    ptg.append(p)
    sop.setParmTemplateGroup(ptg)

# --- choose space ---
space_choice = hou.ui.selectFromList(
    ["world", "object"], default_choices=[0], exclusive=True,
    message="Export coordinate space?"
)
if not space_choice:
    raise hou.OperationInterrupted
space = ["world", "object"][space_choice[0]]

# --- ask for output path (start from saved value if present) ---
initial = sop.evalParm("mygeo_path") or "$HIP/geo"
path = hou.ui.selectFile(
    start_directory=initial,
    title="Export MYGEO v3 (pos + idx + uv)",
    pattern="*.mygbin",
    collapse_sequences=False
)
if not path:
    raise hou.OperationInterrupted

# save the path on the node
sop.parm("mygeo_path").set(path)

# --- export via v3 (must exist in hou.session) ---
hou.session.export_myg_v3_pos_idx_uv(
    sop_path=sop.path(),
    file_path=path,
    space=space,
)

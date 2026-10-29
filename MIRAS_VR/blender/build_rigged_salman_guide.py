"""
MIRAS VR — Salman Khan Rigged & Animated Tour Guide Pipeline
Transforms the Salman Khan static STL sculpt into a fully rigged, skinned,
and animated human tour guide character in GLB format with 10 animations.
Exact color palette from reference turnaround sheet (Black Pathani suit, turquoise bracelet, warm tan skin).
Strict Zero Emojis.
"""
import os
import sys
import math
import argparse
import bpy
import bmesh
from mathutils import Vector, Euler, Matrix, Quaternion

NAME = "Salman_Tour_Guide"

# Exact Turnaround Color Palette from Reference Image (Linear sRGB for glTF)
# Reference: media_1793295969286_8451cccd.jpg
PALETTE = {
    # Swatch 1: Black Pathani Kurta & Salwar (#262424)
    "kurta_black": (0.0194, 0.0176, 0.0176, 1.0),
    # Swatch 2: Charcoal Shadow / Fabric Fold (#373536)
    "fabric_fold": (0.0382, 0.0356, 0.0369, 1.0),
    # Swatch 3: Warm Tan Indian Skin Tone (#D8A47C)
    "skin": (0.6867, 0.3712, 0.2016, 1.0),
    # Subtle jawline 5 o'clock stubble shadow (#B47E5A)
    "skin_shadow": (0.4578, 0.2086, 0.1022, 1.0),
    # Salman Khan signature arched dark eyebrows (#1C1410)
    "eyebrow": (0.0105, 0.0060, 0.0040, 1.0),
    # Eye sclera / White of the eyes (#EDE8E0)
    "eye_white": (0.8310, 0.7913, 0.7290, 1.0),
    # Intense dark brown iris & pupil (#150E0A)
    "pupil": (0.0060, 0.0035, 0.0020, 1.0),
    # Eyelid fold and lash line (#281C16)
    "eyelid": (0.0212, 0.0105, 0.0065, 1.0),
    # Natural warm lip tone (#BD725A)
    "lips": (0.5089, 0.1651, 0.1022, 1.0),
    # Lip crease parting line (#4A2018)
    "mouth_line": (0.0685, 0.0130, 0.0080, 1.0),
    # Nostril / under-nose shadow (#4A241A)
    "nostril": (0.0685, 0.0160, 0.0090, 1.0),
    # Swatch 4: Iconic Turquoise Bracelet Stone (#287277)
    "turquoise": (0.0212, 0.1683, 0.1845, 1.0),
    # Silver curb chain for bracelet (#B0B4B8)
    "silver_chain": (0.4342, 0.4578, 0.4770, 1.0),
    # Black dress loafers (#141416)
    "shoes": (0.0055, 0.0055, 0.0070, 1.0),
    # Dark slicked hair (#18181A)
    "hair": (0.0080, 0.0080, 0.0100, 1.0),
    # Placket buttons (#202022)
    "button": (0.0130, 0.0130, 0.0140, 1.0),
}


def log(msg):
    print(f"[MIRAS Salman Rig] {msg}", flush=True)


def build_rigged_character(stl_path, blend_path, glb_path, target_tris=65000):
    log(f"Starting rigged Salman Khan tour guide build from: {stl_path}")
    if not os.path.isfile(stl_path):
        raise SystemExit(f"ERROR: STL file not found: {stl_path}")

    # 1. Clean scene and import STL
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.stl_import(filepath=stl_path)
    mesh_obj = bpy.context.selected_objects[0]
    mesh_obj.name = mesh_obj.data.name = f"{NAME}_Mesh"
    bpy.context.view_layer.objects.active = mesh_obj
    src_tris = len(mesh_obj.data.polygons)
    log(f"Imported raw STL: {src_tris} triangles")

    # 2. Weld duplicate vertices and remove degenerate geometry
    bm = bmesh.new()
    bm.from_mesh(mesh_obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-7)
    bm.to_mesh(mesh_obj.data)
    bm.free()

    # 3. Decimate to optimal VR realtime triangle budget
    if src_tris > target_tris:
        mod = mesh_obj.modifiers.new("Decimate", "DECIMATE")
        mod.ratio = float(target_tris) / float(src_tris)
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)
        log(f"Decimated mesh to {len(mesh_obj.data.polygons)} triangles")

    # 4. Orient and ground feet at Z = 0, center horizontally
    me = mesh_obj.data
    z_min = min(v.co.z for v in me.vertices)
    z_max = max(v.co.z for v in me.vertices)
    x_min = min(v.co.x for v in me.vertices)
    x_max = max(v.co.x for v in me.vertices)
    y_min = min(v.co.y for v in me.vertices)
    y_max = max(v.co.y for v in me.vertices)

    center_x = (x_min + x_max) / 2.0
    center_y = (y_min + y_max) / 2.0
    shift_z = -z_min

    for v in me.vertices:
        v.co.x -= center_x
        v.co.y -= center_y
        v.co.z += shift_z

    mesh_obj.location = (0, 0, 0)
    me.update()
    height = z_max - z_min
    log(f"Grounded mesh: Height {height:.3f} m, centered on X/Y")

    # 5. Apply Salman Khan Pathani Attire Vertex Colors
    attr = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")

    # Define arm bone axes for smooth perpendicular sleeve cuffs and isolated wrist bracelet
    arm_axes = {}
    for side_sign, s_name in [(-1.0, "R"), (1.0, "L")]:
        elbow_pt = Vector((side_sign * 0.38, 0.04, 1.22))
        hand_pt = Vector((side_sign * 0.56, -0.05, 0.86))
        vec = hand_pt - elbow_pt
        arm_axes[s_name] = (elbow_pt, vec, vec.length_squared)

    # Load high-resolution photographic portrait of Salman Khan for smooth bilinear facial sampling
    portrait_candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "models", "salman_face_portrait.png"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "public", "assets", "models", "salman_face_portrait.png"),
    ]
    portrait_img = None
    for pc in portrait_candidates:
        if os.path.exists(pc):
            portrait_img = bpy.data.images.load(os.path.abspath(pc))
            log(f"Loaded face portrait: {pc} ({portrait_img.size[0]}x{portrait_img.size[1]})")
            break

    px_data = None
    pw = 512
    ph = 512
    if portrait_img:
        pw, ph = portrait_img.size
        px_data = list(portrait_img.pixels)

    def srgb_to_lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    def clamp(val, low=0.0, high=1.0):
        return max(low, min(high, val))

    def lerp_color(c1, c2, t):
        t = clamp(t, 0.0, 1.0)
        return (
            c1[0] * (1.0 - t) + c2[0] * t,
            c1[1] * (1.0 - t) + c2[1] * t,
            c1[2] * (1.0 - t) + c2[2] * t,
            1.0,
        )

    def sample_portrait(x, y, z):
        if not px_data:
            return PALETTE["skin"]
        # Aligned anatomical projection from 3D head to 512x512 portrait
        u = 250.88 + x * 1649.15
        v_top = 238.08 - (z - 1.7327) * 1463.81
        v_blender = (ph - 1) - v_top

        u = clamp(u, 1.0, float(pw - 2))
        v_blender = clamp(v_blender, 1.0, float(ph - 2))

        u0 = int(u)
        u1 = u0 + 1
        fu = u - u0

        v0 = int(v_blender)
        v1 = v0 + 1
        fv = v_blender - v0

        idx00 = (v0 * pw + u0) * 4
        idx10 = (v0 * pw + u1) * 4
        idx01 = (v1 * pw + u0) * 4
        idx11 = (v1 * pw + u1) * 4

        r0 = px_data[idx00] * (1.0 - fu) + px_data[idx10] * fu
        r1 = px_data[idx01] * (1.0 - fu) + px_data[idx11] * fu
        r = r0 * (1.0 - fv) + r1 * fv

        g0 = px_data[idx00 + 1] * (1.0 - fu) + px_data[idx10 + 1] * fu
        g1 = px_data[idx01 + 1] * (1.0 - fu) + px_data[idx11 + 1] * fu
        g = g0 * (1.0 - fv) + g1 * fv

        b0 = px_data[idx00 + 2] * (1.0 - fu) + px_data[idx10 + 2] * fu
        b1 = px_data[idx01 + 2] * (1.0 - fu) + px_data[idx11 + 2] * fu
        b = b0 * (1.0 - fv) + b1 * fv

        return (srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b), 1.0)

    def compute_vertex_color(x, y, z):
        ax = abs(x)

        # 1. Footwear: Black formal dress loafers
        if z < 0.11:
            return PALETTE["shoes"]

        # 2. Black Salwar trousers: Ankles to waist
        if z < 0.52:
            return PALETTE["kurta_black"]

        # 3. Bilateral Arms & Hands (Continuous Arm Axis Projection)
        if ax > 0.22 and 0.70 < z < 1.45:
            side_name = "L" if x > 0 else "R"
            elbow_pt, vec, l2 = arm_axes[side_name]
            t = (Vector((x, y, z)) - elbow_pt).dot(vec) / l2

            # Upper arm: Black Kurta sleeve
            if t < 0.24:
                return PALETTE["kurta_black"]
            # Rolled sleeve cuff rim
            if t < 0.27:
                return PALETTE["fabric_fold"]
            # Forearm: Bare tan skin
            if t < 0.38:
                return PALETTE["skin"]
            # Wrist Joint Narrowing: Bracelet zone strictly on Right wrist
            if side_name == "R" and 0.38 <= t <= 0.44 and 1.06 <= z <= 1.10 and -0.02 <= y <= 0.08:
                if y < 0.005 and x < -0.42:
                    return PALETTE["turquoise"]  # Turquoise stone on outer wrist
                return PALETTE["silver_chain"]    # Silver curb chain
            # Hand, Palm, Thumb & All 10 Fingers: 100% Clean Skin
            return PALETTE["skin"]

        # 4. Torso: Black Pathani Kurta with buttons
        if z < 1.535:
            # Front placket button accents
            if y < -0.08 and ax < 0.015 and z >= 1.08 and (abs((z - 1.18) % 0.08) < 0.015):
                return PALETTE["button"]
            return PALETTE["kurta_black"]

        # 5. Neck & Throat (Clean smooth transition without black jagged teeth)
        if z < 1.58:
            # Front throat and neck skin
            if y < 0.035 and ax < 0.065 and z >= 1.535:
                return PALETTE["skin"]
            if y < -0.020 and ax < 0.035 and z >= 1.515:
                return PALETTE["skin"]  # V-opening
            return PALETTE["kurta_black"]  # Mandarin collar band

        # 6. Chin, Jawline, Face & Hair (Z >= 1.58)
        # Check if vertex belongs to facial zone for smooth photographic portrait sampling
        is_face_zone = (1.57 <= z <= 1.825) and (y < -0.015) and (ax < 0.075)
        if is_face_zone:
            # Feathering weights for smooth seamless blending
            wx = clamp((0.062 - ax) / 0.014)
            wy = clamp((-0.015 - y) / 0.025)
            wz_top = clamp((1.815 - z) / 0.025)
            wz_bot = clamp((z - 1.570) / 0.020)
            w = wx * wy * wz_top * wz_bot

            if w > 0.0:
                tex_col = sample_portrait(x, y, z)
                base_col = PALETTE["hair"] if z > 1.80 else PALETTE["skin"]
                return lerp_color(base_col, tex_col, w)

        # Hair, temples, and crown
        if z > 1.81:
            return PALETTE["hair"]
        if y >= -0.015:
            return PALETTE["hair"]
        return PALETTE["skin"]

    # Precompute per-vertex colors for high performance and smooth Gouraud shading
    vert_colors = [compute_vertex_color(v.co.x, v.co.y, v.co.z) for v in me.vertices]

    # Assign smooth vertex colors to all loop corners
    for li, loop in enumerate(me.loops):
        attr.data[li].color = vert_colors[loop.vertex_index]

    me.color_attributes.active_color = attr
    bpy.ops.object.shade_smooth()

    # Material setup with Vertex Colors
    mat = bpy.data.materials.new(f"{NAME}_Material")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    vcol_node = nt.nodes.new("ShaderNodeVertexColor")
    vcol_node.layer_name = "Col"
    nt.links.new(vcol_node.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.50
    me.materials.append(mat)
    log("Vertex colors and PBR material configured")

    # 6. Construct the Humanoid Armature Rig
    arm_data = bpy.data.armatures.new(f"{NAME}_ArmatureData")
    arm_obj = bpy.data.objects.new(f"{NAME}_Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")

    bones = arm_data.edit_bones

    # Root and Spine Chain
    b_root = bones.new("root")
    b_root.head = Vector((0, 0, 0))
    b_root.tail = Vector((0, 0, 0.1))

    b_pelvis = bones.new("pelvis")
    b_pelvis.parent = b_root
    b_pelvis.head = Vector((0, 0, 0.90))
    b_pelvis.tail = Vector((0, 0.01, 1.05))

    b_spine = bones.new("spine")
    b_spine.parent = b_pelvis
    b_spine.head = Vector((0, 0.01, 1.05))
    b_spine.tail = Vector((0, 0.01, 1.25))

    b_chest = bones.new("chest")
    b_chest.parent = b_spine
    b_chest.head = Vector((0, 0.01, 1.25))
    b_chest.tail = Vector((0, 0.0, 1.54))

    b_neck = bones.new("neck")
    b_neck.parent = b_chest
    b_neck.head = Vector((0, 0.0, 1.54))
    b_neck.tail = Vector((0, -0.02, 1.64))

    b_head = bones.new("head")
    b_head.parent = b_neck
    b_head.head = Vector((0, -0.02, 1.64))
    b_head.tail = Vector((0, -0.02, 1.88))

    # Left & Right Legs
    for side, sign in (("L", 1.0), ("R", -1.0)):
        b_thigh = bones.new(f"thigh.{side}")
        b_thigh.parent = b_pelvis
        b_thigh.head = Vector((sign * 0.12, 0.0, 0.88))
        b_thigh.tail = Vector((sign * 0.13, 0.0, 0.48))

        b_shin = bones.new(f"shin.{side}")
        b_shin.parent = b_thigh
        b_shin.head = Vector((sign * 0.13, 0.0, 0.48))
        b_shin.tail = Vector((sign * 0.13, 0.02, 0.11))

        b_foot = bones.new(f"foot.{side}")
        b_foot.parent = b_shin
        b_foot.head = Vector((sign * 0.13, 0.02, 0.11))
        b_foot.tail = Vector((sign * 0.12, -0.12, 0.02))

    # Left & Right Arms
    for side, sign in (("L", 1.0), ("R", -1.0)):
        b_shoulder = bones.new(f"shoulder.{side}")
        b_shoulder.parent = b_chest
        b_shoulder.head = Vector((sign * 0.08, 0.0, 1.48))
        b_shoulder.tail = Vector((sign * 0.28, 0.0, 1.44))

        b_upper_arm = bones.new(f"upper_arm.{side}")
        b_upper_arm.parent = b_shoulder
        b_upper_arm.head = Vector((sign * 0.28, 0.0, 1.44))
        b_upper_arm.tail = Vector((sign * 0.44, 0.04, 1.12))

        b_forearm = bones.new(f"forearm.{side}")
        b_forearm.parent = b_upper_arm
        b_forearm.head = Vector((sign * 0.44, 0.04, 1.12))
        b_forearm.tail = Vector((sign * 0.54, -0.01, 0.90))

        b_hand = bones.new(f"hand.{side}")
        b_hand.parent = b_forearm
        b_hand.head = Vector((sign * 0.54, -0.01, 0.90))
        b_hand.tail = Vector((sign * 0.60, -0.02, 0.76))

    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"Created humanoid armature with {len(arm_data.bones)} bones")

    # 7. Skinning & Vertex Group Weight Assignment
    bone_names = [b.name for b in arm_data.bones]
    for b_name in bone_names:
        if b_name not in mesh_obj.vertex_groups:
            mesh_obj.vertex_groups.new(name=b_name)

    bpy.context.view_layer.objects.active = mesh_obj
    bone_segments = []
    for b in arm_data.bones:
        h = arm_obj.matrix_world @ b.head_local
        t = arm_obj.matrix_world @ b.tail_local
        bone_segments.append((b.name, h, t))

    def dist_sq_point_segment(p, a, b):
        ab = b - a
        l2 = ab.length_squared
        if l2 < 1e-8:
            return (p - a).length_squared
        t = max(0.0, min(1.0, (p - a).dot(ab) / l2))
        proj = a + t * ab
        return (p - proj).length_squared

    bone_radii = {
        "root": 0.05,
        "pelvis": 0.24,
        "spine": 0.22,
        "chest": 0.25,
        "neck": 0.14,
        "head": 0.18,
        "shoulder.L": 0.16, "shoulder.R": 0.16,
        "upper_arm.L": 0.14, "upper_arm.R": 0.14,
        "forearm.L": 0.12, "forearm.R": 0.12,
        "hand.L": 0.11, "hand.R": 0.11,
        "thigh.L": 0.16, "thigh.R": 0.16,
        "shin.L": 0.14, "shin.R": 0.14,
        "foot.L": 0.12, "foot.R": 0.12,
    }

    log("Computing smooth anatomical skinning weights...")
    for v in me.vertices:
        p = v.co
        weights = {}
        for b_name, h, t in bone_segments:
            if b_name == "root":
                continue
            r = bone_radii.get(b_name, 0.15)
            d2 = dist_sq_point_segment(p, h, t)
            d = math.sqrt(d2)

            # Lateral limb isolation
            if ".L" in b_name and p.x < -0.02:
                continue
            if ".R" in b_name and p.x > 0.02:
                continue
            if ("arm" in b_name or "hand" in b_name) and abs(p.x) < 0.22:
                continue

            if d < r * 2.2:
                w = math.exp(-0.5 * (d / r) ** 2)
                weights[b_name] = w

        total = sum(weights.values())
        if total > 1e-6:
            for b_name, w in weights.items():
                norm_w = w / total
                if norm_w > 0.01:
                    mesh_obj.vertex_groups[b_name].add([v.index], norm_w, "REPLACE")
        else:
            closest_b = "pelvis" if p.z < 1.1 else ("chest" if p.z < 1.55 else "head")
            mesh_obj.vertex_groups[closest_b].add([v.index], 1.0, "REPLACE")

    # Bind Armature modifier
    arm_mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
    arm_mod.object = arm_obj
    arm_mod.use_vertex_groups = True
    mesh_obj.parent = arm_obj
    log("Armature bound to mesh with normalized skin weights")

    # 8. Author the 10 Required Animations
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    pose = arm_obj.pose

    def make_action(name, duration_frames, keyframe_fn):
        act = bpy.data.actions.new(name=name)
        arm_obj.animation_data_create()
        arm_obj.animation_data.action = act

        for pbone in pose.bones:
            pbone.location = Vector((0, 0, 0))
            pbone.rotation_mode = "XYZ"
            pbone.rotation_euler = Euler((0, 0, 0), "XYZ")
            pbone.scale = Vector((1, 1, 1))

        for frame in range(0, duration_frames + 1):
            t = frame / float(duration_frames)
            keyframe_fn(pose, frame, t)
            for pbone in pose.bones:
                pbone.keyframe_insert(data_path="location", frame=frame)
                pbone.keyframe_insert(data_path="rotation_euler", frame=frame)
        return act

    actions = []

    # 1. IDLE (0..60 frames, 2.0s loop - Confident Salman stance)
    def kf_idle(pose, f, t):
        phase = t * math.pi * 2
        pose.bones["chest"].rotation_euler = Euler((math.sin(phase) * 0.02, 0, 0), "XYZ")
        pose.bones["pelvis"].location = Vector((0, 0, math.sin(phase) * 0.004))
        pose.bones["pelvis"].rotation_euler = Euler((0, math.sin(phase * 0.5) * 0.012, 0), "XYZ")
        # Relaxed muscular arm posture with subtle forward pitch
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.07 + math.sin(phase) * 0.015, 0, 0.03), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.07 + math.sin(phase) * 0.015, 0, -0.03), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.14, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.14, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((math.sin(phase * 0.8) * 0.018, math.cos(phase * 0.6) * 0.025, 0), "XYZ")

    actions.append(make_action("Idle", 60, kf_idle))

    # 2. WALK (0..36 frames, 1.2s confident swagger stride)
    def kf_walk(pose, f, t):
        phase = t * math.pi * 2
        stride_l = math.sin(phase)
        stride_r = -stride_l

        # Pelvis bounce & swagger roll
        pose.bones["pelvis"].location = Vector((math.sin(phase) * 0.022, 0, abs(math.sin(phase * 2)) * 0.026))
        pose.bones["pelvis"].rotation_euler = Euler((0.035, math.sin(phase) * 0.04, -math.sin(phase) * 0.025), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((-0.025, -math.sin(phase) * 0.045, 0), "XYZ")

        pose.bones["thigh.L"].rotation_euler = Euler((-stride_l * 0.36, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((-stride_r * 0.36, 0, 0), "XYZ")
        pose.bones["shin.L"].rotation_euler = Euler((max(0.0, stride_l) * 0.42, 0, 0), "XYZ")
        pose.bones["shin.R"].rotation_euler = Euler((max(0.0, stride_r) * 0.42, 0, 0), "XYZ")
        pose.bones["foot.L"].rotation_euler = Euler((-stride_l * 0.14, 0, 0), "XYZ")
        pose.bones["foot.R"].rotation_euler = Euler((-stride_r * 0.14, 0, 0), "XYZ")

        # Natural forward arm swing with bracelet prominence
        pose.bones["upper_arm.L"].rotation_euler = Euler((-stride_l * 0.26 - 0.08, 0, 0.03), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((stride_l * 0.26 - 0.08, 0, -0.03), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.18 - max(0.0, -stride_l) * 0.22, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.18 - max(0.0, stride_l) * 0.22, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((math.sin(phase * 2) * 0.018, 0, 0), "XYZ")

    actions.append(make_action("Walk", 36, kf_walk))

    # 3. STOP AND TURN (0..45 frames)
    def kf_stop_turn(pose, f, t):
        decel = 1.0 - t
        turn_angle = t * math.pi * 0.5
        pose.bones["pelvis"].rotation_euler = Euler((0, 0, turn_angle * 0.7), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0, 0, turn_angle * 0.3), "XYZ")
        pose.bones["head"].rotation_euler = Euler((0, 0, turn_angle * 0.4), "XYZ")
        pose.bones["thigh.L"].rotation_euler = Euler((-decel * 0.15, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((decel * 0.15, 0, 0), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.15 * decel - 0.08, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.15 * decel - 0.08, 0, 0), "XYZ")

    actions.append(make_action("StopAndTurn", 45, kf_stop_turn))

    # 4. EXPLAIN (0..72 frames, 2.4s loop: Charismatic narrative gestures IN FRONT OF CHEST)
    def kf_explain(pose, f, t):
        phase = t * math.pi * 2
        pulse = math.sin(phase)
        accent = math.cos(phase * 2)

        pose.bones["chest"].rotation_euler = Euler((accent * 0.025 + 0.02, 0, pulse * 0.02), "XYZ")

        # Right Arm (with bracelet): forward gesture emphasizing cultural landmarks
        pose.bones["shoulder.R"].rotation_euler = Euler((0, 0.04, -0.06), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.42 + pulse * 0.10, 0.12, -0.20 - pulse * 0.10), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.60 - pulse * 0.16, -0.08, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.16 - accent * 0.08, 0, -pulse * 0.12), "XYZ")

        # Left Arm: supportive open-hand gesture in front of chest
        pose.bones["shoulder.L"].rotation_euler = Euler((0, -0.04, 0.06), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.38 - pulse * 0.10, -0.10, 0.18 + pulse * 0.10), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.55 - accent * 0.12, 0.08, 0), "XYZ")
        pose.bones["hand.L"].rotation_euler = Euler((-0.10, 0, pulse * 0.12), "XYZ")

        pose.bones["head"].rotation_euler = Euler((accent * 0.05 - 0.015, pulse * 0.04, 0), "XYZ")

    actions.append(make_action("Explain", 72, kf_explain))

    # 5. POINT (0..60 frames: Right arm extends forward-outward pointing to site)
    def kf_point(pose, f, t):
        env = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((0.03 * env, 0, -0.18 * env), "XYZ")
        pose.bones["shoulder.R"].rotation_euler = Euler((0, 0.08 * env, -0.12 * env), "XYZ")
        # Pitch upper arm forward (-X)
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.75 * env, 0.10 * env, -0.32 * env), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.40 * env, 0, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.20 * env, 0, -0.15 * env), "XYZ")
        # Left arm relaxed
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.10, 0, 0.05), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.15, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((0, 0.22 * env, 0), "XYZ")

    actions.append(make_action("Point", 60, kf_point))

    # 6. WELCOME (0..72 frames: Open two-handed welcoming namaste/inviting gesture)
    def kf_welcome(pose, f, t):
        env = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((0.04 * env, 0, 0), "XYZ")
        for side, sign in (("L", 1.0), ("R", -1.0)):
            pose.bones[f"shoulder.{side}"].rotation_euler = Euler((0, -sign * 0.06 * env, sign * 0.08 * env), "XYZ")
            pose.bones[f"upper_arm.{side}"].rotation_euler = Euler((-0.50 * env, -sign * 0.15 * env, sign * 0.35 * env), "XYZ")
            pose.bones[f"forearm.{side}"].rotation_euler = Euler((-0.55 * env, 0, 0), "XYZ")
            pose.bones[f"hand.{side}"].rotation_euler = Euler((-0.15 * env, 0, sign * 0.15 * env), "XYZ")
        pose.bones["head"].rotation_euler = Euler((-0.04 * env, 0, 0), "XYZ")

    actions.append(make_action("Welcome", 72, kf_welcome))

    # 7. LOOK AROUND (0..90 frames)
    def kf_look_around(pose, f, t):
        sweep = math.sin(t * math.pi * 2)
        pose.bones["head"].rotation_euler = Euler((0.04 * math.cos(t * math.pi * 4), sweep * 0.45, 0), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0, sweep * 0.15, 0), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.08, 0, 0.02), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.08, 0, -0.02), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.12, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.12, 0, 0), "XYZ")

    actions.append(make_action("LookAround", 90, kf_look_around))

    # 8. LISTEN (0..60 frames)
    def kf_listen(pose, f, t):
        phase = t * math.pi * 2
        pose.bones["head"].rotation_euler = Euler((-0.02 + math.sin(phase) * 0.02, 0.08, 0.04), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0.02, 0, 0.03), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.08, 0, 0.02), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.08, 0, -0.02), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.12, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.12, 0, 0), "XYZ")

    actions.append(make_action("Listen", 60, kf_listen))

    # 9. TURN AROUND (0..60 frames, 180 deg turn)
    def kf_turn_around(pose, f, t):
        turn_angle = t * math.pi
        pose.bones["pelvis"].rotation_euler = Euler((0, 0, turn_angle), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0, 0, turn_angle * 0.1), "XYZ")
        pose.bones["head"].rotation_euler = Euler((0, 0, turn_angle * 0.1), "XYZ")
        step_cycle = math.sin(t * math.pi * 4)
        pose.bones["thigh.L"].rotation_euler = Euler((-step_cycle * 0.20, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((step_cycle * 0.20, 0, 0), "XYZ")

    actions.append(make_action("TurnAround", 60, kf_turn_around))

    # 10. RETURN TO IDLE (0..30 frames)
    def kf_return_idle(pose, f, t):
        blend = 1.0 - t
        pose.bones["chest"].rotation_euler = Euler((blend * 0.04, 0, blend * 0.02), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.08 - blend * 0.15, 0, 0.02), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.08 - blend * 0.15, 0, -0.02), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.12 - blend * 0.20, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.12 - blend * 0.20, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((blend * 0.04, 0, 0), "XYZ")

    actions.append(make_action("ReturnToIdle", 30, kf_return_idle))

    # 9. Push Actions to NLA Tracks for GLB Export
    arm_obj.animation_data_create()
    for act in actions:
        track = arm_obj.animation_data.nla_tracks.new()
        track.name = act.name
        strip = track.strips.new(act.name, 1, act)
        strip.action = act
        log(f"Configured NLA track for action: {act.name}")

    bpy.ops.object.mode_set(mode="OBJECT")
    log("Authored and baked 10 animation actions into NLA tracks")

    # Save Blend file and Export GLB
    os.makedirs(os.path.dirname(blend_path), exist_ok=True)
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=blend_path, compress=True)
    log(f"Saved rigged character Blender file to {blend_path}")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=False,
        export_apply=False,
        export_yup=True,
        export_skins=True,
        export_all_influences=True,
        export_vertex_color="MATERIAL",
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_nla_strips=True,
        export_def_bones=True,
        export_optimize_animation_size=True,
    )

    size_mb = os.path.getsize(glb_path) / (1024 * 1024)
    log(f"Exported rigged GLB: {glb_path} ({size_mb:.2f} MB)")

    # 10. Verification: Clean re-import check
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    imported_arms = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    imported_meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    imported_actions = bpy.data.actions

    log(f"Verify GLB Re-import: Armatures={len(imported_arms)}, Meshes={len(imported_meshes)}, Actions={len(imported_actions)}")
    action_names = [a.name for a in imported_actions]
    log(f"Verified actions: {action_names}")

    if not imported_arms or not imported_meshes or len(imported_actions) < 5:
        raise SystemExit("ERROR: GLB verification failed!")

    log("SUCCESS: Rigged Salman Khan tour guide character build verified successfully.")


def main():
    parser = argparse.ArgumentParser(description="Build rigged animated Salman Khan tour guide from STL")
    parser.add_argument("--stl", default="miras-repo/MIRAS_VR/assets/models/salman_khan_guide.stl")
    parser.add_argument("--blend", default="miras-repo/MIRAS_VR/blender/salman_guide_rigged.blend")
    parser.add_argument("--glb", default="miras-repo/MIRAS_VR/web/public/assets/models/salman_tour_guide_rigged.glb")
    parser.add_argument("--tris", type=int, default=65000)

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    stl_full = os.path.abspath(args.stl)
    blend_full = os.path.abspath(args.blend)
    glb_full = os.path.abspath(args.glb)

    build_rigged_character(stl_full, blend_full, glb_full, target_tris=args.tris)


if __name__ == "__main__":
    main()

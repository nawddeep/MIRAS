"""
MIRAS VR — Rigged and Animated Tour Guide Pipeline
Transforms the unrigged static STL sculpt into a fully rigged, skinned,
and animated human tour guide character in GLB format with 10 animations.
Zero emojis, production-grade 3D character pipeline.
"""
import os
import sys
import math
import argparse
import bpy
import bmesh
from mathutils import Vector, Euler, Matrix, Quaternion

NAME = "Trump_Tour_Guide"

# Official Indian Attire Turnaround Color Palette (Linear sRGB)
PALETTE = {
    "vest": (0.114, 0.149, 0.231, 1.0),      # #1D263B Royal Navy Blue
    "vest_shadow": (0.075, 0.102, 0.161, 1.0), # #131A29 Deep Navy Shadow
    "kurta": (0.961, 0.937, 0.902, 1.0),     # #F5EFE6 Cream / Off-White Silk
    "kurta_shade": (0.890, 0.843, 0.784, 1.0), # #E3D7C8 Fold Shadow
    "stole": (0.533, 0.145, 0.173, 1.0),     # #88252C Deep Maroon
    "stole_gold": (0.831, 0.659, 0.325, 1.0),# #D4A853 Golden Zari Trim & Tassels
    "hair": (0.898, 0.722, 0.463, 1.0),      # #E5B876 Golden Blonde Hair
    "skin": (0.949, 0.729, 0.576, 1.0),      # #F2BA93 Warm Natural Caucasian Skin
    "lips": (0.831, 0.545, 0.467, 1.0),      # #D48B77 Natural Lip Tone
    "shoes": (0.220, 0.137, 0.094, 1.0),     # #382318 Dark Brown Leather Mojari
    "button": (0.898, 0.757, 0.345, 1.0),    # #E5C158 Brass Buttons
    "watch": (0.220, 0.137, 0.094, 1.0),     # #382318 Watch Strap
}


def log(msg):
    print(f"[MIRAS Rig] {msg}", flush=True)


def build_rigged_character(stl_path, blend_path, glb_path, target_tris=65000):
    log(f"Starting rigged tour guide build from: {stl_path}")
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

    # 5. Apply Indian Traditional Attire Vertex Colors
    attr = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    for poly in me.polygons:
        c = poly.center
        x, y, z = c.x, c.y, c.z
        ax = abs(x)

        # 1. Footwear: Mojari
        if z < 0.11:
            col = PALETTE["shoes"]
        # 2. Churidar Pyjama: Ankles to lower Kurta
        elif z < 0.48:
            col = PALETTE["kurta"]
        # 3. Hands & Wrists
        elif 0.72 <= z < 0.93 and ax >= 0.45:
            if x > 0.46 and 0.88 <= z <= 0.92:
                col = PALETTE["watch"]
            else:
                col = PALETTE["skin"]
        # 4. Kurta Sleeves on arms
        elif 0.90 <= z < 1.48 and ax >= 0.28:
            col = PALETTE["kurta"]
        # 5. Lower body and torso
        elif 0.48 <= z < 1.55:
            is_stole_y = y < -0.06 or (z >= 1.15 and y < -0.02)
            is_stole_x = 0.055 <= ax <= 0.235
            is_stole = is_stole_y and is_stole_x and z >= 0.54

            if is_stole:
                is_border = ax < 0.082 or ax > 0.208
                is_fringe = z < 0.575
                is_pallu = (0.575 <= z < 0.615) or (0.645 <= z < 0.665)
                if is_border or is_fringe or is_pallu:
                    col = PALETTE["stole_gold"]
                else:
                    col = PALETTE["stole"]
            elif y < -0.07 and ax < 0.016 and z >= 0.86 and (abs((z - 0.90) % 0.08) < 0.018):
                col = PALETTE["button"]
            elif z < 0.84:
                col = PALETTE["kurta"]
            else:
                col = PALETTE["vest"]
        # 6. Neck and Chin
        elif 1.55 <= z < 1.64:
            if y < -0.02 and ax < 0.085:
                col = PALETTE["skin"]  # Donald Trump chin and jawline
            elif 0.085 <= ax <= 0.18 and y < 0.0:
                col = PALETTE["stole"]
            elif y > 0.02 or ax > 0.09:
                col = PALETTE["hair"]
            else:
                col = PALETTE["vest"]
        # 7. Head, Face & Hair
        else:
            is_front = y < -0.025 and ax < 0.092
            is_hair = (z >= 1.745 and y > -0.09) or z >= 1.76 or not is_front
            if is_hair:
                col = PALETTE["hair"]
            else:
                if 1.635 <= z <= 1.655 and ax < 0.032 and y < -0.08:
                    col = PALETTE["lips"]
                else:
                    col = PALETTE["skin"]

        for li in poly.loop_indices:
            attr.data[li].color = col

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
    bsdf.inputs["Roughness"].default_value = 0.55
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

    # Calculate bone influence weights programmatically based on segment distance
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

    # Define anatomical falloff radius per bone
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

            # Lateral limb isolation (prevent left arm bleeding into right arm or torso)
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
            # Fallback to closest spine/pelvis bone
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

        # Reset all bones to rest transform
        for pbone in pose.bones:
            pbone.location = Vector((0, 0, 0))
            pbone.rotation_mode = "XYZ"
            pbone.rotation_euler = Euler((0, 0, 0), "XYZ")
            pbone.scale = Vector((1, 1, 1))

        # Sample keyframes across frames
        for frame in range(0, duration_frames + 1):
            t = frame / float(duration_frames)
            keyframe_fn(pose, frame, t)
            for pbone in pose.bones:
                pbone.keyframe_insert(data_path="location", frame=frame)
                pbone.keyframe_insert(data_path="rotation_euler", frame=frame)
        return act

    actions = []

    # 1. IDLE (0..60 frames, 2.0s loop)
    def kf_idle(pose, f, t):
        phase = t * math.pi * 2
        # Natural breathing
        pose.bones["chest"].rotation_euler = Euler((math.sin(phase) * 0.025, 0, 0), "XYZ")
        pose.bones["pelvis"].location = Vector((0, 0, math.sin(phase) * 0.005))
        # Subtle weight shift
        pose.bones["pelvis"].rotation_euler = Euler((0, math.sin(phase * 0.5) * 0.015, 0), "XYZ")
        # Relaxed arm sway
        pose.bones["upper_arm.L"].rotation_euler = Euler((math.sin(phase) * 0.02, 0, 0.02), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((math.sin(phase) * 0.02, 0, -0.02), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.08, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.08, 0, 0), "XYZ")
        # Head gentle gaze
        pose.bones["head"].rotation_euler = Euler((math.sin(phase * 0.8) * 0.02, math.cos(phase * 0.6) * 0.03, 0), "XYZ")

    actions.append(make_action("Idle", 60, kf_idle))

    # 2. WALK (0..36 frames, 1.2s seamless stride cycle)
    def kf_walk(pose, f, t):
        phase = t * math.pi * 2
        stride_l = math.sin(phase)
        stride_r = -stride_l

        # Pelvis bounce & roll
        pose.bones["pelvis"].location = Vector((math.sin(phase) * 0.02, 0, abs(math.sin(phase * 2)) * 0.028))
        pose.bones["pelvis"].rotation_euler = Euler((0.04, math.sin(phase) * 0.035, -math.sin(phase) * 0.03), "XYZ")

        # Spine counter-rotation
        pose.bones["chest"].rotation_euler = Euler((-0.03, -math.sin(phase) * 0.04, 0), "XYZ")

        # Thighs & Shins (alternating stride)
        pose.bones["thigh.L"].rotation_euler = Euler((-stride_l * 0.38, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((-stride_r * 0.38, 0, 0), "XYZ")
        pose.bones["shin.L"].rotation_euler = Euler((max(0.0, stride_l) * 0.45, 0, 0), "XYZ")
        pose.bones["shin.R"].rotation_euler = Euler((max(0.0, stride_r) * 0.45, 0, 0), "XYZ")
        pose.bones["foot.L"].rotation_euler = Euler((-stride_l * 0.15, 0, 0), "XYZ")
        pose.bones["foot.R"].rotation_euler = Euler((-stride_r * 0.15, 0, 0), "XYZ")

        # Counter arm swings with elbow flex
        pose.bones["upper_arm.L"].rotation_euler = Euler((stride_l * 0.28, 0, 0.04), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((stride_r * 0.28, 0, -0.04), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.15 + max(0.0, -stride_l) * 0.22, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.15 + max(0.0, -stride_r) * 0.22, 0, 0), "XYZ")

        # Head stability
        pose.bones["head"].rotation_euler = Euler((math.sin(phase * 2) * 0.02, 0, 0), "XYZ")

    actions.append(make_action("Walk", 36, kf_walk))

    # 3. STOP AND TURN (0..45 frames)
    def kf_stop_turn(pose, f, t):
        decel = 1.0 - t
        turn_angle = t * math.pi * 0.5  # 90 degree turn to face visitor
        pose.bones["pelvis"].rotation_euler = Euler((0, 0, turn_angle * 0.7), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0, 0, turn_angle * 0.3), "XYZ")
        pose.bones["head"].rotation_euler = Euler((0, 0, turn_angle * 0.4), "XYZ")
        # Step planting
        pose.bones["thigh.L"].rotation_euler = Euler((-decel * 0.15, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((decel * 0.15, 0, 0), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.12 * decel + 0.08, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.12 * decel + 0.08, 0, 0), "XYZ")

    actions.append(make_action("StopAndTurn", 45, kf_stop_turn))

    # 4. EXPLAIN (0..72 frames, 2.4s loop: Trumpian Accordion & Palm Gestures)
    def kf_explain(pose, f, t):
        phase = t * math.pi * 2
        pulse = math.sin(phase)
        accent = math.cos(phase * 2)

        # Chest upright emphasis
        pose.bones["chest"].rotation_euler = Euler((accent * 0.03 + 0.02, 0, pulse * 0.02), "XYZ")

        # Iconic Double-Hand Accordion & Palm Gestures
        # Left Arm: lifts and expands laterally
        pose.bones["shoulder.L"].rotation_euler = Euler((0, -0.05, 0.08), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((0.35 + pulse * 0.10, -0.15, 0.22 + pulse * 0.12), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.65 + accent * 0.15, 0.10, 0), "XYZ")
        pose.bones["hand.L"].rotation_euler = Euler((0.12, 0, pulse * 0.14), "XYZ")

        # Right Arm: Trumpian precision pinch & emphasis pulses
        pose.bones["shoulder.R"].rotation_euler = Euler((0, 0.05, -0.08), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((0.40 - pulse * 0.12, 0.15, -0.25 - pulse * 0.12), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.70 + pulse * 0.18, -0.10, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((0.18 + accent * 0.10, 0, -pulse * 0.15), "XYZ")

        # Head conversational nods
        pose.bones["head"].rotation_euler = Euler((accent * 0.06 - 0.02, pulse * 0.05, 0), "XYZ")

    actions.append(make_action("Explain", 72, kf_explain))

    # 5. POINT (0..60 frames: Right arm extends to monument)
    def kf_point(pose, f, t):
        # In-out curve: reach target, hold, return
        reach = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((0, 0, -reach * 0.15), "XYZ")
        pose.bones["head"].rotation_euler = Euler((-reach * 0.05, 0, -reach * 0.25), "XYZ")

        # Right arm points smoothly toward destination
        pose.bones["shoulder.R"].rotation_euler = Euler((0, 0.12 * reach, -0.15 * reach), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((0.75 * reach, 0.10 * reach, -0.45 * reach), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.25 * reach, 0, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((0.10 * reach, 0, -0.10 * reach), "XYZ")

        # Left hand rests at side
        pose.bones["forearm.L"].rotation_euler = Euler((0.08, 0, 0), "XYZ")

    actions.append(make_action("Point", 60, kf_point))

    # 6. WELCOME (0..60 frames: Two-handed open welcoming gesture)
    def kf_welcome(pose, f, t):
        reach = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((-reach * 0.03, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((-reach * 0.04, 0, reach * 0.04), "XYZ")

        # Both arms open wide in welcoming posture
        pose.bones["upper_arm.L"].rotation_euler = Euler((0.40 * reach, -0.20 * reach, 0.45 * reach), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((0.40 * reach, 0.20 * reach, -0.45 * reach), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.55 * reach, 0.20 * reach, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.55 * reach, -0.20 * reach, 0), "XYZ")
        pose.bones["hand.L"].rotation_euler = Euler((0, -0.25 * reach, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((0, 0.25 * reach, 0), "XYZ")

    actions.append(make_action("Welcome", 60, kf_welcome))

    # 7. LOOK AROUND (0..80 frames: Surveying architecture left to right)
    def kf_look_around(pose, f, t):
        phase = t * math.pi * 2
        look_yaw = math.sin(phase) * 0.45
        pose.bones["head"].rotation_euler = Euler((math.cos(phase * 2) * 0.04, 0, look_yaw), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0, 0, look_yaw * 0.35), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.10, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.10, 0, 0), "XYZ")

    actions.append(make_action("LookAround", 80, kf_look_around))

    # 8. LISTEN (0..60 frames: Attentive receptive stance)
    def kf_listen(pose, f, t):
        phase = t * math.pi * 2
        pose.bones["head"].rotation_euler = Euler((math.sin(phase) * 0.03 - 0.02, 0, 0.04), "XYZ")
        pose.bones["pelvis"].rotation_euler = Euler((0, 0.02, 0), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0.02, 0, 0), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.08, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.08, 0, 0), "XYZ")

    actions.append(make_action("Listen", 60, kf_listen))

    # 9. TURN AROUND (0..60 frames: Smooth 180-degree turnaround)
    def kf_turn_around(pose, f, t):
        yaw = t * math.pi  # 180 degrees
        pose.bones["pelvis"].rotation_euler = Euler((0, 0, yaw), "XYZ")
        pose.bones["thigh.L"].rotation_euler = Euler((math.sin(t * math.pi * 4) * 0.25, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((-math.sin(t * math.pi * 4) * 0.25, 0, 0), "XYZ")

    actions.append(make_action("TurnAround", 60, kf_turn_around))

    # 10. RETURN TO IDLE (0..30 frames: Clean easing transition)
    def kf_return_idle(pose, f, t):
        ease = 1.0 - t
        pose.bones["chest"].rotation_euler = Euler((ease * 0.05, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((ease * 0.04, 0, 0), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((ease * 0.15, 0, 0.02), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((ease * 0.15, 0, -0.02), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((0.08, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((0.08, 0, 0), "XYZ")

    actions.append(make_action("ReturnToIdle", 30, kf_return_idle))

    # Push all actions to NLA tracks so glTF exporter includes all clips
    arm_obj.animation_data_create()
    for act in actions:
        track = arm_obj.animation_data.nla_tracks.new()
        track.name = act.name
        track.strips.new(act.name, 0, act)

    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"Authored and baked {len(actions)} animation actions into NLA tracks")

    # 9. Save Blender project and Export rigged GLB
    os.makedirs(os.path.dirname(blend_path), exist_ok=True)
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=blend_path, compress=True)
    log(f"Saved rigged character Blender file to {blend_path}")

    # Export GLB with mesh, armature, skin weights, vertex colors, and animation actions
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

    log("SUCCESS: Rigged tour guide character build verified successfully.")


def main():
    parser = argparse.ArgumentParser(description="Build rigged animated tour guide character from STL")
    parser.add_argument("--stl", default="miras-repo/MIRAS_VR/assets/models/trump_tour_guide.stl")
    parser.add_argument("--blend", default="miras-repo/MIRAS_VR/blender/heritage_guide_rigged.blend")
    parser.add_argument("--glb", default="miras-repo/MIRAS_VR/web/public/assets/models/trump_tour_guide_rigged.glb")
    parser.add_argument("--tris", type=int, default=65000)

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    stl_full = os.path.abspath(args.stl)
    blend_full = os.path.abspath(args.blend)
    glb_full = os.path.abspath(args.glb)

    build_rigged_character(stl_full, blend_full, glb_full, args.tris)


if __name__ == "__main__":
    main()

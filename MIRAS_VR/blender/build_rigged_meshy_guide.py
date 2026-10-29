"""
MIRAS VR - Build Rigged Tour Guide from Meshy GLB Model
Rigs the high-fidelity textured Meshy GLB model with the 20-bone humanoid armature
and 10 expressive animations for real-time WebGL / Three.js performance.
Zero emojis, production-grade 3D character pipeline.
"""
import os
import sys
import math
import bpy
import bmesh
import argparse
from mathutils import Vector, Euler, Matrix, Quaternion

NAME = "Salman_Tour_Guide"


def log(msg):
    print(f"[MIRAS Meshy Rig] {msg}", flush=True)


def build_rigged_meshy_character(input_glb, blend_path, glb_path, name="Tour_Guide"):
    log(f"Starting rigged guide build ({name}) from model: {input_glb}")
    if not os.path.isfile(input_glb):
        raise SystemExit(f"ERROR: Input GLB file not found: {input_glb}")

    # 1. Clean scene and import Meshy GLB
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=input_glb)

    # Find the imported mesh object
    mesh_obj = next((o for o in bpy.data.objects if o.type == 'MESH'), None)
    if not mesh_obj:
        raise SystemExit("ERROR: No mesh found in imported GLB")

    # Remove any extra objects (cameras, lights, etc.)
    for o in list(bpy.data.objects):
        if o != mesh_obj:
            bpy.data.objects.remove(o, do_unlink=True)

    mesh_obj.name = mesh_obj.data.name = f"{name}_Mesh"
    bpy.context.view_layer.objects.active = mesh_obj
    me = mesh_obj.data
    log(f"Imported mesh: {len(me.vertices)} vertices, {len(me.polygons)} faces")

    # If mesh is overly dense (> 500k polygons), decimate to ~200k for WebGL real-time performance
    if len(me.polygons) > 500000:
        target_ratio = 200000.0 / float(len(me.polygons))
        log(f"Decimating dense mesh ({len(me.polygons)} faces) with ratio {target_ratio:.3f}...")
        mod = mesh_obj.modifiers.new("Decimate", "DECIMATE")
        mod.ratio = target_ratio
        bpy.ops.object.modifier_apply(modifier=mod.name)
        me = mesh_obj.data
        log(f"Decimated mesh to {len(me.polygons)} faces")

    # 2. Inspect and optimize materials/textures
    for mat in me.materials:
        log(f"Preserving material: {mat.name}")
        if mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    w, h = node.image.size
                    log(f"  Texture: {node.image.name} ({w}x{h})")
                    # If texture is 4096, scale to 2048 for optimal WebGL performance and fast load
                    if w > 2048 or h > 2048:
                        new_w = min(2048, w)
                        new_h = min(2048, h)
                        log(f"  Scaling texture {node.image.name} to {new_w}x{new_h} for WebGL performance")
                        node.image.scale(new_w, new_h)

    # 3. Orient, center horizontally, and ground feet at Z = 0
    # Apply object transforms first if any
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

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
    log(f"Grounded mesh: Height {height:.3f} m, centered on X/Y (Z range: [0, {height:.3f}])")

    bpy.ops.object.shade_smooth()

    # 4. Construct Humanoid Armature Rig
    arm_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    arm_obj = bpy.data.objects.new(f"{name}_Armature", arm_data)
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

    is_babita = "babita" in name.lower()

    # Left & Right Arms
    for side, sign in (("L", 1.0), ("R", -1.0)):
        if is_babita:
            b_shoulder = bones.new(f"shoulder.{side}")
            b_shoulder.parent = b_chest
            b_shoulder.head = Vector((sign * 0.07, 0.0, 1.46))
            b_shoulder.tail = Vector((sign * 0.20, 0.0, 1.42))

            b_upper_arm = bones.new(f"upper_arm.{side}")
            b_upper_arm.parent = b_shoulder
            b_upper_arm.head = Vector((sign * 0.20, 0.0, 1.42))
            b_upper_arm.tail = Vector((sign * 0.38, 0.02, 1.14))

            b_forearm = bones.new(f"forearm.{side}")
            b_forearm.parent = b_upper_arm
            b_forearm.head = Vector((sign * 0.38, 0.02, 1.14))
            b_forearm.tail = Vector((sign * 0.48, 0.0, 0.94))

            b_hand = bones.new(f"hand.{side}")
            b_hand.parent = b_forearm
            b_hand.head = Vector((sign * 0.48, 0.0, 0.94))
            b_hand.tail = Vector((sign * 0.53, -0.01, 0.82))
        else:
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

    # 5. Skinning & Vertex Group Weight Assignment
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
        "shoulder.L": 0.13 if is_babita else 0.16, "shoulder.R": 0.13 if is_babita else 0.16,
        "upper_arm.L": 0.09 if is_babita else 0.14, "upper_arm.R": 0.09 if is_babita else 0.14,
        "forearm.L": 0.08 if is_babita else 0.12, "forearm.R": 0.08 if is_babita else 0.12,
        "hand.L": 0.08 if is_babita else 0.11, "hand.R": 0.08 if is_babita else 0.11,
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
            if ("arm" in b_name or "hand" in b_name) and abs(p.x) < (0.16 if is_babita else 0.22):
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

    # Add Armature Modifier
    arm_mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
    arm_mod.object = arm_obj
    arm_mod.use_vertex_groups = True
    mesh_obj.parent = arm_obj
    log("Armature modifier attached and skinning weights finalized")

    # 6. Keyframe the 10 Expressive Skeletal Animation Actions
    log("Generating 10 skeletal animation actions...")
    pose = arm_obj.pose

    def make_action(name, duration_frames, keyframe_fn):
        act = bpy.data.actions.new(name=name)
        arm_obj.animation_data_create()
        arm_obj.animation_data.action = act

        for pbone in pose.bones:
            pbone.rotation_mode = "XYZ"
            pbone.location = Vector((0, 0, 0))
            pbone.rotation_euler = Euler((0, 0, 0), "XYZ")

        for frame in range(0, duration_frames + 1):
            t = frame / float(duration_frames)
            keyframe_fn(pose, frame, t)
            for pbone in pose.bones:
                pbone.keyframe_insert(data_path="location", frame=frame)
                pbone.keyframe_insert(data_path="rotation_euler", frame=frame)
        return act

    actions = []

    # 1. IDLE (0..60 frames, 2.0s loop - Confident stance)
    def kf_idle(pose, f, t):
        phase = t * math.pi * 2
        pose.bones["chest"].rotation_euler = Euler((math.sin(phase) * 0.02, 0, 0), "XYZ")
        pose.bones["pelvis"].location = Vector((0, 0, math.sin(phase) * 0.004))
        pose.bones["pelvis"].rotation_euler = Euler((0, math.sin(phase * 0.5) * 0.012, 0), "XYZ")
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

        pose.bones["pelvis"].location = Vector((math.sin(phase) * 0.022, 0, abs(math.sin(phase * 2)) * 0.026))
        pose.bones["pelvis"].rotation_euler = Euler((0.035, math.sin(phase) * 0.04, -math.sin(phase) * 0.025), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((-0.025, -math.sin(phase) * 0.045, 0), "XYZ")

        pose.bones["thigh.L"].rotation_euler = Euler((-stride_l * 0.36, 0, 0), "XYZ")
        pose.bones["thigh.R"].rotation_euler = Euler((-stride_r * 0.36, 0, 0), "XYZ")
        pose.bones["shin.L"].rotation_euler = Euler((max(0.0, stride_l) * 0.42, 0, 0), "XYZ")
        pose.bones["shin.R"].rotation_euler = Euler((max(0.0, stride_r) * 0.42, 0, 0), "XYZ")
        pose.bones["foot.L"].rotation_euler = Euler((-stride_l * 0.14, 0, 0), "XYZ")
        pose.bones["foot.R"].rotation_euler = Euler((-stride_r * 0.14, 0, 0), "XYZ")

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

    # 4. EXPLAIN (0..72 frames, 2.4s loop: Charismatic narrative gestures)
    def kf_explain(pose, f, t):
        phase = t * math.pi * 2
        pulse = math.sin(phase)
        accent = math.cos(phase * 2)

        pose.bones["chest"].rotation_euler = Euler((accent * 0.025 + 0.02, 0, pulse * 0.02), "XYZ")
        pose.bones["shoulder.R"].rotation_euler = Euler((0, 0.04, -0.06), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.42 + pulse * 0.10, 0.12, -0.20 - pulse * 0.10), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.60 - pulse * 0.16, -0.08, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.16 - accent * 0.08, 0, -pulse * 0.12), "XYZ")

        pose.bones["shoulder.L"].rotation_euler = Euler((0, -0.03, 0.04), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.26 - pulse * 0.08, -0.06, 0.14), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.38 + accent * 0.10, 0, 0), "XYZ")
        pose.bones["hand.L"].rotation_euler = Euler((pulse * 0.08, 0, 0), "XYZ")

        pose.bones["neck"].rotation_euler = Euler((0.02, pulse * 0.04, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((-0.03 + accent * 0.02, -pulse * 0.06, 0), "XYZ")

    actions.append(make_action("Explain", 72, kf_explain))

    # 5. POINT (0..60 frames: Decisive pointing gesture toward heritage monument)
    def kf_point(pose, f, t):
        reach = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((0.03 * reach, -0.08 * reach, 0.04 * reach), "XYZ")
        pose.bones["shoulder.R"].rotation_euler = Euler((0.06 * reach, 0.08 * reach, -0.08 * reach), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.82 * reach, 0.22 * reach, -0.32 * reach), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.32 * reach, 0, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.18 * reach, 0, -0.12 * reach), "XYZ")

        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.08, 0, 0.04), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.18, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((-0.04 * reach, -0.14 * reach, 0.02 * reach), "XYZ")

    actions.append(make_action("Point", 60, kf_point))

    # 6. WELCOME (0..60 frames: Warm two-handed welcoming gesture)
    def kf_welcome(pose, f, t):
        reach = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((0.05 * reach, 0, 0), "XYZ")
        pose.bones["pelvis"].rotation_euler = Euler((0.02 * reach, 0, 0), "XYZ")

        pose.bones["shoulder.L"].rotation_euler = Euler((0.04 * reach, -0.06 * reach, 0.06 * reach), "XYZ")
        pose.bones["shoulder.R"].rotation_euler = Euler((0.04 * reach, 0.06 * reach, -0.06 * reach), "XYZ")

        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.46 * reach, -0.16 * reach, 0.24 * reach), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.46 * reach, 0.16 * reach, -0.24 * reach), "XYZ")

        pose.bones["forearm.L"].rotation_euler = Euler((-0.48 * reach, 0.20 * reach, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.48 * reach, -0.20 * reach, 0), "XYZ")

        pose.bones["hand.L"].rotation_euler = Euler((-0.12 * reach, 0, 0.10 * reach), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.12 * reach, 0, -0.10 * reach), "XYZ")

        pose.bones["head"].rotation_euler = Euler((-0.06 * reach, 0, 0), "XYZ")

    actions.append(make_action("Welcome", 60, kf_welcome))

    # 7. BOW / NAMASTE (0..60 frames: Traditional Indian Namaste greeting)
    def kf_bow(pose, f, t):
        reach = math.sin(t * math.pi)
        pose.bones["pelvis"].rotation_euler = Euler((0.06 * reach, 0, 0), "XYZ")
        pose.bones["spine"].rotation_euler = Euler((0.08 * reach, 0, 0), "XYZ")
        pose.bones["chest"].rotation_euler = Euler((0.14 * reach, 0, 0), "XYZ")

        pose.bones["shoulder.L"].rotation_euler = Euler((0.08 * reach, 0, 0.08 * reach), "XYZ")
        pose.bones["shoulder.R"].rotation_euler = Euler((0.08 * reach, 0, -0.08 * reach), "XYZ")

        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.52 * reach, 0.18 * reach, 0.38 * reach), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.52 * reach, -0.18 * reach, -0.38 * reach), "XYZ")

        pose.bones["forearm.L"].rotation_euler = Euler((-1.18 * reach, -0.42 * reach, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-1.18 * reach, 0.42 * reach, 0), "XYZ")

        pose.bones["hand.L"].rotation_euler = Euler((-0.22 * reach, 0, 0.12 * reach), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.22 * reach, 0, -0.12 * reach), "XYZ")

        pose.bones["neck"].rotation_euler = Euler((0.08 * reach, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((0.16 * reach, 0, 0), "XYZ")

    actions.append(make_action("Bow", 60, kf_bow))

    # 8. THINKING (0..60 frames: Pondering stance)
    def kf_thinking(pose, f, t):
        reach = math.sin(t * math.pi)
        pose.bones["chest"].rotation_euler = Euler((-0.02 * reach, 0, 0.03 * reach), "XYZ")
        pose.bones["shoulder.R"].rotation_euler = Euler((0.06 * reach, 0, -0.06 * reach), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.58 * reach, 0.20 * reach, -0.36 * reach), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-1.22 * reach, -0.22 * reach, 0), "XYZ")
        pose.bones["hand.R"].rotation_euler = Euler((-0.18 * reach, 0, 0), "XYZ")

        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.12 * reach, 0, 0.06 * reach), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.35 * reach, 0, 0), "XYZ")

        pose.bones["neck"].rotation_euler = Euler((0.04 * reach, 0.06 * reach, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((0.08 * reach, 0.10 * reach, -0.04 * reach), "XYZ")

    actions.append(make_action("Thinking", 60, kf_thinking))

    # 9. REST (0..60 frames: Natural subtle standing rest)
    def kf_rest(pose, f, t):
        phase = t * math.pi * 2
        pose.bones["chest"].rotation_euler = Euler((math.sin(phase) * 0.012, 0, 0), "XYZ")
        pose.bones["pelvis"].rotation_euler = Euler((0, math.sin(phase * 0.5) * 0.008, 0), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.05, 0, 0.02), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.05, 0, -0.02), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.10, 0, 0), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.10, 0, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((math.sin(phase * 0.7) * 0.01, 0, 0), "XYZ")

    actions.append(make_action("Rest", 60, kf_rest))

    # 10. TALK (0..48 frames, 1.6s loop: Active speaking cadence)
    def kf_talk(pose, f, t):
        phase = t * math.pi * 2
        p1 = math.sin(phase)
        p2 = math.sin(phase * 2)

        pose.bones["chest"].rotation_euler = Euler((0.025 + p2 * 0.018, 0, p1 * 0.015), "XYZ")

        pose.bones["shoulder.R"].rotation_euler = Euler((0, 0.02, -0.04), "XYZ")
        pose.bones["upper_arm.R"].rotation_euler = Euler((-0.34 + p1 * 0.08, 0.08, -0.16), "XYZ")
        pose.bones["forearm.R"].rotation_euler = Euler((-0.48 - p2 * 0.12, 0, 0), "XYZ")

        pose.bones["shoulder.L"].rotation_euler = Euler((0, -0.02, 0.04), "XYZ")
        pose.bones["upper_arm.L"].rotation_euler = Euler((-0.20 - p1 * 0.06, -0.06, 0.10), "XYZ")
        pose.bones["forearm.L"].rotation_euler = Euler((-0.28 + p2 * 0.08, 0, 0), "XYZ")

        pose.bones["neck"].rotation_euler = Euler((p2 * 0.025, p1 * 0.03, 0), "XYZ")
        pose.bones["head"].rotation_euler = Euler((-0.02 + p2 * 0.035, -p1 * 0.045, 0), "XYZ")

    actions.append(make_action("Talk", 48, kf_talk))

    # Default to Idle action
    arm_obj.animation_data.action = actions[0]
    log(f"All {len(actions)} animation actions generated and linked")

    # 7. Save .blend file
    os.makedirs(os.path.dirname(os.path.abspath(blend_path)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    log(f"Saved Blender project to: {blend_path}")

    # 8. Export to GLB with animations, skinning, and textures
    os.makedirs(os.path.dirname(os.path.abspath(glb_path)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    arm_obj.select_set(True)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_skins=True,
        export_morph=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_apply=False,
    )
    file_size_mb = os.path.getsize(glb_path) / (1024 * 1024)
    log(f"Successfully exported rigged GLB: {glb_path} ({file_size_mb:.2f} MB)")


def main():
    parser = argparse.ArgumentParser(description="Rig Meshy GLB Model for MIRAS VR")
    parser.add_argument("--input", default=r"c:\Users\rkheu\Downloads\ABCW\meshy-model.glb", help="Path to input Meshy GLB file")
    parser.add_argument("--blend", default=r"c:\Users\rkheu\Downloads\ABCW\miras-repo\MIRAS_VR\blender\salman_guide_rigged.blend", help="Output .blend file path")
    parser.add_argument("--glb", default=r"c:\Users\rkheu\Downloads\ABCW\miras-repo\MIRAS_VR\web\public\assets\models\salman_tour_guide_rigged.glb", help="Output .glb file path")
    parser.add_argument("--name", default="Salman_Tour_Guide", help="Character name for objects/armature")
    
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)

    build_rigged_meshy_character(
        input_glb=os.path.abspath(args.input),
        blend_path=os.path.abspath(args.blend),
        glb_path=os.path.abspath(args.glb),
        name=args.name,
    )


if __name__ == "__main__":
    main()

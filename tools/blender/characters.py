"""Prototype renderer for the character graphics (enemies and chef) of the classic theme.

The game animates characters as rigs of separate images, so every part is rendered on its own,
framed exactly as the rig places it. Parts are modelled in rig space: Blender x is the rig's x,
Blender z is the rig's y turned upwards (z = -y), the origin is the centre of the character's
tile and the feet touch y = +10. Characters face right; the game mirrors them.

Run from the repository root:
    blender -b --factory-startup --python tools/blender/characters.py -- [--only hotdog] [--samples N]

Writes <graphic>.png at 4x the logical size next to the SVG sources of the classic theme, and
a preview of each part to tmp/blender/characters/.
"""

import argparse
import math
import os
import random
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    ART_DIR,
    BACKDROP,
    PREVIEW_DIR,
    SUPERSAMPLE,
    TIER,
    add,
    bump,
    centred,
    downsample,
    enlarge,
    feed,
    load_rgba,
    map_range,
    math_op,
    new_material,
    new_scene,
    noise4,
    over,
    principled,
    ramp,
    save_rgba,
    scaled,
    srgb,
    use_displacement,
    voronoi4,
)

CHARACTER_PREVIEWS = os.path.join(PREVIEW_DIR, "characters")
SAUSAGE_RADIUS = 4.3
SAUSAGE_BOW = 4.2


def dance_frames(kind, name):
    """The frames a dancing body steps through, from -1 to 1, the middle one being the body."""
    return {
        f"{kind}.{name}Back2": -1.0,
        f"{kind}.{name}Back1": -0.5,
        f"{kind}.body": 0.0,
        f"{kind}.{name}Front1": 0.5,
        f"{kind}.{name}Front2": 1.0,
    }


def rig_point(x, y, depth=0.0):
    """A point given in rig coordinates (y down) as a Blender location."""
    return Vector((x, depth, -y))


# --- Meshes ---


def weld(name, verts, faces, smooth=True):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    if smooth:
        mesh.shade_smooth()
    return mesh


def tube(name, centres, radii, ring=48, squash=1.0):
    """A closed tube through `centres` with a radius at each; zero radii close the ends.
    `squash` scales the tube's depth (y) relative to its width."""
    verts, faces = [], []
    count = len(centres)
    for i, (centre, radius) in enumerate(zip(centres, radii)):
        tangent = (centres[min(i + 1, count - 1)] - centres[max(i - 1, 0)]).normalized()
        side = tangent.cross(Vector((0.0, 1.0, 0.0)))
        if side.length < 1e-6:
            side = tangent.cross(Vector((1.0, 0.0, 0.0)))
        side.normalize()
        depth = tangent.cross(side).normalized()
        for k in range(ring):
            a = 2 * math.pi * k / ring
            verts.append(centre + side * (math.cos(a) * radius) + depth * (math.sin(a) * radius * squash))
    for i in range(count - 1):
        for k in range(ring):
            n = (k + 1) % ring
            faces.append((i * ring + k, i * ring + n, (i + 1) * ring + n, (i + 1) * ring + k))
    return weld(name, verts, faces)


def capsule_radii(radius, samples, p=4.0):
    """Station along a capsule (0..1, denser at the ends) and its radius, with rounded ends."""
    stations = [(1 - math.cos(math.pi * i / (samples - 1))) / 2 for i in range(samples)]
    return stations, [radius * max(0.0, 1 - abs(2 * t - 1) ** p) ** (1 / p) for t in stations]


def ellipsoid(name, radii, segments=32):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=segments // 2, radius=1.0)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * radii[0], vert.co.y * radii[1], vert.co.z * radii[2]))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    return mesh


def place(scene, name, mesh, material, matrix, group):
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    obj.matrix_world = matrix
    scene.collection.objects.link(obj)
    group.append(obj)
    return obj


# --- Materials ---


def glossy(name, colour, roughness=0.3, coat=0.5, coat_roughness=0.1, sss=0.0, sss_radius=(1, 0.5, 0.3)):
    material, tree = new_material(name)
    bsdf, _ = principled(tree)
    bsdf.inputs["Base Color"].default_value = srgb(colour)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    bsdf.inputs["Subsurface Weight"].default_value = sss
    bsdf.inputs["Subsurface Radius"].default_value = sss_radius
    bsdf.inputs["Subsurface Scale"].default_value = 0.6
    return material


def object_coords(tree):
    coords = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(coords.outputs["Object"], split.inputs[0])
    return coords.outputs["Object"], split


def sausage_material():
    """Frankfurter skin: red-brown, darker and wrinkled towards the ends, very glossy."""
    material, tree = new_material("sausage")
    bsdf, _ = principled(tree)
    vector, split = object_coords(tree)
    mottle = noise4(tree, vector, 0.0, 0.25, detail=4)
    fine = noise4(tree, vector, 0.0, 2.0, detail=6)
    level = add(tree, 0.45, centred(tree, mottle, 0.5), centred(tree, fine, 0.15), clamp=True)
    stops = [(0.0, "#D9774B"), (0.4, "#C2583A"), (0.7, "#A8432A"), (1.0, "#7E2E1C")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    bsdf.inputs["Roughness"].default_value = 0.35
    bsdf.inputs["Coat Weight"].default_value = 0.55
    bsdf.inputs["Coat Roughness"].default_value = 0.12
    bsdf.inputs["Subsurface Weight"].default_value = 0.12
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.3, 0.2)
    bsdf.inputs["Subsurface Scale"].default_value = 0.8
    feed(tree, bsdf.inputs["Normal"], bump(tree, fine, 0.12, 0.2))
    return material


def pickle_material():
    """Dill pickle: deep green with pale speckles and warts, wet and glossy."""
    material, tree = new_material("pickle")
    bsdf, output = principled(tree)
    vector, split = object_coords(tree)
    warts = voronoi4(tree, vector, 0.0, 0.42)
    mottle = noise4(tree, vector, 0.0, 0.3, detail=4)
    stripes = noise4(tree, vector, 0.0, 0.9, detail=3)
    wart = map_range(tree, warts, 0.0, 0.32, 1.0, 0.0)
    displacement = tree.nodes.new("ShaderNodeDisplacement")
    feed(tree, displacement.inputs["Height"], wart)
    displacement.inputs["Midlevel"].default_value = 0.0
    displacement.inputs["Scale"].default_value = 0.45
    tree.links.new(displacement.outputs["Displacement"], output.inputs["Displacement"])
    use_displacement(material)
    level = add(tree, 0.5, centred(tree, mottle, 0.5), centred(tree, stripes, 0.3), scaled(tree, wart, -0.35), clamp=True)
    stops = [(0.0, "#A9C266"), (0.3, "#7FA347"), (0.6, "#557F2E"), (1.0, "#2F5219")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    bsdf.inputs["Roughness"].default_value = 0.4
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.1
    bsdf.inputs["Subsurface Weight"].default_value = 0.15
    bsdf.inputs["Subsurface Radius"].default_value = (0.4, 1.0, 0.3)
    bsdf.inputs["Subsurface Scale"].default_value = 0.8
    return material


def egg_white_material():
    """Fried egg white: glossy and a little translucent, browned and lacy at the crisp rim."""
    material, tree = new_material("eggWhite")
    bsdf, _ = principled(tree)
    rim = tree.nodes.new("ShaderNodeAttribute")
    rim.attribute_name = "rim"
    vector, split = object_coords(tree)
    lace = noise4(tree, vector, 0.0, 0.5, detail=6, roughness=0.6)
    bubbles = voronoi4(tree, vector, 0.0, 0.7)
    level = add(tree, scaled(tree, rim.outputs["Fac"], 1.15), centred(tree, lace, 0.6), clamp=True)
    stops = [(0.0, "#FBFAF5"), (0.62, "#F6F0E2"), (0.8, "#E6C894"), (0.92, "#C98F4E"), (1.0, "#8F5A2A")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    bsdf.inputs["Roughness"].default_value = 0.3
    bsdf.inputs["Coat Weight"].default_value = 0.5
    bsdf.inputs["Coat Roughness"].default_value = 0.1
    bsdf.inputs["Subsurface Weight"].default_value = 0.35
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.9, 0.7)
    bsdf.inputs["Subsurface Scale"].default_value = 0.8
    relief = add(tree, scaled(tree, bubbles, 0.6), scaled(tree, lace, 0.5))
    feed(tree, bsdf.inputs["Normal"], bump(tree, relief, 0.25, 0.3))
    return material


def shoe_material():
    return glossy("shoe", "#F1F0EC", roughness=0.4, coat=0.3, coat_roughness=0.2)


def eye_materials():
    return (
        glossy("eyeWhite", "#F8F8F4", roughness=0.25, coat=0.8, coat_roughness=0.05, sss=0.2),
        glossy("pupil", "#111114", roughness=0.2, coat=1.0, coat_roughness=0.03),
        glossy("brow", "#2B1B14", roughness=0.6, coat=0.0),
    )


# --- Shared character pieces ---


def add_eyes(scene, group, centres, facing_angle, size=1.0, brows=True, angry=True, brow_colour=None):
    """Two cartoon eyes (and brows) on a surface, each centre given with the angle round z that
    turns the eye's front from facing the camera to facing its surface normal."""
    white, pupil, brow = eye_materials()
    if brow_colour is not None:
        brow = glossy("browTint", brow_colour, roughness=0.6, coat=0.0)
    for index, (centre, angle) in enumerate(centres):
        turn = Matrix.Rotation(angle, 4, "Z")
        base = Matrix.Translation(centre) @ turn
        place(scene, "eye", ellipsoid("eye", (1.55 * size, 0.9 * size, 1.95 * size)), white, base, group)
        look = Matrix.Translation(Vector((0.55 * size, -0.62 * size, -0.1 * size)))
        place(scene, "pupil", ellipsoid("pupil", (0.82 * size, 0.45 * size, 1.05 * size)), pupil, base @ look, group)
        shine = Matrix.Translation(Vector((0.3 * size, -1.0 * size, 0.45 * size)))
        place(scene, "shine", ellipsoid("shine", (0.25 * size, 0.12 * size, 0.25 * size), 12), white, base @ shine, group)
        if brows:
            tilt = (0.35 if index == 0 else -0.35) if angry else 0.0
            lift = Matrix.Translation(Vector((0.0, -0.35 * size, 2.55 * size))) @ Matrix.Rotation(tilt, 4, "Y")
            bar = tube(
                "brow",
                [Vector((-1.5 * size, 0, 0)), Vector((-1.2 * size, 0, 0)), Vector((1.2 * size, 0, 0)), Vector((1.5 * size, 0, 0))],
                [0.0, 0.42 * size, 0.42 * size, 0.0],
                ring=16,
            )
            place(scene, "brow", bar, brow, base @ lift, group)


def add_leg(scene, group, colour):
    """One leg with its shoe, hanging from the hip at the rig origin, foot pointing right."""
    leg = glossy("leg", colour, roughness=0.35, coat=0.4, coat_roughness=0.15, sss=0.1)
    shin = tube("shin", [rig_point(0, y) for y in (0.0, 0.3, 3.5, 6.6, 7.0)], [0.0, 0.95, 0.85, 0.85, 0.0], ring=24)
    place(scene, "shin", shin, leg, Matrix.Identity(4), group)
    shoe = ellipsoid("shoe", (2.1, 1.4, 1.05))
    place(scene, "shoe", shoe, shoe_material(), Matrix.Translation(rig_point(0.8, 6.8)), group)


# --- Enemies (body built at rig position, legs at the rig origin) ---


def build_sausage(scene, group, bow):
    """Mr Hot Dog: an upright sausage from y = 3 to y = -28, bowed sideways by `bow` (-1..1)."""
    stations, radii = capsule_radii(SAUSAGE_RADIUS, 64)
    bottom, top = 3.0, -28.0
    centres = [rig_point(SAUSAGE_BOW * bow * math.sin(math.pi * t), bottom + (top - bottom) * t) for t in stations]
    place(scene, "sausage", tube("sausage", centres, radii, ring=64), sausage_material(), Matrix.Identity(4), group)


def sausage_eyes(scene, group):
    radius = SAUSAGE_RADIUS
    eyes = []
    for angle in (0.1, 0.68):
        surface = Vector((radius * math.sin(angle), -radius * math.cos(angle), 20.0))
        eyes.append((surface + Vector((math.sin(angle), -math.cos(angle), 0.0)) * 0.2, angle))
    add_eyes(scene, group, eyes, 0.0, size=0.88)


def build_egg(scene, group, ripple=0.0):
    """Mr Egg: a fried egg standing on edge, its yolk facing the camera. `ripple` (-1..1) turns
    the waves of its outline, so stepping through it makes the white wobble like jelly."""
    rng = random.Random(5)
    phases = [rng.uniform(0, 2 * math.pi) + ripple * (0.9 + 0.5 * k) for k in range(4)]
    centre_z = 11.0
    rings, spokes = 36, 128
    verts, faces, rim = [], [], []
    for face, sign in (("front", -1.0), ("back", 1.0)):
        for i in range(rings + 1):
            rho = i / rings
            for j in range(spokes):
                phi = 2 * math.pi * j / spokes
                outline = 12.0 + 1.2 * math.sin(3 * phi + phases[0]) + 0.8 * math.sin(5 * phi + phases[1])
                outline += 0.45 * math.sin(9 * phi + phases[2]) + 0.25 * math.sin(14 * phi + phases[3])
                thick = (1.6 if sign < 0 else 0.6) * (1 - rho**4) ** 0.5
                verts.append(Vector((rho * outline * math.cos(phi), sign * thick, centre_z + rho * outline * math.sin(phi))))
                rim.append(rho)
    half = (rings + 1) * spokes
    for offset in (0, half):
        for i in range(rings):
            for j in range(spokes):
                n = (j + 1) % spokes
                a, b = offset + i * spokes + j, offset + i * spokes + n
                c, d = offset + (i + 1) * spokes + n, offset + (i + 1) * spokes + j
                faces.append((a, b, c, d) if offset == 0 else (a, d, c, b))
    mesh = bpy.data.meshes.new("eggWhite")
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    mesh.attributes.new(name="rim", type="FLOAT", domain="POINT").data.foreach_set("value", rim)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    place(scene, "eggWhite", mesh, egg_white_material(), Matrix.Identity(4), group)
    yolk = glossy("yolk", "#F2A01A", roughness=0.15, coat=0.9, coat_roughness=0.04, sss=0.5, sss_radius=(1.0, 0.6, 0.1))
    place(scene, "yolk", ellipsoid("yolk", (5.8, 3.4, 5.5), 48), yolk, Matrix.Translation(Vector((1.0, -1.2, centre_z + 1.0))), group)


def egg_eyes(scene, group):
    eyes = []
    for x, angle in ((-1.0, -0.15), (3.4, 0.45)):
        eyes.append((Vector((x, -4.0, 13.0)), angle))
    add_eyes(scene, group, eyes, 0.0, size=0.95)


PICKLE_WIGGLE = 2.2


def build_pickle(scene, group, wiggle=0.0):
    """Mr Pickle: an upright, slightly curved pickle from y = 3 to y = -28."""
    stations, radii = capsule_radii(6.0, 72, p=2.6)
    bottom, top = 3.0, -28.0
    centres = [rig_point(-1.2 * math.sin(math.pi * t) + PICKLE_WIGGLE * wiggle * math.sin(2 * math.pi * t), bottom + (top - bottom) * t) for t in stations]
    radii = [r * (0.92 + 0.08 * math.sin(math.pi * t)) for r, t in zip(radii, stations)]
    place(scene, "pickle", tube("pickle", centres, radii, ring=96), pickle_material(), Matrix.Identity(4), group)


def pickle_eyes(scene, group):
    radius = 5.7
    eyes = []
    for angle in (0.1, 0.6):
        centre_x = -1.2 * math.sin(math.pi * 0.75)
        surface = Vector((centre_x + radius * math.sin(angle), -radius * math.cos(angle), 21.0))
        eyes.append((surface + Vector((math.sin(angle), -math.cos(angle), 0.0)) * 0.25, angle))
    add_eyes(scene, group, eyes, 0.0)


# --- Rendering ---


def clear_group(group):
    for obj in group:
        mesh = obj.data
        bpy.data.objects.remove(obj)
        if mesh and mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    group.clear()


def frame_camera(scene, rect):
    """Orthographic front camera framing the rig rectangle (left, top, width, height)."""
    left, top, width, height = rect
    camera = scene.camera
    if camera is None:
        data = bpy.data.cameras.new("camera")
        data.type = "ORTHO"
        data.clip_start = 1
        data.clip_end = 2000
        camera = bpy.data.objects.new("camera", data)
        camera.rotation_euler = (math.pi / 2, 0, 0)
        scene.collection.objects.link(camera)
        scene.camera = camera
    camera.data.ortho_scale = max(width, height)
    camera.location = rig_point(left + width / 2, top + height / 2, -500)
    scale = TIER * SUPERSAMPLE
    scene.render.resolution_x = round(width * scale)
    scene.render.resolution_y = round(height * scale)


def render_part(scene, graphic, rect):
    frame_camera(scene, rect)
    raw = os.path.join(CHARACTER_PREVIEWS, f"{graphic}.raw.png")
    scene.render.filepath = raw
    bpy.ops.render.render(write_still=True)
    pixels = downsample(load_rgba(raw), SUPERSAMPLE)
    save_rgba(pixels, os.path.join(ART_DIR, f"{graphic}.png"))
    save_rgba(enlarge(over(pixels, BACKDROP), 2), os.path.join(CHARACTER_PREVIEWS, f"{graphic}.preview.png"))
    print(f"rendered {graphic}")


def rect_from(x, y, width, height, origin_x=0.5, origin_y=0.5):
    """The image rectangle of a rig part placed at (x, y) with the given origin."""
    return (x - origin_x * width, y - origin_y * height, width, height)


LEG_RECT = rect_from(0, 0, 6, 8, 0.5, 0.0)

ENEMIES = {
    "hotdog": {
        "leg": "#C2583A",
        "body": rect_from(0, 4, 18, 34, 0.5, 1.0),
        "eyes": rect_from(2.6, -20, 12, 7),
        "build": build_sausage,
        "dance": "bend",
        "add_eyes": sausage_eyes,
    },
    "egg": {
        "leg": "#E9A928",
        "body": rect_from(0, 4, 30, 30, 0.5, 1.0),
        "eyes": rect_from(1.2, -13, 12, 7),
        "build": build_egg,
        "dance": "ripple",
        "add_eyes": egg_eyes,
    },
    "pickle": {
        "leg": "#5E8A33",
        "body": rect_from(0, 4, 18, 34, 0.5, 1.0),
        "eyes": rect_from(1.6, -21, 12, 7),
        "build": build_pickle,
        "dance": "wiggle",
        "add_eyes": pickle_eyes,
    },
}


def render_enemy(kind, samples):
    spec = ENEMIES[kind]
    scene = new_scene(samples)
    group = []
    add_leg(scene, group, spec["leg"])
    render_part(scene, f"{kind}.leg", LEG_RECT)
    clear_group(group)
    spec["add_eyes"](scene, group)
    render_part(scene, f"{kind}.eyes", spec["eyes"])
    clear_group(group)
    for graphic, amount in dance_frames(kind, spec["dance"]).items():
        spec["build"](scene, group, amount)
        render_part(scene, graphic, spec["body"])
        clear_group(group)


# --- Chef ---


def fabric(name, colour, sheen=0.5, folds=0.0):
    """Cotton: matte, with a soft sheen at grazing angles and optional creases."""
    material, tree = new_material(name)
    bsdf, _ = principled(tree)
    vector, split = object_coords(tree)
    weave = noise4(tree, vector, 0.0, 2.5, detail=4)
    creases = noise4(tree, vector, 0.0, 0.35, detail=3, distortion=0.6)
    bsdf.inputs["Base Color"].default_value = srgb(colour)
    bsdf.inputs["Roughness"].default_value = 0.75
    bsdf.inputs["Sheen Weight"].default_value = sheen
    bsdf.inputs["Sheen Roughness"].default_value = 0.4
    bsdf.inputs["Subsurface Weight"].default_value = 0.05
    relief = add(tree, scaled(tree, weave, 0.2), scaled(tree, creases, folds))
    feed(tree, bsdf.inputs["Normal"], bump(tree, relief, 0.35, 0.3))
    return material


def skin_material():
    return glossy("skin", "#F2C29B", roughness=0.45, coat=0.1, coat_roughness=0.3, sss=0.4, sss_radius=(1.0, 0.45, 0.3))


def hair_material():
    """Blond hair: streaks along the strands from stretched noise, glossy."""
    material, tree = new_material("hair")
    bsdf, _ = principled(tree)
    vector, split = object_coords(tree)
    stretch = tree.nodes.new("ShaderNodeCombineXYZ")
    feed(tree, stretch.inputs["X"], scaled(tree, split.outputs["X"], 6.0))
    feed(tree, stretch.inputs["Y"], scaled(tree, split.outputs["Y"], 6.0))
    feed(tree, stretch.inputs["Z"], scaled(tree, split.outputs["Z"], 0.6))
    strands = noise4(tree, stretch.outputs[0], 0.0, 0.8, detail=6, roughness=0.6)
    stops = [(0.0, "#A9782C"), (0.35, "#D4A548"), (0.65, "#E9C46C"), (1.0, "#F7E3A6")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, strands, stops))
    bsdf.inputs["Roughness"].default_value = 0.35
    bsdf.inputs["Coat Weight"].default_value = 0.25
    bsdf.inputs["Coat Roughness"].default_value = 0.2
    bsdf.inputs["Sheen Weight"].default_value = 0.3
    feed(tree, bsdf.inputs["Normal"], bump(tree, strands, 0.4, 0.2))
    return material


HEAD = Vector((0.9, 0.0, 13.3))
HEAD_RADIUS = 5.3


def on_head(azimuth, z, lift=0.0):
    """A point on the head at height z (rig y = -z), turned `azimuth` from the camera towards +x."""
    ring = math.sqrt(max(0.0, HEAD_RADIUS**2 - (z - HEAD.z) ** 2)) + lift
    return Vector((HEAD.x + ring * math.sin(azimuth), -ring * math.cos(azimuth), z))


def build_chef_head(scene, group):
    place(scene, "head", ellipsoid("head", (HEAD_RADIUS,) * 3, 64), skin_material(), Matrix.Translation(HEAD), group)
    hair = ellipsoid("hairCap", (5.35, 5.3, 5.15), 64)
    place(scene, "hair", hair, hair_material(), Matrix.Translation(Vector((-0.6, 0.8, 14.2))), group)
    for azimuth, z, size in ((0.05, 17.0, 1.5), (0.45, 17.2, 1.3), (-0.35, 17.0, 1.4)):
        fringe = ellipsoid("fringe", (size, 0.9, 1.0))
        place(scene, "fringe", fringe, hair_material(), Matrix.Translation(on_head(azimuth, z, 0.1)), group)
    nose = ellipsoid("nose", (0.95, 0.95, 0.95))
    place(scene, "nose", nose, skin_material(), Matrix.Translation(on_head(0.55, 13.3, 0.35)), group)
    lips = glossy("lips", "#9E3D38", roughness=0.4, coat=0.3)
    smile = [on_head(a, 11.1 - 0.45 * math.sin(math.pi * (a - 0.2) / 0.5), 0.05) for a in np.linspace(0.2, 0.7, 12)]
    place(scene, "mouth", tube("mouth", smile, [0.0] + [0.24] * 10 + [0.0], ring=12), lips, Matrix.Identity(4), group)


def chef_eyes(scene, group):
    eyes = [(on_head(a, 15.0, 0.15), a) for a in (0.15, 0.7)]
    add_eyes(scene, group, eyes, 0.0, size=0.72, angry=False, brow_colour="#A9782C")


def build_chef_hat(scene, group):
    """Toque: a pleated band with a puffed crown."""
    cloth = fabric("toque", "#F6F6F2", sheen=0.6, folds=0.9)
    band = tube("band", [Vector((0.6, 0, z)) for z in (16.4, 16.45, 19.5, 19.55)], [0.0, 5.7, 5.7, 0.0], ring=64)
    place(scene, "band", band, cloth, Matrix.Identity(4), group)
    for x, z, r in ((-2.8, 22.6, 3.6), (2.2, 23.0, 3.8), (0.0, 25.4, 3.4), (-0.6, 21.0, 4.0), (3.4, 21.2, 3.0)):
        place(scene, "puff", ellipsoid("puff", (r, r * 0.95, r)), cloth, Matrix.Translation(Vector((x, 0.0, z))), group)


def build_chef_ponytail(scene, group):
    """Ponytail hanging from its tie at the rig origin, down and back (towards -x)."""
    path = [(0.4, -0.2), (0.2, 0.3), (-1.2, 2.4), (-2.6, 5.2), (-3.3, 7.8), (-3.0, 9.6), (-2.7, 10.0)]
    centres = [rig_point(x, y) for x, y in path]
    radii = [0.0, 1.5, 1.85, 1.6, 1.15, 0.55, 0.0]
    place(scene, "ponytail", tube("ponytail", centres, radii, ring=48), hair_material(), Matrix.Identity(4), group)
    tie = glossy("tie", "#C8433C", roughness=0.4, coat=0.3)
    place(scene, "tie", ellipsoid("tie", (0.9, 1.6, 1.6)), tie, Matrix.Translation(rig_point(0.4, 0.2)), group)


def build_chef_body(scene, group):
    """White jacket with two rows of buttons and a red neckerchief."""
    jacket = fabric("jacket", "#F4F4F0", sheen=0.5, folds=0.6)
    heights = [-3.6, -3.4, -2.0, 1.0, 3.6, 6.5, 8.4, 9.4, 9.8]
    widths = [0.0, 3.4, 3.9, 3.4, 3.6, 4.4, 4.5, 2.6, 0.0]
    torso = tube("torso", [Vector((0.0, 0.0, z)) for z in heights], widths, ring=64, squash=0.78)
    place(scene, "torso", torso, jacket, Matrix.Identity(4), group)
    for side in (-1, 1):
        shoulder = ellipsoid("shoulder", (1.5, 1.4, 1.45))
        place(scene, "shoulder", shoulder, jacket, Matrix.Translation(Vector((4.0 * side, 0.0, 7.2))), group)
    buttons = glossy("buttons", "#D8D2C2", roughness=0.3, coat=0.6)
    for x in (0.7, 2.3):
        for z in (6.0, 3.6, 1.2):
            radius = float(np.interp(z, heights, widths))
            y = -radius * 0.78 * math.sqrt(max(0.0, 1 - (x / radius) ** 2))
            place(scene, "button", ellipsoid("button", (0.45, 0.3, 0.45), 16), buttons, Matrix.Translation(Vector((x, y - 0.05, z))), group)
    scarf = fabric("scarf", "#D8433C", sheen=0.3, folds=0.5)
    place(scene, "collar", ellipsoid("collar", (2.9, 2.5, 1.1), 48), scarf, Matrix.Translation(Vector((0.3, -0.2, 9.2))), group)
    place(scene, "knot", ellipsoid("knot", (1.2, 0.9, 1.0)), scarf, Matrix.Translation(Vector((1.2, -2.6, 8.5))), group)
    for angle, offset in ((0.35, (0.6, 7.1)), (-0.25, (1.9, 7.2))):
        tail = Matrix.Translation(Vector((offset[0], -2.9, offset[1]))) @ Matrix.Rotation(angle, 4, "Y")
        place(scene, "tail", ellipsoid("tail", (0.8, 0.5, 1.6)), scarf, tail, group)


def build_chef_leg(scene, group):
    trousers = fabric("trousers", "#4F6FB5", sheen=0.3, folds=0.8)
    leg = tube("trouser", [rig_point(0, y) for y in (-0.5, 0.2, 4.0, 7.2, 7.6)], [0.0, 1.65, 1.5, 1.4, 0.0], ring=32)
    place(scene, "trouser", leg, trousers, Matrix.Identity(4), group)
    shoe = glossy("chefShoe", "#1E1E23", roughness=0.25, coat=0.8, coat_roughness=0.08)
    place(scene, "shoe", ellipsoid("shoe", (2.3, 1.5, 1.1)), shoe, Matrix.Translation(rig_point(0.9, 7.8)), group)


def build_chef_arm(scene, group):
    jacket = fabric("sleeve", "#F4F4F0", sheen=0.5, folds=0.5)
    sleeve = tube("sleeve", [rig_point(0, y) for y in (0.0, 0.1, 3.0, 6.0, 6.4)], [0.0, 1.4, 1.3, 1.2, 0.0], ring=32)
    place(scene, "sleeve", sleeve, jacket, Matrix.Identity(4), group)
    place(scene, "shoulder", ellipsoid("shoulder", (1.5, 1.4, 1.45)), jacket, Matrix.Identity(4), group)
    place(scene, "hand", ellipsoid("hand", (1.1, 1.0, 1.2)), skin_material(), Matrix.Translation(rig_point(0.1, 7.3)), group)


CHEF_PARTS = {
    "chef.legLeft": (rect_from(0, 0, 8, 9, 0.5, 0.0), build_chef_leg),
    "chef.legRight": (rect_from(0, 0, 8, 9, 0.5, 0.0), build_chef_leg),
    "chef.armLeft": (rect_from(0, 0, 6, 11, 0.5, 0.18), build_chef_arm),
    "chef.armRight": (rect_from(0, 0, 6, 11, 0.5, 0.18), build_chef_arm),
    "chef.body": (rect_from(0, 4, 18, 14, 0.5, 1.0), build_chef_body),
    "chef.head": (rect_from(0.5, -13.5, 16, 14), build_chef_head),
    "chef.eyes": (rect_from(1.2, -15, 8, 5), chef_eyes),
    "chef.hat": (rect_from(0, -16.4, 20, 13, 0.5, 1.0), build_chef_hat),
    "chef.ponytail": (rect_from(0, 0, 8, 11, 0.85, 0.08), build_chef_ponytail),
}


def render_chef(samples):
    scene = new_scene(samples)
    group = []
    for graphic, (rect, build) in CHEF_PARTS.items():
        build(scene, group)
        render_part(scene, graphic, rect)
        clear_group(group)


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="characters.py")
    parser.add_argument("--only", choices=sorted(ENEMIES) + ["chef"], action="append")
    parser.add_argument("--samples", type=int, default=256)
    args = parser.parse_args(argv)
    os.makedirs(CHARACTER_PREVIEWS, exist_ok=True)
    for kind in args.only or [*ENEMIES, "chef"]:
        if kind == "chef":
            render_chef(args.samples)
        else:
            render_enemy(kind, args.samples)


main()

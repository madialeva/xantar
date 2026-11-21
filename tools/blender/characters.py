"""Renderer for the character graphics (enemies and chef) of the game.

The game animates characters as rigs of separate images, so every part is rendered on its own,
framed exactly as the rig places it. Parts are modelled in rig space: Blender x is the rig's x,
Blender z is the rig's y turned upwards (z = -y), the origin is the centre of the character's
tile and the feet touch y = +10. Characters face right; the game mirrors them.

Run from the repository root:
    blender -b --factory-startup --python tools/blender/characters.py -- [--only onion] [--samples N]

Writes <graphic>.png at 4x the logical size to the art sources (src/view/art/sources/), and
a preview of each part to tmp/blender/characters/. The rectangles here must match the parts'
places in src/view/rigs/rigs.ts and their sizes in the graphics catalogue.
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
    PREVIEW_DIR,
    add,
    board_point,
    bump,
    centred,
    feed,
    map_range,
    math_op,
    new_material,
    new_scene,
    noise4,
    principled,
    ramp,
    render_framed,
    scaled,
    srgb,
    use_displacement,
    voronoi4,
)

CHARACTER_PREVIEWS = os.path.join(PREVIEW_DIR, "characters")


def dance_frames(kind, name):
    """The frames a dancing body steps through, from -1 to 1, the middle one being the body."""
    return {
        f"{kind}.{name}Back2": -1.0,
        f"{kind}.{name}Back1": -0.5,
        f"{kind}.body": 0.0,
        f"{kind}.{name}Front1": 0.5,
        f"{kind}.{name}Front2": 1.0,
    }


rig_point = board_point


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


def onion_material():
    """Red onion: concentric layers of juicy white flesh, each edged with violet, inside a glossy
    purple skin. Built for a slice whose faces lie across y, with the centre at the origin."""
    material, tree = new_material("onion")
    bsdf, _ = principled(tree)
    vector, split = object_coords(tree)
    radial = math_op(
        tree,
        "SQRT",
        add(tree, math_op(tree, "MULTIPLY", split.outputs["X"], split.outputs["X"]), math_op(tree, "MULTIPLY", split.outputs["Z"], split.outputs["Z"])),
    )
    wobble = noise4(tree, vector, 0.0, 0.18, detail=3)
    fine = noise4(tree, vector, 0.0, 1.6, detail=5)
    radius = add(tree, radial, centred(tree, wobble, 0.9))
    layer = math_op(tree, "FRACT", math_op(tree, "DIVIDE", math_op(tree, "SUBTRACT", radius, ONION_CORE), ONION_LAYER))
    edge = map_range(tree, layer, 0.5, 0.82, 0.0, 1.0)
    outer = map_range(tree, radial, 0.0, ONION_RADIUS, 0.55, 1.0)
    rings = scaled(tree, math_op(tree, "MULTIPLY", edge, outer), 0.7)
    skin = map_range(tree, radial, ONION_RADIUS - 1.0, ONION_RADIUS - 0.55, 0.0, 1.0)
    level = add(tree, math_op(tree, "MAXIMUM", rings, skin), centred(tree, fine, 0.06), clamp=True)
    stops = [(0.0, "#FAF3F8"), (0.2, "#F0DCEC"), (0.4, "#D59ACB"), (0.6, "#A2408F"), (0.75, "#7E2672"), (0.9, "#5E1A55"), (1.0, "#46123F")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    bsdf.inputs["Roughness"].default_value = 0.28
    bsdf.inputs["Coat Weight"].default_value = 0.65
    bsdf.inputs["Coat Roughness"].default_value = 0.08
    bsdf.inputs["Subsurface Weight"].default_value = 0.3
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.95)
    bsdf.inputs["Subsurface Scale"].default_value = 0.6
    feed(tree, bsdf.inputs["Normal"], bump(tree, add(tree, edge, scaled(tree, fine, 0.3)), 0.18, 0.25))
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


ONION_RADIUS = 12.0
ONION_THICKNESS = 5.0
ONION_CORE = 1.4
ONION_LAYER = 2.05
ONION_CENTRE_Y = -9.0
ONION_TURN_DEGREES = 30


def onion_slice():
    """A thick round slice with rounded edges, its faces across y and its centre at the origin."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=128, radius1=ONION_RADIUS, radius2=ONION_RADIUS, depth=ONION_THICKNESS)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "X"))
    rims = [edge for edge in bm.edges if all(abs(abs(v.co.y) - ONION_THICKNESS / 2) < 1e-4 and v.co.xz.length > ONION_RADIUS - 1e-3 for v in edge.verts) and edge.verts[0].co.y * edge.verts[1].co.y > 0]
    bmesh.ops.bevel(bm, geom=rims, offset=0.9, offset_type="OFFSET", segments=5, profile=0.5, affect="EDGES")
    mesh = bpy.data.meshes.new("onion")
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    return mesh


def build_onion(scene, group, turn=0.0):
    """Mr Onion: a slice of red onion standing on its edge, turned `turn` degrees about the
    horizontal axis: face-on at 0, edge-on at 90."""
    matrix = Matrix.Translation(rig_point(0.0, ONION_CENTRE_Y)) @ Matrix.Rotation(math.radians(turn), 4, "X")
    place(scene, "onion", onion_slice(), onion_material(), matrix, group)


def onion_eyes(scene, group):
    """Eyes peeking over the top edge of the slice."""
    top = -(ONION_CENTRE_Y - ONION_RADIUS)
    eyes = [(Vector((x, -3.0, top + 1.5)), 0.0) for x in (-1.0, 3.4)]
    add_eyes(scene, group, eyes, 0.0, size=0.9)


def turn_frames(kind):
    """The frames of half a turn of a spinning body, from face-on (its base pose) in equal steps."""
    names = [f"{kind}.body"] + [f"{kind}.turn{step}" for step in range(1, 6)]
    return {name: step * ONION_TURN_DEGREES for step, name in enumerate(names)}


# --- Shared: a smiling mouth ---


def mouth_edges(s, z0, smile, height):
    """Top and bottom of a grin at `s` (-1..1 across): a top edge curling up at the corners and
    a bottom edge dropping deepest in the middle, meeting at the corners."""
    top = z0 + smile * s * s
    return top, top - height * max(0.0, 1 - s * s) ** 0.8


def add_mouth(scene, group, axis, radius, a0, z0, half_width, smile, height, lift):
    """A smiling mouth on the surface of an upright body: dark inside, one continuous row of
    teeth along the top and a little tongue at the bottom. `axis(z)` and `radius(z)` describe
    the surface; the mouth is centred `a0` radians round from the camera to the facing side."""
    inside = glossy("mouth", "#2A0906", roughness=0.35, coat=0.6, coat_roughness=0.1)
    teeth = glossy("teeth", "#FBF7EC", roughness=0.25, coat=0.6, coat_roughness=0.08, sss=0.2)
    tongue = glossy("tongue", "#C4424E", roughness=0.35, coat=0.5, coat_roughness=0.12, sss=0.3)

    def at(a, z, extra):
        r = radius(z) + lift + extra
        return Vector((axis(z) + r * math.sin(a), -r * math.cos(a), z))

    def patch(name, material, extra, span, edges, columns=48, rows=8):
        verts, faces = [], []
        for i in range(columns + 1):
            s = span * (2 * i / columns - 1)
            upper, lower = edges(s)
            for j in range(rows + 1):
                verts.append(at(a0 + s * half_width, upper + (lower - upper) * j / rows, extra))
        for i in range(columns):
            for j in range(rows):
                a = i * (rows + 1) + j
                faces.append((a, a + rows + 1, a + rows + 2, a + 1))
        obj = place(scene, name, weld(name, verts, faces), material, Matrix.Identity(4), group)
        obj.modifiers.new("thickness", "SOLIDIFY").thickness = 0.2

    edges = lambda s: mouth_edges(s, z0, smile, height)  # noqa: E731
    patch("mouth", inside, 0.0, 1.0, edges)

    def row_of_teeth(s):
        top, _ = edges(s)
        return top + 0.02, top - 0.36 * height * max(0.0, 1 - s * s) ** 0.5

    patch("teeth", teeth, 0.06, 1.0, row_of_teeth, rows=4)

    def tip_of_tongue(s):
        _, bottom = edges(s)
        u = s / 0.45
        return bottom + 0.34 * height * max(0.0, 1 - u * u) ** 0.5, bottom - 0.02

    patch("tongue", tongue, 0.04, 0.45, tip_of_tongue, columns=24, rows=4)


def in_mouth(a, z, a0, z0, half_width, smile, height, margin):
    """Whether a point of the surface (angle, height) falls in a mouth, give or take `margin`."""
    s = (a - a0) / half_width
    if abs(s) > 1 + margin / max(half_width * 5.0, 1e-6):
        return False
    top, bottom = mouth_edges(max(-1.0, min(1.0, s)), z0, smile, height)
    return bottom - margin < z < top + margin


# --- Mr Chorizo: a link of fresh Galician chorizo ---

CHORIZO_RADIUS = 5.6
CHORIZO_BOTTOM = -3.0
CHORIZO_TOP = 24.5
CHORIZO_BOW = 3.4
CHORIZO_EYES_Z = 15.8
CHORIZO_MOUTH = {"a0": 0.42, "z0": 11.2, "half_width": 0.58, "smile": 0.75, "height": 2.2}


def vector_scaled(tree, vector, factors):
    node = tree.nodes.new("ShaderNodeVectorMath")
    node.operation = "MULTIPLY"
    tree.links.new(vector, node.inputs[0])
    node.inputs[1].default_value = factors
    return node.outputs[0]


def vector_added(tree, vector, other):
    node = tree.nodes.new("ShaderNodeVectorMath")
    node.operation = "ADD"
    tree.links.new(vector, node.inputs[0])
    tree.links.new(other, node.inputs[1])
    return node.outputs[0]


def chorizo_material():
    """Fresh Galician chorizo, as in the author's photo: a smooth, glossy casing, paprika red
    turning orange in the light, with streaks of fat showing through in orange and yellow."""
    material, tree = new_material("chorizo")
    bsdf, _ = principled(tree)
    vector, split = object_coords(tree)
    mottle = noise4(tree, vector, 3.0, 0.2, detail=3)
    warp = tree.nodes.new("ShaderNodeTexNoise")
    warp.noise_dimensions = "3D"
    tree.links.new(vector, warp.inputs["Vector"])
    warp.inputs["Scale"].default_value = 0.5
    warp.inputs["Detail"].default_value = 3
    offset = vector_scaled(tree, warp.outputs["Color"], (1.6, 1.6, 1.6))
    cells = tree.nodes.new("ShaderNodeTexVoronoi")
    cells.voronoi_dimensions = "4D"
    tree.links.new(vector_scaled(tree, vector_added(tree, vector, offset), (1.0, 1.0, 0.5)), cells.inputs["Vector"])
    cells.inputs["Scale"].default_value = 0.75
    cells.inputs["W"].default_value = 4.1
    pick = tree.nodes.new("ShaderNodeSeparateColor")
    tree.links.new(cells.outputs["Color"], pick.inputs[0])
    blob = map_range(tree, cells.outputs["Distance"], 0.5, 0.28, 0.0, 1.0)
    fat = math_op(tree, "MULTIPLY", blob, map_range(tree, pick.outputs[0], 0.3, 0.42, 0.0, 1.0))
    level = add(tree, 0.55, centred(tree, mottle, 0.5), clamp=True)
    meat = ramp(tree, level, [(0.0, "#6E1A0C"), (0.3, "#9C2C16"), (0.6, "#BA401E"), (0.85, "#CE5428"), (1.0, "#DC6A34")])
    fat_colour = ramp(tree, add(tree, scaled(tree, blob, 0.6), centred(tree, mottle, 0.4), clamp=True), [(0.0, "#D9782E"), (0.5, "#EE9F45"), (1.0, "#F6C064")])
    mix = tree.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    feed(tree, mix.inputs["Factor"], scaled(tree, fat, 0.7))
    tree.links.new(meat, mix.inputs["A"])
    tree.links.new(fat_colour, mix.inputs["B"])
    tree.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.32
    bsdf.inputs["Coat Weight"].default_value = 0.55
    bsdf.inputs["Coat Roughness"].default_value = 0.12
    bsdf.inputs["Subsurface Weight"].default_value = 0.2
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.2)
    bsdf.inputs["Subsurface Scale"].default_value = 0.6
    fine = noise4(tree, vector, 0.0, 1.8, detail=4)
    feed(tree, bsdf.inputs["Normal"], bump(tree, add(tree, fine, scaled(tree, fat, 0.3)), 0.06, 0.1))
    return material


def string_material():
    """The thin red string the links are tied with."""
    material, tree = new_material("string")
    bsdf, _ = principled(tree)
    vector, split = object_coords(tree)
    fibres = noise4(tree, vector, 0.0, 6.0, detail=4)
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, fibres, [(0.0, "#7E0A12"), (0.5, "#B3141E"), (1.0, "#D0303A")]))
    bsdf.inputs["Roughness"].default_value = 0.7
    feed(tree, bsdf.inputs["Normal"], bump(tree, fibres, 0.3, 0.1))
    return material


def chorizo_radius(z):
    """Plump and smooth, rounded at the ends and pinched into the tie like a stuffed casing."""
    t = (z - CHORIZO_BOTTOM) / (CHORIZO_TOP - CHORIZO_BOTTOM)
    body = max(0.0, 1 - abs(2 * t - 1) ** 2.4) ** (1 / 2.4)
    return max(1.15, CHORIZO_RADIUS * body)


def chorizo_axis(bend):
    """The centre line of the link bowed sideways by `bend` (-1..1)."""
    return lambda z: CHORIZO_BOW * bend * math.sin(math.pi * (z - CHORIZO_BOTTOM) / (CHORIZO_TOP - CHORIZO_BOTTOM))


def string_turns(scene, group, centre, radius, count, material):
    for k in range(count):
        ring = [centre + Vector((radius * math.cos(a), radius * math.sin(a), 0.3 * k + 0.08 * math.sin(a))) for a in np.linspace(0, 2 * math.pi, 33)]
        place(scene, "turn", tube("turn", ring, [0.18] * len(ring), ring=10), material, Matrix.Identity(4), group)


def build_chorizo(scene, group, bend=0.0):
    """Mr Chorizo: a plump, smooth link of fresh Galician chorizo standing up like a sausage,
    bowed sideways by `bend` (-1..1), tied with red string at both ends and grinning."""
    meat = chorizo_material()
    string = string_material()
    axis = chorizo_axis(bend)
    stations = [(1 - math.cos(math.pi * i / 119)) / 2 for i in range(120)]
    zs = [CHORIZO_BOTTOM + (CHORIZO_TOP - CHORIZO_BOTTOM) * t for t in stations]
    place(scene, "chorizo", tube("chorizo", [Vector((axis(z), 0, z)) for z in zs], [chorizo_radius(z) for z in zs], ring=96), meat, Matrix.Identity(4), group)
    for z, sign in ((CHORIZO_TOP - 0.2, 1), (CHORIZO_BOTTOM + 0.2, -1)):
        string_turns(scene, group, Vector((axis(z), 0.0, z - (0.45 if sign > 0 else 0.2))), 1.3, 3, string)
    place(scene, "nub", ellipsoid("nub", (1.5, 1.5, 1.2)), meat, Matrix.Translation(Vector((0.0, 0.0, CHORIZO_BOTTOM - 0.9))), group)
    add_mouth(scene, group, axis, chorizo_radius, lift=0.05, **CHORIZO_MOUTH)


def build_chorizo_knot(scene, group):
    """The twisted end of the casing above the tie, with a loose end of red string trailing
    behind: it bobs and swings as the chorizo walks."""
    meat = chorizo_material()
    string = string_material()
    base = Vector((0.0, 0.0, CHORIZO_TOP + 0.6))
    neck = tube("neck", [base + Vector((0, 0, h)) for h in (-0.8, 0.0, 0.5, 1.4, 2.3, 2.8, 3.0)], [1.2, 1.1, 1.25, 1.6, 1.45, 0.8, 0.0], ring=48)
    place(scene, "nub", neck, meat, Matrix.Identity(4), group)
    tails = (
        [(0.0, 0.0), (-1.2, 0.4), (-2.6, 0.2), (-3.8, -0.8), (-4.6, -2.2), (-5.0, -3.6)],
        [(0.0, 0.0), (0.9, 0.5), (1.7, 0.9), (2.3, 0.8)],
    )
    for points in tails:
        path = [base + Vector((x, -0.9, z - 0.3)) for x, z in points]
        radii = [0.18] * (len(path) - 1) + [0.0]
        place(scene, "tail", tube("tail", path, radii, ring=10), string, Matrix.Identity(4), group)


def chorizo_eyes(scene, group):
    z = CHORIZO_EYES_Z
    radius = chorizo_radius(z)
    eyes = []
    for angle in (0.12, 0.72):
        surface = Vector((radius * math.sin(angle), -radius * math.cos(angle), z))
        eyes.append((surface + Vector((math.sin(angle), -math.cos(angle), 0.0)) * 0.2, angle))
    add_eyes(scene, group, eyes, 0.0, size=1.0)


# --- Mr Corn: a corn cob ---

COB_BOTTOM = -2.5
COB_TOP = 20.5
COB_RADIUS = 5.4
COB_ROWS = 16
COB_MOUTH = {"a0": 0.4, "z0": 9.0, "half_width": 0.52, "smile": 0.75, "height": 2.1}


def cob_radius(z):
    u = (z - COB_BOTTOM) / (COB_TOP - COB_BOTTOM)
    taper = 1 - 0.38 * u**1.6
    ends = max(0.0, 1 - abs(2 * u - 1) ** 3.2) ** (1 / 3.2)
    return COB_RADIUS * taper * ends


def kernel_material():
    """Sweet corn kernels: plump, glossy and a little translucent, each its own shade of yellow."""
    material, tree = new_material("kernel")
    bsdf, _ = principled(tree)
    shade = tree.nodes.new("ShaderNodeAttribute")
    shade.attribute_name = "shade"
    vector, split = object_coords(tree)
    fine = noise4(tree, vector, 0.0, 2.5, detail=3)
    level = add(tree, scaled(tree, shade.outputs["Fac"], 0.8), centred(tree, fine, 0.2), clamp=True)
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, [(0.0, "#E8A512"), (0.4, "#F4BE24"), (0.75, "#FBD043"), (1.0, "#FFE27A")]))
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.08
    bsdf.inputs["Subsurface Weight"].default_value = 0.35
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.8, 0.25)
    bsdf.inputs["Subsurface Scale"].default_value = 0.5
    return material


def husk_material():
    """Fresh husk: green leaves with fine veins along them, paler and yellowish at the tips."""
    material, tree = new_material("husk")
    bsdf, _ = principled(tree)
    along = tree.nodes.new("ShaderNodeAttribute")
    along.attribute_name = "along"
    across = tree.nodes.new("ShaderNodeAttribute")
    across.attribute_name = "across"
    veins = math_op(tree, "ABSOLUTE", math_op(tree, "SINE", scaled(tree, across.outputs["Fac"], 26.0)))
    vector, split = object_coords(tree)
    mottle = noise4(tree, vector, 0.0, 0.6, detail=3)
    level = add(tree, scaled(tree, along.outputs["Fac"], 0.55), scaled(tree, veins, 0.18), centred(tree, mottle, 0.2), clamp=True)
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, [(0.0, "#4D7F27"), (0.35, "#6FA23A"), (0.7, "#97C25A"), (1.0, "#D2DC8C")]))
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Coat Weight"].default_value = 0.2
    bsdf.inputs["Subsurface Weight"].default_value = 0.25
    bsdf.inputs["Subsurface Radius"].default_value = (0.5, 1.0, 0.3)
    bsdf.inputs["Subsurface Scale"].default_value = 0.3
    feed(tree, bsdf.inputs["Normal"], bump(tree, veins, 0.15, 0.1))
    return material


def silk_material():
    material, tree = new_material("silk")
    bsdf, _ = principled(tree)
    along = tree.nodes.new("ShaderNodeAttribute")
    along.attribute_name = "along"
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, along.outputs["Fac"], [(0.0, "#F6E7B0"), (0.5, "#E6C27A"), (1.0, "#B07A3E")]))
    bsdf.inputs["Roughness"].default_value = 0.35
    bsdf.inputs["Coat Weight"].default_value = 0.4
    bsdf.inputs["Subsurface Weight"].default_value = 0.3
    return material


def build_cob(scene, group):
    """Mr Corn: an upright cob of sweet corn, rows of plump yellow kernels on a pale core."""
    core = glossy("core", "#D9A21E", roughness=0.5, coat=0.0)
    stations = [(1 - math.cos(math.pi * i / 63)) / 2 for i in range(64)]
    zs = [COB_BOTTOM + (COB_TOP - COB_BOTTOM) * t for t in stations]
    place(scene, "core", tube("core", [Vector((0, 0, z)) for z in zs], [max(0.0, cob_radius(z) - 0.75) for z in zs], ring=48), core, Matrix.Identity(4), group)
    rng = random.Random(3)
    bm = bmesh.new()
    shades = []
    pitch = 1.5
    count = int((COB_TOP - COB_BOTTOM) / pitch)
    for row in range(COB_ROWS):
        phase = 2 * math.pi * row / COB_ROWS + rng.uniform(-0.03, 0.03)
        for k in range(count):
            z = COB_BOTTOM + pitch * (k + 0.5) + (pitch / 2 if row % 2 else 0.0) * 0.3
            r = cob_radius(z)
            if r < 1.6:
                continue
            around = (phase + math.pi / 2 + math.pi) % (2 * math.pi) - math.pi
            if in_mouth(around, z, margin=0.35, **COB_MOUTH):
                continue
            width = math.pi * r / COB_ROWS * 1.0
            size = (width, 0.75, pitch * 0.54)
            normal = Vector((math.cos(phase), math.sin(phase), 0.0))
            matrix = Matrix.Translation(normal * (r - 0.35) + Vector((0, 0, z))) @ Matrix.Rotation(phase + math.pi / 2, 4, "Z") @ Matrix.Diagonal((size[0], size[1], size[2], 1.0))
            before = len(bm.verts)
            bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0, matrix=matrix)
            shades += [rng.random()] * (len(bm.verts) - before)
    mesh = bpy.data.meshes.new("kernels")
    bm.to_mesh(mesh)
    bm.free()
    mesh.attributes.new(name="shade", type="FLOAT", domain="POINT").data.foreach_set("value", shades)
    mesh.shade_smooth()
    place(scene, "kernels", mesh, kernel_material(), Matrix.Identity(4), group)
    add_mouth(scene, group, lambda z: 0.0, cob_radius, lift=0.05, **COB_MOUTH)


def leaf_mesh(azimuth, length, width, droop):
    """A husk leaf peeled down from the bottom of the cob, flaring out like a skirt."""
    out = Vector((math.cos(azimuth), math.sin(azimuth), 0.0))
    side = Vector((-math.sin(azimuth), math.cos(azimuth), 0.0))
    verts, faces, alongs, acrosses = [], [], [], []
    rows, cols = 24, 9
    for i in range(rows + 1):
        s = i / rows
        spine = out * (3.6 + length * 0.62 * s**1.15) + Vector((0, 0, 0.8 - length * droop * s + 2.0 * s * s))
        half = width * math.sin(math.pi * min(1.0, 0.12 + s) ** 0.75) * (1 - s) ** 0.35
        for j in range(cols):
            v = 2 * j / (cols - 1) - 1
            cup = 0.6 * v * v * (1 - s)
            p = spine + side * (half * v) - out * cup + Vector((0, 0, 0.15 * math.sin(7 * s + v) * s))
            verts.append(p)
            alongs.append(s)
            acrosses.append(v)
    for i in range(rows):
        for j in range(cols - 1):
            a = i * cols + j
            faces.append((a, a + 1, a + cols + 1, a + cols))
    mesh = bpy.data.meshes.new("leaf")
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    mesh.attributes.new(name="along", type="FLOAT", domain="POINT").data.foreach_set("value", alongs)
    mesh.attributes.new(name="across", type="FLOAT", domain="POINT").data.foreach_set("value", acrosses)
    mesh.shade_smooth()
    return mesh


HUSK_LEAVES = [(-0.35, 11.0, 3.4, 0.62), (math.pi + 0.35, 11.0, 3.4, 0.62), (0.75, 10.0, 3.2, 0.55), (math.pi - 0.75, 10.0, 3.2, 0.55), (-math.pi / 2 + 0.25, 8.5, 3.6, 0.7)]


def build_husk(scene, group, front):
    """The husk leaves on one side of the cob: those in front of it or those behind."""
    material = husk_material()
    for azimuth, length, width, droop in HUSK_LEAVES:
        if (math.sin(azimuth) < 0) != front:
            continue
        obj = place(scene, "leaf", leaf_mesh(azimuth, length, width, droop), material, Matrix.Translation(Vector((0, 0, COB_BOTTOM + 1.2))), group)
        solid = obj.modifiers.new("thickness", "SOLIDIFY")
        solid.thickness = 0.25


def build_husk_front(scene, group):
    build_husk(scene, group, True)


def build_husk_back(scene, group):
    build_husk(scene, group, False)


def build_silk(scene, group):
    """The tassel of silk at the tip of the cob, like a tuft of hair."""
    material = silk_material()
    rng = random.Random(4)
    tip = Vector((0, 0, COB_TOP - 0.6))
    for k in range(40):
        azimuth = rng.uniform(0, 2 * math.pi)
        lean = rng.uniform(0.2, 1.25)
        length = rng.uniform(3.0, 5.8)
        curl = rng.uniform(-1.2, 1.2)
        direction = Vector((math.cos(azimuth) * math.sin(lean), math.sin(azimuth) * math.sin(lean) * 0.6, math.cos(lean)))
        points, radii, alongs = [], [], []
        for i in range(13):
            s = i / 12
            bend = Vector((curl * s * s, 0, -1.6 * s * s * lean))
            points.append(tip + direction * (length * s) + bend)
            radii.append(0.13 * (1 - 0.6 * s) if i < 12 else 0.0)
            alongs.append(s)
        mesh = tube("thread", points, radii, ring=8)
        values = []
        for s in alongs:
            values += [s] * 8
        mesh.attributes.new(name="along", type="FLOAT", domain="POINT").data.foreach_set("value", values[: len(mesh.vertices)] + [1.0] * max(0, len(mesh.vertices) - len(values)))
        place(scene, "thread", mesh, material, Matrix.Identity(4), group)


def cob_eyes(scene, group):
    z = 13.0
    radius = cob_radius(z) + 0.45
    eyes = []
    for angle in (0.1, 0.7):
        surface = Vector((radius * math.sin(angle), -radius * math.cos(angle), z))
        eyes.append((surface + Vector((math.sin(angle), -math.cos(angle), 0.0)) * 0.3, angle))
    add_eyes(scene, group, eyes, 0.0, size=0.95)


# --- Rendering ---


def clear_group(group):
    for obj in group:
        mesh = obj.data
        bpy.data.objects.remove(obj)
        if mesh and mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    group.clear()


def render_part(scene, graphic, rect):
    render_framed(scene, graphic, rect, CHARACTER_PREVIEWS)


def rect_from(x, y, width, height, origin_x=0.5, origin_y=0.5):
    """The image rectangle of a rig part placed at (x, y) with the given origin."""
    return (x - origin_x * width, y - origin_y * height, width, height)


LEG_RECT = rect_from(0, 0, 6, 8, 0.5, 0.0)

ENEMIES = {
    "chorizo": {
        "leg": "#8E2412",
        "body": rect_from(0, 5, 20, 30, 0.5, 1.0),
        "eyes": rect_from(2.6, -15.8, 12, 7),
        "build": build_chorizo,
        "frames": dance_frames("chorizo", "bend"),
        "add_eyes": chorizo_eyes,
        "parts": {"chorizo.knot": (rect_from(-0.5, -24.6, 14, 10, 0.5, 0.6), build_chorizo_knot)},
    },
    "onion": {
        "leg": "#7B2D6E",
        "body": rect_from(0, 4, 30, 30, 0.5, 1.0),
        "eyes": rect_from(1.2, -22.5, 12, 7),
        "build": build_onion,
        "frames": turn_frames("onion"),
        "add_eyes": onion_eyes,
    },
    "corn": {
        "leg": "#5F8F2E",
        "body": rect_from(0, 3, 14, 24, 0.5, 1.0),
        "eyes": rect_from(2.0, -13, 12, 7),
        "build": build_cob,
        "add_eyes": cob_eyes,
        "parts": {
            "corn.huskBack": (rect_from(0, -2.2, 28, 10, 0.5, 0.0), build_husk_back),
            "corn.huskFront": (rect_from(0, -2.2, 28, 10, 0.5, 0.0), build_husk_front),
            "corn.silk": (rect_from(0, -19, 14, 8, 0.5, 1.0), build_silk),
        },
    },
}


def render_enemy(kind, samples):
    """Renders an enemy's leg, eyes and extra parts, and its body: once, or once a frame for a
    body that dances by changing shape."""
    spec = ENEMIES[kind]
    scene = new_scene(samples)
    group = []
    add_leg(scene, group, spec["leg"])
    render_part(scene, f"{kind}.leg", LEG_RECT)
    clear_group(group)
    spec["add_eyes"](scene, group)
    render_part(scene, f"{kind}.eyes", spec["eyes"])
    clear_group(group)
    for graphic, (rect, build) in spec.get("parts", {}).items():
        build(scene, group)
        render_part(scene, graphic, rect)
        clear_group(group)
    frames = spec.get("frames")
    if frames is None:
        spec["build"](scene, group)
        render_part(scene, f"{kind}.body", spec["body"])
        clear_group(group)
        return
    for graphic, amount in frames.items():
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

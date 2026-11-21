"""Renderer for the burger ingredient graphics of the game.

Builds each ingredient procedurally, lights it with sun lamps only and renders it with Cycles.
One Blender unit is one logical unit of the board, and x runs along the four tiles of the
ingredient (a tile is one 18-unit cell, so an ingredient is 72 wide: about two chefs, as in
the original). The game draws the middle segment twice in a row, so nothing may change along x
from one tile to the next: directional light does not, and every texture, displacement and
pattern repeats exactly once per tile. The rounded ends must fit in the first and last tile. The
cheese hangs below its base, so it is rendered without the shadow catcher that hides what is
under the ground.

Run from the repository root:
    blender -b --factory-startup --python tools/blender/ingredients.py -- [--only patty] [--samples N] [--no-hero]

Writes the game slices (<kind>.left/mid/right.png at 4x the logical size) to the art sources
(src/view/art/sources/), and previews plus metrics.json to tmp/blender/. The visible
thickness of each ingredient in metrics.json gives INGREDIENT_THICKNESS in src/sim/rules.ts.
"""

import argparse
import json
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
    ROOT,
    ART_DIR,
    PREVIEW_DIR,
    TILE,
    TIER,
    SUPERSAMPLE,
    LIFT,
    BACKDROP,
    srgb,
    new_material,
    feed,
    math_op,
    add,
    scaled,
    centred,
    map_range,
    ramp,
    periodic_coords,
    noise4,
    voronoi4,
    principled,
    bump,
    use_displacement,
    new_scene,
    add_sun,
    add_object,
    evaluated_points,
    load_rgba,
    save_rgba,
    to_linear,
    to_srgb,
    downsample,
    over,
    enlarge,
)


TILES = 4
WIDTH = TILE * TILES
HERO_SCALE = 16
ELEVATION = math.radians(5)
BOTTOM_MARGIN = 1.0
TOP_MARGIN = 0.25


# --- Footprint and profiles ---


class Footprint:
    """Stadium outline of an ingredient seen from above: straight along x, half discs at the ends."""

    def __init__(self, edge, radius):
        self.radius = radius
        self.c0 = edge + radius
        self.c1 = WIDTH - edge - radius

    def spine(self, x):
        return min(max(x, self.c0), self.c1)

    def frames(self, spacing, end_share=1.0):
        """(spine point, outward direction, loop coordinate) round the outline, counter-clockwise
        from the front. The loop coordinate is x on the front and runs against x on the back;
        each rounded end takes about `end_share` of its arc length of it, adjusted so that the
        loop closes on a whole number of tiles."""
        straight = self.c1 - self.c0
        along = round(straight / spacing)
        if abs(along * spacing - straight) > 1e-6 or abs(TILE / spacing - round(TILE / spacing)) > 1e-6:
            raise SystemExit(f"A spacing of {spacing} must divide both the straight part and a tile")
        around = max(8, round(math.pi * self.radius / spacing))
        end = -straight + TILE * max(1, round((end_share * math.pi * self.radius + straight) / TILE))
        frames = []
        for i in range(along):
            x = self.c0 + spacing * i
            frames.append(((x, 0.0), (0.0, -1.0), x))
        for i in range(around):
            f = i / around
            a = -math.pi / 2 + math.pi * f
            frames.append(((self.c1, 0.0), (math.cos(a), math.sin(a)), self.c1 + end * f))
        for i in range(along):
            x = self.c1 - spacing * i
            frames.append(((x, 0.0), (0.0, 1.0), 2 * self.c1 + end - x))
        for i in range(around):
            f = i / around
            a = math.pi / 2 + math.pi * f
            frames.append(((self.c0, 0.0), (math.cos(a), math.sin(a)), 2 * self.c1 + end - self.c0 + end * f))
        return frames


def crown_profile(radius, height, foot=2.0, p=2.6, q=2.0):
    """Top bun: (r, z) from the bottom centre out round the edge and up to the crown."""
    points = [((radius - foot) * i / 6, 0.0) for i in range(6)]
    points += [
        (radius - foot + foot * math.cos(a), foot + foot * math.sin(a))
        for a in np.linspace(-math.pi / 2, 0, 10, endpoint=False)
    ]
    points += [
        (radius * max(math.cos(t), 0.0) ** (2 / p), foot + (height - foot) * math.sin(t) ** (2 / q))
        for t in np.linspace(0, math.pi / 2, 80)
    ]
    points[-1] = (0.0, height)
    return points


def heel_profile(radius, height, lip=0.6, p=2.4, q=2.0):
    """Bottom bun: widest at the cut, rounding down and in to a flat-ish base."""
    points = []
    for t in np.linspace(math.pi / 2, 0, 72):
        r = radius * max(math.cos(t), 0.0) ** (2 / p)
        z = height * (1 - math.sin(t) ** (2 / q))
        if z > height - lip:
            break
        points.append((r, z))
    rim_r, rim_z = points[-1]
    points += [
        (rim_r - lip + lip * math.cos(a), rim_z + (height - rim_z) * math.sin(a))
        for a in np.linspace(0, math.pi / 2, 7)[1:-1]
    ]
    points += [((rim_r - lip) * (1 - i / 8), height) for i in range(9)]
    points[0] = (0.0, 0.0)
    return points


def slab_profile(radius, height, m=8.0):
    """Patty: flat top and bottom joined by a rounded edge (a superellipse)."""
    half = height / 2
    points = [
        (radius * max(math.cos(t), 0.0) ** (2 / m), half + half * math.sin(t))
        for t in np.linspace(-math.pi / 2, math.pi / 2, 200)
    ]
    points[0], points[-1] = (0.0, 0.0), (0.0, height)
    return points


CROWN_TIP = 0.25


def crown_taper(x, edge):
    """How much of its height the top bun keeps along x: all of it in the middle tiles, which the
    game repeats, and down to CROWN_TIP at the tips over the first and last tile, along a curve
    that leaves the middle tiles flat, so that the bun reads as a dome from the front too."""
    into_end = max(TILE - x, x - (WIDTH - TILE), 0.0) / (TILE - edge)
    u = min(into_end, 1.0)
    return CROWN_TIP + (1.0 - CROWN_TIP) * (1.0 + math.cos(math.pi * u)) / 2


def resample(profile, spacing):
    """The same outline with points about `spacing` apart along it, keeping both ends."""
    points = np.array(profile)
    lengths = np.hypot(*np.diff(points, axis=0).T)
    distance = np.concatenate([[0.0], np.cumsum(lengths)])
    count = max(2, int(round(distance[-1] / spacing)) + 1)
    targets = np.linspace(0, distance[-1], count)
    return list(zip(np.interp(targets, distance, points[:, 0]), np.interp(targets, distance, points[:, 1])))


# --- Meshes ---


def finish_mesh(name, verts, faces, flat_top=None, attributes=None):
    """Welds the collapsed rows of a swept grid; faces flat at `flat_top` get material 1 and
    `attributes` (name -> one float per vertex) become point attributes for the shaders."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    for attribute, values in (attributes or {}).items():
        mesh.attributes.new(name=attribute, type="FLOAT", domain="POINT").data.foreach_set("value", values)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if flat_top is not None:
        for face in bm.faces:
            if all(v.co.z >= flat_top + LIFT - 1e-3 for v in face.verts):
                face.material_index = 1
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    return mesh


def grid_faces(frame_count, rows):
    faces = []
    for i in range(frame_count):
        n = (i + 1) % frame_count
        for j in range(rows - 1):
            faces.append((i * rows + j, n * rows + j, n * rows + j + 1, i * rows + j + 1))
    return faces


def sweep_mesh(name, footprint, profile, spacing, flat_top=None, height_at=None):
    """Sweeps a (r, z) profile round the footprint; `height_at(x, z)`, if given, reshapes the
    height of each point along the ingredient."""
    frames = footprint.frames(spacing)
    reshape = height_at or (lambda _x, z: z)
    verts = [
        (sx + r * nx, sy + r * ny, reshape(sx + r * nx, z) + LIFT)
        for (sx, sy), (nx, ny), _ in frames
        for r, z in profile
    ]
    return finish_mesh(name, verts, grid_faces(len(frames), len(profile)), flat_top)


def leaf_mesh(name, footprint, spacing, rings, top, hem, amp, waves, frill, crinkle, rng):
    """A lettuce leaf draped over the footprint: a low dome whose hem ruffles up and down and in
    and out, with softer crinkles across it. The ruffles follow the loop coordinate with whole
    numbers of waves per tile."""
    phases = [rng.uniform(0, 2 * math.pi) for _ in waves]
    swell_phase = rng.uniform(0, 2 * math.pi)
    total = sum(a for _, a in waves)
    frames = footprint.frames(spacing, end_share=0.6)
    verts, edge, loop = [], [], []
    for (sx, sy), (nx, ny), s in frames:
        angles = [2 * math.pi * n * s / TILE + phase for (n, _), phase in zip(waves, phases)]
        swell = 0.65 + 0.35 * math.sin(2 * math.pi * 1 * s / TILE + swell_phase)
        for j in range(rings + 1):
            u = j / rings
            wave = sum(a * math.sin(t + 1.3 * u) for (_, a), t in zip(waves, angles)) / total
            sway = sum(a * math.cos(t + 0.7 * u) for (_, a), t in zip(waves, angles)) / total
            folds = 0.6 * math.sin(2 * math.pi * 2 * s / TILE + 4.0 * u + swell_phase)
            folds += 0.4 * math.sin(2 * math.pi * 4 * s / TILE - 6.0 * u + 2 * swell_phase)
            r = u * footprint.radius + frill * u**3 * sway
            z = hem + (top - hem) * (1 - u * u) ** 0.8 + amp * swell * u**4 * wave
            z += crinkle * 4 * u * (1 - u) * folds
            verts.append((sx + r * nx, sy + r * ny, max(z, 0.2) + LIFT))
            edge.append(u)
            loop.append(s)
    faces = grid_faces(len(frames), rings + 1)
    return finish_mesh(name, verts, faces, attributes={"edge": edge, "loop": loop})


# --- Shader helpers ---


# --- Materials ---


def crust_material(name, height, stops, coat, relief_strength):
    """Baked crust: colour from how high the point is, mottled by tile-periodic noise."""
    material, tree = new_material(name)
    bsdf, _ = principled(tree)
    vector, z = periodic_coords(tree)
    blotch = noise4(tree, vector, z, 0.11, detail=3, roughness=0.55)
    spots = noise4(tree, vector, z, 0.38, detail=4, roughness=0.6)
    swell = noise4(tree, vector, z, 0.55, detail=5, roughness=0.55)
    grain = noise4(tree, vector, z, 1.6, detail=8, roughness=0.62)
    pores = voronoi4(tree, vector, z, 1.1)
    level = add(
        tree,
        math_op(tree, "DIVIDE", z, height),
        centred(tree, blotch, 0.3),
        centred(tree, spots, 0.14),
        centred(tree, grain, 0.08),
        clamp=True,
    )
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    feed(tree, bsdf.inputs["Roughness"], add(tree, 0.42, scaled(tree, grain, 0.25)))
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.3
    bsdf.inputs["Sheen Weight"].default_value = 0.25
    bsdf.inputs["Sheen Roughness"].default_value = 0.5
    bsdf.inputs["Sheen Tint"].default_value = srgb("#fff3e6")
    bsdf.inputs["Subsurface Weight"].default_value = 0.1
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.55, 0.3)
    bsdf.inputs["Subsurface Scale"].default_value = 1.2
    relief = add(tree, swell, scaled(tree, grain, 0.45), scaled(tree, pores, 0.25))
    feed(tree, bsdf.inputs["Normal"], bump(tree, relief, relief_strength, 0.5))
    feed(tree, bsdf.inputs["Coat Normal"], bump(tree, swell, 0.12, 0.5))
    return material


def crumb_material():
    """The cut face of the heel: soft, matte, porous and lightly toasted."""
    material, tree = new_material("crumb")
    bsdf, _ = principled(tree)
    vector, z = periodic_coords(tree)
    blotch = noise4(tree, vector, z, 0.16, detail=3, roughness=0.5)
    pores = voronoi4(tree, vector, z, 0.6)
    level = add(tree, 0.25, centred(tree, blotch, 0.4), map_range(tree, pores, 0.05, 0.3, 0.6, 0.0), clamp=True)
    stops = [(0.0, "#F6EBD4"), (0.35, "#EFDDB8"), (0.65, "#DCC096"), (1.0, "#B8956A")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    bsdf.inputs["Roughness"].default_value = 0.8
    bsdf.inputs["Subsurface Weight"].default_value = 0.35
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.7, 0.45)
    bsdf.inputs["Subsurface Scale"].default_value = 1.0
    feed(tree, bsdf.inputs["Normal"], bump(tree, pores, 0.6, 0.4))
    return material


def seed_material():
    """Sesame seed: pale, a little translucent and glossy, each one tinted by its object colour."""
    material, tree = new_material("seed")
    bsdf, _ = principled(tree)
    info = tree.nodes.new("ShaderNodeObjectInfo")
    stops = [(0.0, "#FBF3E0"), (0.55, "#F2E2BE"), (1.0, "#E0C390")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, info.outputs["Color"], stops))
    bsdf.inputs["Roughness"].default_value = 0.38
    bsdf.inputs["Coat Weight"].default_value = 0.3
    bsdf.inputs["Coat Roughness"].default_value = 0.2
    bsdf.inputs["Subsurface Weight"].default_value = 0.4
    bsdf.inputs["Subsurface Radius"].default_value = (0.6, 0.45, 0.3)
    bsdf.inputs["Subsurface Scale"].default_value = 0.5
    coords = tree.nodes.new("ShaderNodeTexCoord")
    fine = tree.nodes.new("ShaderNodeTexNoise")
    tree.links.new(coords.outputs["Object"], fine.inputs["Vector"])
    fine.inputs["Scale"].default_value = 3.0
    feed(tree, bsdf.inputs["Normal"], bump(tree, fine.outputs["Fac"], 0.15, 0.1))
    return material


def patty_material(height):
    """Barbecued ground beef: lumpy displaced surface, light and dark browns, charred grill
    marks and juicy glints. The top is duller, so that grazing light does not frost it."""
    material, tree = new_material("patty")
    bsdf, output = principled(tree)
    vector, z = periodic_coords(tree)
    top = map_range(tree, z, height * 0.8, height, 0.0, 1.0)
    bulge = noise4(tree, vector, z, 0.09, detail=2, roughness=0.5)
    craggy = noise4(tree, vector, z, 0.35, detail=6, roughness=0.65, distortion=0.3)
    lumps = voronoi4(tree, vector, z, 1.1)
    crumbs = noise4(tree, vector, z, 2.2, detail=6, roughness=0.6)
    sear = noise4(tree, vector, z, 0.22, detail=4, roughness=0.55)
    juice = noise4(tree, vector, z, 0.3, detail=3, roughness=0.5)
    wobble = noise4(tree, vector, z, 0.5, detail=3)

    # Grill bars leave diagonal charred stripes on the top and bottom faces and on the rims next
    # to them, three per tile so that they repeat with it. The middle of the side stays lighter.
    coords = tree.nodes.new("ShaderNodeTexCoord")
    raw = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(coords.outputs["Object"], raw.inputs[0])
    across = add(tree, raw.outputs["X"], scaled(tree, raw.outputs["Y"], 0.7))
    phase = add(tree, scaled(tree, across, 2 * math.pi * 3 / TILE), scaled(tree, wobble, 0.8))
    bars = map_range(tree, math_op(tree, "SINE", phase), 0.62, 0.9, 0.0, 1.0)
    level_z = math_op(tree, "DIVIDE", z, height)
    edgeness = scaled(tree, math_op(tree, "ABSOLUTE", math_op(tree, "SUBTRACT", level_z, 0.5)), 2.0)
    char = math_op(tree, "MULTIPLY", bars, map_range(tree, edgeness, 0.4, 0.8, 0.0, 1.0))

    relief = add(
        tree,
        scaled(tree, bulge, 0.7),
        scaled(tree, craggy, 0.55),
        scaled(tree, math_op(tree, "SUBTRACT", 1.0, lumps), 0.2),
        scaled(tree, crumbs, 0.08),
        scaled(tree, char, -0.22),
    )
    displacement = tree.nodes.new("ShaderNodeDisplacement")
    feed(tree, displacement.inputs["Height"], relief)
    displacement.inputs["Midlevel"].default_value = 0.8
    feed(tree, displacement.inputs["Scale"], map_range(tree, z, 0.0, 1.6, 0.0, 1.0))
    tree.links.new(displacement.outputs["Displacement"], output.inputs["Displacement"])
    use_displacement(material)

    level = add(
        tree,
        0.2,
        scaled(tree, centred(tree, craggy, 1.0), -1.0),
        scaled(tree, math_op(tree, "SUBTRACT", lumps, 0.3), 0.5),
        centred(tree, sear, 0.95),
        centred(tree, crumbs, 0.2),
        scaled(tree, edgeness, 0.25),
        scaled(tree, char, 0.75),
        clamp=True,
    )
    stops = [
        (0.0, "#DCA675"),
        (0.22, "#C4885A"),
        (0.42, "#A86B43"),
        (0.62, "#85502F"),
        (0.8, "#57311C"),
        (1.0, "#2A160C"),
    ]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    roughness = add(
        tree, map_range(tree, juice, 0.35, 0.65, 0.8, 0.45), scaled(tree, top, 0.3), scaled(tree, char, 0.2), clamp=True
    )
    feed(tree, bsdf.inputs["Roughness"], roughness)
    feed(tree, bsdf.inputs["Coat Weight"], map_range(tree, juice, 0.58, 0.7, 0.0, 0.25))
    bsdf.inputs["Coat Roughness"].default_value = 0.25
    feed(tree, bsdf.inputs["Specular IOR Level"], map_range(tree, top, 0.0, 1.0, 0.25, 0.08))
    bsdf.inputs["Subsurface Weight"].default_value = 0.02
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.2)
    bsdf.inputs["Subsurface Scale"].default_value = 0.6
    feed(tree, bsdf.inputs["Normal"], bump(tree, crumbs, 0.35, 0.3))
    return material


def lettuce_material():
    """Leaf lettuce: pale towards the rib, deep green at the frilly rim, waxy and translucent."""
    material, tree = new_material("lettuce")
    bsdf, output = principled(tree)
    vector, z = periodic_coords(tree)
    edge = tree.nodes.new("ShaderNodeAttribute")
    edge.attribute_name = "edge"
    loop = tree.nodes.new("ShaderNodeAttribute")
    loop.attribute_name = "loop"
    mottle = noise4(tree, vector, z, 0.2, detail=4)
    wobble = noise4(tree, vector, z, 0.35, detail=3)
    crinkles = noise4(tree, vector, z, 0.7, detail=6, roughness=0.6)
    # Veins run from the rib to the rim, so they are lines of constant loop coordinate: five per
    # tile, bent by noise. The line is where the sine of its phase crosses zero.
    phase = add(tree, scaled(tree, loop.outputs["Fac"], 5 * math.pi / TILE), scaled(tree, wobble, 2.0))
    distance = math_op(tree, "ABSOLUTE", math_op(tree, "SINE", phase))
    vein = map_range(tree, distance, 0.04, 0.2, 1.0, 0.0)
    vein = math_op(tree, "MULTIPLY", vein, map_range(tree, edge.outputs["Fac"], 0.1, 0.85, 1.0, 0.25))
    level = add(
        tree,
        edge.outputs["Fac"],
        centred(tree, mottle, 0.3),
        scaled(tree, vein, -0.45),
        clamp=True,
    )
    stops = [(0.0, "#B9DD82"), (0.25, "#94C957"), (0.55, "#6DB13C"), (0.8, "#529E30"), (1.0, "#3A8424")]
    colour = ramp(tree, level, stops)
    feed(tree, bsdf.inputs["Base Color"], colour)
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.inputs["Coat Weight"].default_value = 0.05
    bsdf.inputs["Coat Roughness"].default_value = 0.3
    relief = add(tree, scaled(tree, crinkles, 0.8), scaled(tree, vein, 0.35))
    feed(tree, bsdf.inputs["Normal"], bump(tree, relief, 0.35, 0.3))
    translucent = tree.nodes.new("ShaderNodeBsdfTranslucent")
    feed(tree, translucent.inputs["Color"], colour)
    mix = tree.nodes.new("ShaderNodeMixShader")
    mix.inputs[0].default_value = 0.3
    tree.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    tree.links.new(translucent.outputs["BSDF"], mix.inputs[2])
    tree.links.new(mix.outputs[0], output.inputs["Surface"])
    return material


# --- Sesame seeds ---


def seed_mesh():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=1.0)
    for vert in bm.verts:
        x, y, z = vert.co
        taper = 1.0 - 0.3 * (x + 1) / 2
        vert.co = Vector((x * 1.8, y * 1.05 * taper, z * 0.4 * (0.8 + 0.2 * taper)))
    mesh = bpy.data.meshes.new("seed")
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    return mesh


def periodic_poisson(rng, half_depth, min_dist, attempts=4000):
    """Dart throwing on a strip one tile long that wraps along x."""
    points = []
    for _ in range(attempts):
        x, y = rng.uniform(0, TILE), rng.uniform(-half_depth, half_depth)
        clear = True
        for px, py, *_ in points:
            dx = abs(px - x)
            dx = min(dx, TILE - dx)
            if dx * dx + (py - y) ** 2 < min_dist * min_dist:
                clear = False
                break
        if clear:
            points.append((x, y, rng.uniform(0, 2 * math.pi), rng.uniform(-0.15, 0.15), rng.uniform(0.88, 1.12), rng.random()))
    return points


def add_seeds(scene, footprint, profile, foot, height_at, reach=0.84, min_dist=5.0, seed=7):
    """Lays sesame seeds on the crown with a pattern that repeats every tile, on the surface
    that `height_at` gives the profile along the ingredient."""
    dome = [(r, z) for r, z in profile if z >= foot]
    r_arr = np.array([r for r, _ in reversed(dome)])
    z_arr = np.array([z for _, z in reversed(dome)])

    def surface(x, y):
        return height_at(x, float(np.interp(math.hypot(x - footprint.spine(x), y), r_arr, z_arr)))

    step = 0.05
    mesh = seed_mesh()
    mesh.materials.append(seed_material())
    rng = random.Random(seed)
    pattern = periodic_poisson(rng, reach * footprint.radius, min_dist)
    tops = []
    for k in range(TILES):
        for x, y, turn, tilt, size, tint in pattern:
            gx = x + k * TILE
            dx, dy = gx - footprint.spine(gx), y
            dist = math.hypot(dx, dy)
            if dist > reach * footprint.radius:
                continue
            z = surface(gx, y)
            slope_x = (surface(gx + step, y) - surface(gx - step, y)) / (2 * step)
            slope_y = (surface(gx, y + step) - surface(gx, y - step)) / (2 * step)
            normal = Vector((-slope_x, -slope_y, 1.0)).normalized()
            along = Vector((math.cos(turn), math.sin(turn), 0.0))
            along = (along - along.dot(normal) * normal).normalized()
            across = normal.cross(along)
            basis = Matrix.Rotation(tilt, 3, along) @ Matrix((along, across, normal)).transposed()
            obj = bpy.data.objects.new("seed", mesh)
            obj.color = (tint, tint, tint, 1.0)
            position = Vector((gx, y, z + LIFT)) + normal * 0.12
            obj.matrix_world = Matrix.Translation(position) @ (basis.to_4x4() @ Matrix.Scale(size, 4))
            scene.collection.objects.link(obj)
            tops.append(position + Vector((0, 0, 0.5)))
    return tops


# --- Scene ---


def add_ground(scene):
    mesh = bpy.data.meshes.new("ground")
    size = 400
    mesh.from_pydata(
        [(WIDTH / 2 - size, -size, 0), (WIDTH / 2 + size, -size, 0), (WIDTH / 2 + size, size, 0), (WIDTH / 2 - size, size, 0)],
        [],
        [(0, 1, 2, 3)],
    )
    obj = bpy.data.objects.new("ground", mesh)
    obj.is_shadow_catcher = True
    scene.collection.objects.link(obj)


UP = Vector((0.0, math.sin(ELEVATION), math.cos(ELEVATION)))
FORWARD = Vector((0.0, math.cos(ELEVATION), -math.sin(ELEVATION)))


def add_camera(scene, points, frame_height):
    """Orthographic camera tilted down by ELEVATION, framing the content on the bottom of the
    image. Returns the image height of the lowest point, which sits BOTTOM_MARGIN above it."""
    heights = [p.dot(UP) for p in points]
    low, high = min(heights), max(heights)
    centre = low - BOTTOM_MARGIN + frame_height / 2
    spare = (centre + frame_height / 2) - high
    print(f"frame: content spans {high - low:.2f} of {frame_height}, {spare:.2f} spare at the top")
    if spare < TOP_MARGIN:
        raise SystemExit(f"The content does not fit its {frame_height}-unit frame; make it lower.")
    data = bpy.data.cameras.new("camera")
    data.type = "ORTHO"
    data.ortho_scale = WIDTH
    data.clip_start = 1
    data.clip_end = 2000
    camera = bpy.data.objects.new("camera", data)
    camera.location = Vector((WIDTH / 2, 0, 0)) + UP * centre - FORWARD * 500
    camera.rotation_euler = (math.pi / 2 - ELEVATION, 0, 0)
    scene.collection.objects.link(camera)
    scene.camera = camera
    return low


def render(scene, frame_height, scale, path):
    scene.render.resolution_x = WIDTH * scale
    scene.render.resolution_y = frame_height * scale
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


# --- Images (numpy arrays of straight sRGB RGBA, bottom row first, as Blender stores them) ---


def segments(strip, blend=8):
    """Cuts the four-tile strip into left, mid and right so that left|mid, mid|mid and mid|right
    all join exactly: each joining edge fades, over a few columns, into the render column that
    really comes next. Sampling noise is all that differs between the tiles being faded."""
    t = TILE * TIER
    tiles = [strip[:, i * t : (i + 1) * t] for i in range(TILES)]
    weight = (np.arange(blend) / blend)[None, :, None]
    left, mid, right = tiles[0].copy(), tiles[1].copy(), tiles[3].copy()
    mid[:, :blend] = tiles[2][:, :blend] * (1 - weight) + tiles[1][:, :blend] * weight
    right[:, :blend] = tiles[2][:, :blend] * (1 - weight) + tiles[3][:, :blend] * weight
    tail = weight[:, ::-1]
    left[:, t - blend :] = tiles[1][:, t - blend :] * (1 - tail) + tiles[0][:, t - blend :] * tail
    return {"left": left, "mid": mid, "right": right}


# --- Ingredients: each builder fills the scene and returns (points to frame, support height) ---


BUN_FOOTPRINT = Footprint(edge=1.5, radius=14.0)


def build_bun_top(scene):
    height = 13.5
    foot = 2.0
    profile = crown_profile(BUN_FOOTPRINT.radius, height, foot=foot)

    def height_at(x, z):
        return z if z <= foot else foot + (z - foot) * crown_taper(x, BUN_FOOTPRINT.c0 - BUN_FOOTPRINT.radius)

    mesh = sweep_mesh("bunTop", BUN_FOOTPRINT, profile, spacing=1.0, height_at=height_at)
    stops = [(0.0, "#EAC995"), (0.06, "#DDA963"), (0.18, "#CB8A3E"), (0.5, "#B56C2E"), (0.8, "#A35A25"), (1.0, "#8F4C1E")]
    add_object(scene, "bunTop", mesh, crust_material("crown", height, stops, coat=0.3, relief_strength=0.22))
    points = [v.co.copy() for v in mesh.vertices] + add_seeds(scene, BUN_FOOTPRINT, profile, foot, height_at)
    return points, height


def build_bun_bottom(scene):
    height = 12.0
    mesh = sweep_mesh("bunBottom", BUN_FOOTPRINT, heel_profile(BUN_FOOTPRINT.radius, height), spacing=1.0, flat_top=height)
    stops = [(0.0, "#6E3A18"), (0.35, "#8A4B1E"), (0.65, "#A35E29"), (0.85, "#B26E31"), (1.0, "#C2803B")]
    add_object(scene, "bunBottom", mesh, crust_material("heel", height, stops, coat=0.25, relief_strength=0.35), crumb_material())
    return [v.co.copy() for v in mesh.vertices], height


PATTY_FOOTPRINT = Footprint(edge=1.0, radius=14.0)


def build_patty(scene):
    height = 13.0
    profile = resample(slab_profile(PATTY_FOOTPRINT.radius, height), 0.25)
    mesh = sweep_mesh("patty", PATTY_FOOTPRINT, profile, spacing=0.25)
    add_object(scene, "patty", mesh, patty_material(height))
    reach = 0.6
    points = [v.co.copy() for v in mesh.vertices]
    points += [p + Vector((0, 0, reach)) for p in points if p.z > height * 0.9]
    points += [p - Vector((0, reach, 0)) for p in points if p.y < -PATTY_FOOTPRINT.radius + 1]
    return points, height


LETTUCE_LAYERS = [
    {"edge": 1.5, "radius": 14.0, "top": 8.5, "hem": 1.6, "amp": 2.4, "waves": [(2, 1.0), (3, 0.5), (4, 0.25)], "frill": 1.6, "crinkle": 1.1},
    {"edge": 3.0, "radius": 12.0, "top": 10.5, "hem": 5.0, "amp": 2.0, "waves": [(2, 1.0), (3, 0.45), (5, 0.2)], "frill": 1.2, "crinkle": 0.9},
]


def build_lettuce(scene):
    rng = random.Random(11)
    material = lettuce_material()
    objects = []
    for index, layer in enumerate(LETTUCE_LAYERS):
        footprint = Footprint(layer["edge"], layer["radius"])
        mesh = leaf_mesh(
            f"leaf{index}",
            footprint,
            0.25,
            48,
            layer["top"],
            layer["hem"],
            layer["amp"],
            layer["waves"],
            layer["frill"],
            layer["crinkle"],
            rng,
        )
        leaf = add_object(scene, f"leaf{index}", mesh, material)
        solid = leaf.modifiers.new("thickness", "SOLIDIFY")
        solid.thickness = 0.3
        solid.offset = 0.0
        objects.append(leaf)
    return evaluated_points(scene, objects), 1.6


# --- Cheese: a slice of cheddar melting over the edges ---

CHEESE_HALF_DEPTH = 13.0
CHEESE_THICK = 2.0


def cheese_drop(x, y):
    """How far the slice hangs below its flat part at (x, y): tongues of melted cheese along the
    front and back edges, one big and one small to a tile, and drooping corners at the ends."""
    edge = max(0.0, (abs(y) - (CHEESE_HALF_DEPTH - 2.6)) / 2.6)
    u = (x % TILE) / TILE

    def tongue(centre, half_width, length):
        d = abs(u - centre) / half_width
        return length * math.sqrt(max(0.0, 1 - d**2.5)) if d < 1 else 0.0

    tongues = 0.4 + tongue(0.3, 0.12, 3.4) + tongue(0.76, 0.08, 1.8)
    front = 1.0 if y < 0 else 0.35
    corner = max(0.0, 1 - min(x, WIDTH - x) / (TILE * 0.7))
    return edge**2.2 * tongues * front + corner**2 * 1.4 * (0.3 + edge)


def cheese_mesh():
    """The slice as a closed sheet of even thickness, its corners rounded and drooping."""
    x0, x1 = 0.7, WIDTH - 0.7
    cols, rows = int((x1 - x0) / 0.2), 56

    def half_depth(x):
        d, r = min(x - x0, x1 - x), 3.2
        return CHEESE_HALF_DEPTH * (math.sqrt(max(0.0, 1 - (1 - d / r) ** 2)) if d < r else 1.0)

    grid = []
    for i in range(cols + 1):
        x = x0 + (x1 - x0) * i / cols
        hd = half_depth(x)
        for j in range(rows + 1):
            y = hd * (2 * j / rows - 1)
            grid.append((x, y, cheese_drop(x, y)))
    count = len(grid)
    verts = [(x, y, CHEESE_THICK - d + LIFT) for x, y, d in grid] + [(x, y, -d + LIFT) for x, y, d in grid]
    faces = []
    at = lambda i, j: i * (rows + 1) + j  # noqa: E731
    for i in range(cols):
        for j in range(rows):
            a, b, c, d = at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)
            faces.append((a, b, c, d))
            faces.append((count + d, count + c, count + b, count + a))
    for i in range(cols):
        for j in (0, rows):
            a, b = at(i, j), at(i + 1, j)
            faces.append((a, count + a, count + b, b) if j == 0 else (b, count + b, count + a, a))
    for i in (0, cols):
        for j in range(rows):
            a, b = at(i, j), at(i, j + 1)
            faces.append((b, count + b, count + a, a) if i == 0 else (a, count + a, count + b, b))
    return finish_mesh("cheese", verts, faces)


def cheese_material():
    """Cheddar: deep yellow-orange, waxy and translucent, glossier and more orange where it
    melts down the edges."""
    material, tree = new_material("cheese")
    bsdf, _ = principled(tree)
    vector, height = periodic_coords(tree)
    mottle = noise4(tree, vector, 0.0, 0.35, detail=3)
    fine = noise4(tree, vector, 2.0, 2.2, detail=4)
    melt = map_range(tree, height, CHEESE_THICK - 0.2, -4.0, 0.0, 1.0)
    level = add(tree, 0.62, centred(tree, mottle, 0.25), scaled(tree, melt, -0.35), clamp=True)
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, [(0.0, "#E58A0B"), (0.35, "#F0A314"), (0.65, "#F8BF2C"), (1.0, "#FFD75A")]))
    bsdf.inputs["Roughness"].default_value = 0.32
    bsdf.inputs["Coat Weight"].default_value = 0.45
    bsdf.inputs["Coat Roughness"].default_value = 0.12
    bsdf.inputs["Subsurface Weight"].default_value = 0.45
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.7, 0.2)
    bsdf.inputs["Subsurface Scale"].default_value = 0.6
    feed(tree, bsdf.inputs["Normal"], bump(tree, fine, 0.06, 0.1))
    return material


def build_cheese(scene):
    """A slice of cheddar melting over its front edge. Rendered without the shadow catcher: the
    ground sits at the base and would hide the tongues that hang below it."""
    ground = scene.objects.get("ground")
    if ground is not None:
        bpy.data.objects.remove(ground)
    mesh = cheese_mesh()
    add_object(scene, "cheese", mesh, cheese_material())
    return [v.co.copy() for v in mesh.vertices], CHEESE_THICK


# --- Tomato: four slices, one to a tile, tipped a little towards the camera ---

TOMATO_RADIUS = 9.8
TOMATO_THICK = 4.2
TOMATO_TILT = math.radians(8)


def tomato_slab():
    """A slice turned from a rounded profile, centred on the origin with its faces across z."""
    profile = resample(slab_profile(TOMATO_RADIUS, TOMATO_THICK, m=5.0), 0.2)
    steps = 256
    verts = [(r * math.cos(2 * math.pi * k / steps), r * math.sin(2 * math.pi * k / steps), z - TOMATO_THICK / 2) for k in range(steps) for r, z in profile]
    return finish_mesh("tomato", verts, grid_faces(steps, len(profile)))


def mix_colour(tree, factor, a, b):
    """Mixes two colours, each a hex string or a node output, by `factor`."""
    node = tree.nodes.new("ShaderNodeMix")
    node.data_type = "RGBA"
    feed(tree, node.inputs["Factor"], factor)
    for socket, value in (("A", a), ("B", b)):
        if isinstance(value, str):
            node.inputs[socket].default_value = srgb(value)
        else:
            tree.links.new(value, node.inputs[socket])
    return node.outputs["Result"]


def tomato_material():
    """A slice of ripe tomato: glossy red skin round the edge and, on the cut faces, the red wall,
    four chambers of orange jelly with pale seeds and a lighter core."""
    material, tree = new_material("tomato")
    bsdf, _ = principled(tree)
    coords = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(coords.outputs["Object"], split.inputs[0])
    x, y, z = split.outputs["X"], split.outputs["Y"], split.outputs["Z"]
    rho = math_op(tree, "SQRT", add(tree, math_op(tree, "MULTIPLY", x, x), math_op(tree, "MULTIPLY", y, y)))
    theta = math_op(tree, "ARCTAN2", y, x)
    wobble = noise4(tree, coords.outputs["Object"], 0.0, 0.4, detail=2)
    r = add(tree, rho, centred(tree, wobble, 0.8))
    septa = map_range(tree, math_op(tree, "ABSOLUTE", math_op(tree, "SINE", scaled(tree, theta, 2.0))), 0.18, 0.3, 0.0, 1.0)
    chamber = math_op(tree, "MULTIPLY", math_op(tree, "MULTIPLY", map_range(tree, r, 2.0, 2.6, 0.0, 1.0), map_range(tree, r, TOMATO_RADIUS - 2.4, TOMATO_RADIUS - 3.0, 0.0, 1.0)), septa)
    cells = tree.nodes.new("ShaderNodeTexVoronoi")
    tree.links.new(coords.outputs["Object"], cells.inputs["Vector"])
    cells.inputs["Scale"].default_value = 1.4
    seeds = math_op(tree, "MULTIPLY", map_range(tree, cells.outputs["Distance"], 0.16, 0.1, 0.0, 1.0), chamber)
    core = map_range(tree, r, 2.4, 1.6, 0.0, 1.0)
    skin = map_range(tree, rho, TOMATO_RADIUS - 1.3, TOMATO_RADIUS - 0.8, 0.0, 1.0)
    colour = mix_colour(tree, core, "#D93422", "#EE6650")
    colour = mix_colour(tree, chamber, colour, "#EC5F36")
    colour = mix_colour(tree, scaled(tree, seeds, 0.85), colour, "#F2D88E")
    colour = mix_colour(tree, skin, colour, "#B8150C")
    tree.links.new(colour, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.2
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.06
    bsdf.inputs["Subsurface Weight"].default_value = 0.3
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.25)
    bsdf.inputs["Subsurface Scale"].default_value = 0.5
    feed(tree, bsdf.inputs["Normal"], bump(tree, add(tree, seeds, scaled(tree, chamber, 0.5)), 0.15, 0.1))
    return material


def build_tomato(scene):
    """Four slices of tomato, one to a tile, the end ones pulled in to stay in the frame."""
    material = tomato_material()
    lift = TOMATO_THICK / 2 * math.cos(TOMATO_TILT) + TOMATO_RADIUS * math.sin(TOMATO_TILT)
    points = []
    for k in range(TILES):
        x = TILE * (k + 0.5) + (0.8 if k == 0 else -0.8 if k == TILES - 1 else 0.0)
        obj = add_object(scene, "tomato", tomato_slab(), material)
        obj.matrix_world = Matrix.Translation(Vector((x, 0.0, lift + LIFT))) @ Matrix.Rotation(TOMATO_TILT, 4, "X")
        points += [obj.matrix_world @ v.co for v in obj.data.vertices]
    return points, TOMATO_THICK + 2 * TOMATO_RADIUS * math.sin(TOMATO_TILT)


INGREDIENTS = {
    "bunTop": {"frame": 18, "build": build_bun_top},
    "lettuce": {"frame": 14, "build": build_lettuce},
    "patty": {"frame": 17, "build": build_patty},
    "bunBottom": {"frame": 16, "build": build_bun_bottom},
    "cheese": {"frame": 11, "build": build_cheese},
    "tomato": {"frame": 9, "build": build_tomato},
}


def build(kind, samples, hero, metrics):
    spec = INGREDIENTS[kind]
    scene = new_scene(samples)
    add_ground(scene)
    points, support = spec["build"](scene)
    frame = spec["frame"]
    low = add_camera(scene, points, frame)
    metrics[kind] = {"frame": frame, "low": low, "support": support}

    raw = os.path.join(PREVIEW_DIR, f"{kind}.raw.png")
    render(scene, frame, TIER * SUPERSAMPLE, raw)
    strip = downsample(load_rgba(raw), SUPERSAMPLE)
    save_rgba(strip, os.path.join(PREVIEW_DIR, f"{kind}.4x.png"))
    parts = segments(strip)
    for part, pixels in parts.items():
        save_rgba(pixels, os.path.join(ART_DIR, f"{kind}.{part}.png"))
    game = np.concatenate([parts["left"], parts["mid"], parts["mid"], parts["right"]], axis=1)
    save_rgba(enlarge(over(game, BACKDROP), 2), os.path.join(PREVIEW_DIR, f"{kind}.game.png"))

    if hero:
        path = os.path.join(PREVIEW_DIR, f"{kind}.hero.png")
        render(scene, frame, HERO_SCALE, path)
        save_rgba(over(load_rgba(path), BACKDROP), path)


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="ingredients.py")
    parser.add_argument("--only", choices=sorted(INGREDIENTS), action="append")
    parser.add_argument("--samples", type=int, default=384)
    parser.add_argument("--no-hero", action="store_true")
    args = parser.parse_args(argv)
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    metrics_path = os.path.join(PREVIEW_DIR, "metrics.json")
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path) as file:
            metrics = json.load(file)
    for kind in args.only or list(INGREDIENTS):
        build(kind, args.samples, not args.no_hero, metrics)
        with open(metrics_path, "w") as file:
            json.dump(metrics, file, indent=2)


main()

"""Renderer for the rendered pieces of the maze: the wooden ladder and its rails at a crossing.

The ladder is drawn one row at a time, from the line of a platform down to the line of the next
row, so its image repeats seamlessly: the rungs are spaced evenly with a whole number of them
in a row, and the grain of the wood repeats once a row. Pieces are modelled in board
coordinates (x right, y down, in logical units) with the centre of the column at x = 0.

Run from the repository root:
    blender -b --factory-startup --python tools/blender/maze.py -- [--samples N]

Writes <graphic>.png at 4x the logical size to the art sources (src/view/art/sources/), and a
preview of each piece to tmp/blender/maze/. ROW must match ROW_UNITS in src/sim/rules.ts (and
TILE in common.py, CELL_UNITS), and the sizes, the graphics catalogue (src/view/art/graphics.ts).
"""

import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common import (  # noqa: E402
    PREVIEW_DIR,
    TILE,
    add,
    board_point,
    bump,
    centred,
    feed,
    math_op,
    new_material,
    new_scene,
    noise4,
    principled,
    ramp,
    render_framed,
    scaled,
)

MAZE_PREVIEWS = os.path.join(PREVIEW_DIR, "maze")
ROW = 21
COLUMN = TILE
RUNGS_PER_ROW = 4
RAIL_X = 6.4
RAIL_WIDTH = 2.3
RAIL_DEPTH = 2.0
RUNG_RADIUS = 0.85
PLATFORM_THICKNESS = 8


def birch_material():
    """Birch: pale and creamy, lightly varnished, with a fine golden grain along the rails that
    repeats once a row, so a ladder drawn row after row has no seams."""
    material, tree = new_material("birch")
    bsdf, _ = principled(tree)
    coords = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(coords.outputs["Object"], split.inputs[0])
    angle = math_op(tree, "MULTIPLY", split.outputs["Z"], 2 * math.pi / ROW)
    radius = ROW / (2 * math.pi)
    folded = tree.nodes.new("ShaderNodeCombineXYZ")
    feed(tree, folded.inputs["X"], scaled(tree, split.outputs["X"], 4.0))
    feed(tree, folded.inputs["Y"], scaled(tree, split.outputs["Y"], 4.0))
    feed(tree, folded.inputs["Z"], scaled(tree, math_op(tree, "COSINE", angle), radius * 0.35))
    w = scaled(tree, math_op(tree, "SINE", angle), radius * 0.35)
    grain = noise4(tree, folded.outputs[0], w, 0.9, detail=6, roughness=0.55, distortion=0.4)
    mottle = noise4(tree, folded.outputs[0], w, 0.25, detail=3)
    level = add(tree, 0.5, centred(tree, grain, 0.7), centred(tree, mottle, 0.35), clamp=True)
    stops = [(0.0, "#C9A877"), (0.3, "#E0C69A"), (0.65, "#EEDDBB"), (1.0, "#F8EFD8")]
    feed(tree, bsdf.inputs["Base Color"], ramp(tree, level, stops))
    bsdf.inputs["Roughness"].default_value = 0.42
    bsdf.inputs["Coat Weight"].default_value = 0.25
    bsdf.inputs["Coat Roughness"].default_value = 0.2
    feed(tree, bsdf.inputs["Normal"], bump(tree, grain, 0.12, 0.15))
    return material


def rounded_box(name, size, bevel):
    """A box of `size` (x, y, z) centred on the origin with rounded edges."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, offset_type="OFFSET", segments=3, profile=0.5, affect="EDGES")
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    return mesh


def dowel(name, length, radius):
    """A round rung along x, centred on the origin."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=32, radius1=radius, radius2=radius, depth=length)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_smooth()
    return mesh


def place(scene, name, mesh, material, location):
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    scene.collection.objects.link(obj)
    return obj


def build_ladder(scene, top, bottom, rungs=True):
    """Two rails from `top` to `bottom` (board y) and, if asked, rungs every ROW / RUNGS_PER_ROW
    units starting half a step below each row line, so every row holds the same rungs."""
    wood = birch_material()
    height = bottom - top
    for side in (-1, 1):
        rail = rounded_box("rail", (RAIL_WIDTH, RAIL_DEPTH, height), 0.6)
        place(scene, "rail", rail, wood, board_point(side * RAIL_X, (top + bottom) / 2))
    if not rungs:
        return
    step = ROW / RUNGS_PER_ROW
    first = math.floor(top / step)
    for index in range(first, math.ceil(bottom / step) + 1):
        y = (index + 0.5) * step
        if top < y < bottom:
            rung = dowel("rung", 2 * RAIL_X, RUNG_RADIUS)
            place(scene, "rung", rung, wood, board_point(0.0, y, 0.2))


def render(samples):
    os.makedirs(MAZE_PREVIEWS, exist_ok=True)
    scene = new_scene(samples)
    build_ladder(scene, -2 * ROW, 3 * ROW)
    render_framed(scene, "ladder", (-COLUMN / 2, 0.0, COLUMN, ROW), MAZE_PREVIEWS)
    scene = new_scene(samples)
    build_ladder(scene, -2 * ROW, 3 * ROW, rungs=False)
    half = PLATFORM_THICKNESS / 2
    render_framed(scene, "ladder.rails", (-COLUMN / 2, -half, COLUMN, PLATFORM_THICKNESS), MAZE_PREVIEWS)


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="maze.py")
    parser.add_argument("--samples", type=int, default=256)
    args = parser.parse_args(argv)
    render(args.samples)


main()

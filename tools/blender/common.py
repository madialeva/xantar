"""Shared pieces of the prototype Blender renderers: studio scene, shader helpers and image
post-processing. One Blender unit is one logical unit of the board."""

import math
import os

import bpy
import numpy as np
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ART_DIR = os.path.join(ROOT, "src", "view", "art", "classic")
PREVIEW_DIR = os.path.join(ROOT, "tmp", "blender")
TILE = 32
TIER = 4
SUPERSAMPLE = 2
LIFT = 0.02
BACKDROP = "#1b2130"


def srgb(hex_color, alpha=1.0):
    """Scene-linear RGBA of an sRGB hex colour."""
    value = hex_color.lstrip("#")
    channels = [int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return (*linear, alpha)


def new_material(name):
    material = bpy.data.materials.new(name)
    if material.node_tree is None:
        material.use_nodes = True
    tree = material.node_tree
    tree.nodes.clear()
    return material, tree


def feed(tree, socket, value):
    if isinstance(value, bpy.types.NodeSocket):
        tree.links.new(value, socket)
    else:
        socket.default_value = value


def math_op(tree, operation, a, b=None, clamp=False):
    node = tree.nodes.new("ShaderNodeMath")
    node.operation = operation
    node.use_clamp = clamp
    feed(tree, node.inputs[0], a)
    if b is not None:
        feed(tree, node.inputs[1], b)
    return node.outputs[0]


def add(tree, *values, clamp=False):
    total = values[0]
    for value in values[1:]:
        total = math_op(tree, "ADD", total, value)
    return math_op(tree, "ADD", total, 0.0, clamp=clamp) if clamp else total


def scaled(tree, value, amount):
    return math_op(tree, "MULTIPLY", value, amount)


def centred(tree, value, amount):
    """(value - 0.5) * amount: a noise output turned into a signed offset."""
    return math_op(tree, "MULTIPLY", math_op(tree, "SUBTRACT", value, 0.5), amount)


def map_range(tree, value, from_min, from_max, to_min, to_max):
    node = tree.nodes.new("ShaderNodeMapRange")
    node.clamp = True
    feed(tree, node.inputs["Value"], value)
    node.inputs["From Min"].default_value = from_min
    node.inputs["From Max"].default_value = from_max
    node.inputs["To Min"].default_value = to_min
    node.inputs["To Max"].default_value = to_max
    return node.outputs["Result"]


def ramp(tree, factor, stops):
    node = tree.nodes.new("ShaderNodeValToRGB")
    elements = node.color_ramp.elements
    elements[0].position, elements[0].color = stops[0][0], srgb(stops[0][1])
    elements[1].position, elements[1].color = stops[-1][0], srgb(stops[-1][1])
    for position, color in stops[1:-1]:
        elements.new(position).color = srgb(color)
    feed(tree, node.inputs["Fac"], factor)
    return node.outputs["Color"]


def periodic_coords(tree):
    """Object coordinates folded so that every texture repeats once per tile along x, and the
    height above the ingredient's base."""
    coords = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    tree.links.new(coords.outputs["Object"], split.inputs[0])
    angle = math_op(tree, "MULTIPLY", split.outputs["X"], 2 * math.pi / TILE)
    radius = TILE / (2 * math.pi)
    folded = tree.nodes.new("ShaderNodeCombineXYZ")
    feed(tree, folded.inputs["X"], scaled(tree, math_op(tree, "COSINE", angle), radius))
    feed(tree, folded.inputs["Y"], scaled(tree, math_op(tree, "SINE", angle), radius))
    feed(tree, folded.inputs["Z"], split.outputs["Y"])
    height = math_op(tree, "SUBTRACT", split.outputs["Z"], LIFT)
    return folded.outputs[0], height


def noise4(tree, vector, w, scale, detail=4.0, roughness=0.5, distortion=0.0):
    node = tree.nodes.new("ShaderNodeTexNoise")
    node.noise_dimensions = "4D"
    feed(tree, node.inputs["Vector"], vector)
    feed(tree, node.inputs["W"], w)
    node.inputs["Scale"].default_value = scale
    node.inputs["Detail"].default_value = detail
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Distortion"].default_value = distortion
    return node.outputs["Fac"]


def voronoi4(tree, vector, w, scale, randomness=1.0):
    node = tree.nodes.new("ShaderNodeTexVoronoi")
    node.voronoi_dimensions = "4D"
    feed(tree, node.inputs["Vector"], vector)
    feed(tree, node.inputs["W"], w)
    node.inputs["Scale"].default_value = scale
    node.inputs["Randomness"].default_value = randomness
    return node.outputs["Distance"]


def principled(tree):
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    output = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return bsdf, output


def bump(tree, height, strength, distance):
    node = tree.nodes.new("ShaderNodeBump")
    node.inputs["Strength"].default_value = strength
    node.inputs["Distance"].default_value = distance
    feed(tree, node.inputs["Height"], height)
    return node.outputs["Normal"]


def use_displacement(material):
    try:
        material.displacement_method = "BOTH"
    except AttributeError:
        material.cycles.displacement_method = "BOTH"


def new_scene(samples):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "OPTIX"
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.004
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "Khronos PBR Neutral"
    world = bpy.data.worlds.new("studio")
    if world.node_tree is None:
        world.use_nodes = True
    nodes = world.node_tree.nodes
    background = nodes.get("Background") or nodes.new("ShaderNodeBackground")
    background.inputs["Color"].default_value = srgb("#a8a39b")
    background.inputs["Strength"].default_value = 0.3
    output = nodes.get("World Output") or nodes.new("ShaderNodeOutputWorld")
    world.node_tree.links.new(background.outputs["Background"], output.inputs["Surface"])
    scene.world = world
    add_sun(scene, "key", (-0.45, -0.75, 1.0), 2.6, 20, "#fff1e0")
    add_sun(scene, "fill", (0.8, -1.0, 0.25), 0.6, 45, "#f2f4fa")
    add_sun(scene, "rim", (0.25, 1.0, 0.55), 1.2, 8, "#fff2e0", shadow=False)
    return scene


def add_sun(scene, name, toward_light, strength, angle_deg, color, shadow=True):
    light = bpy.data.lights.new(name, "SUN")
    light.energy = strength
    light.angle = math.radians(angle_deg)
    light.color = srgb(color)[:3]
    light.use_shadow = shadow
    obj = bpy.data.objects.new(name, light)
    obj.rotation_euler = Vector(toward_light).normalized().to_track_quat("Z", "Y").to_euler()
    scene.collection.objects.link(obj)


def add_object(scene, name, mesh, *materials):
    for material in materials:
        mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def evaluated_points(scene, objects):
    """World positions of the vertices after modifiers; displacement is applied at render
    time, so a patty's points are its undisplaced surface plus a margin given by the caller."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in objects:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        points += [evaluated.matrix_world @ v.co for v in mesh.vertices]
        evaluated.to_mesh_clear()
    return points


def load_rgba(path):
    image = bpy.data.images.load(path)
    width, height = image.size
    pixels = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    bpy.data.images.remove(image)
    return pixels.reshape(height, width, 4)


def save_rgba(pixels, path):
    height, width = pixels.shape[:2]
    image = bpy.data.images.new(os.path.basename(path), width, height, alpha=True)
    image.pixels.foreach_set(np.ascontiguousarray(pixels, dtype=np.float32).ravel())
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def downsample(pixels, factor):
    """Box filter in linear light with premultiplied alpha, so edges keep their colour."""
    alpha = pixels[..., 3:4]
    premultiplied = np.concatenate([to_linear(pixels[..., :3]) * alpha, alpha], axis=-1)
    h, w = premultiplied.shape[:2]
    small = premultiplied.reshape(h // factor, factor, w // factor, factor, 4).mean(axis=(1, 3))
    alpha = small[..., 3:4]
    colour = np.where(alpha > 1e-6, small[..., :3] / np.maximum(alpha, 1e-6), 0.0)
    return np.concatenate([to_srgb(np.clip(colour, 0, 1)), alpha], axis=-1)


def over(pixels, background_hex):
    background = np.array([int(background_hex[i : i + 2], 16) / 255 for i in (1, 3, 5)])
    alpha = pixels[..., 3:4]
    flat = pixels[..., :3] * alpha + background * (1 - alpha)
    return np.concatenate([flat, np.ones_like(alpha)], axis=-1)


def enlarge(pixels, factor):
    return pixels.repeat(factor, axis=0).repeat(factor, axis=1)

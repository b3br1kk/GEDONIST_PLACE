# Библиотека реализма для interior.blend (текст real_lib.py внутри blend). exec(bpy.data.texts['real_lib.py'].as_string())

import bpy, bmesh, math, mathutils, os, random
O = bpy.data.objects; M = bpy.data.materials; sc = bpy.data.scenes["GEDONIST_interior"]; V = mathutils.Vector; R = math.radians
PH = r"C:\Users\Данил\Downloads\demki\mesto-gedonista\3d\polyhaven"
TX = r"C:\Users\Данил\Downloads\demki\mesto-gedonista\3d\interior\tex"
def lin(h):
    h = h.lstrip('#'); r = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return [((c/12.92) if c <= 0.04045 else ((c+0.055)/1.055)**2.4) for c in r] + [1.0]
def img(path, nc=False):
    im = bpy.data.images.load(path, check_existing=True)
    if nc: im.colorspace_settings.name = 'Non-Color'
    return im
def ph(name, kind, res="1k"):
    for r in (res, "2k", "1k"):
        for ext in ("jpg", "png"):
            p = os.path.join(PH, name, "%s_%s_%s.%s" % (name, kind, r, ext))
            if os.path.exists(p): return p
    return None
def new_mat(name):
    m = M.get(name) or M.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    return m, nt, out
def tex_node(nt, path, vec, nc=False, proj='BOX', blend=0.25, x=-300, y=0):
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img(path, nc); t.projection = proj
    if proj == 'BOX': t.projection_blend = blend
    t.location = (x, y); nt.links.new(vec, t.inputs['Vector']); return t
def mapping(nt, coord="Object", scale=1.0, rot=(0,0,0), loc=(0,0,0)):
    tc = nt.nodes.new("ShaderNodeTexCoord"); tc.location = (-900, 0)
    mp = nt.nodes.new("ShaderNodeMapping"); mp.location = (-700, 0)
    s = scale if isinstance(scale, (tuple, list)) else (scale, scale, scale)
    mp.inputs['Scale'].default_value = s; mp.inputs['Rotation'].default_value = rot; mp.inputs['Location'].default_value = loc
    nt.links.new(tc.outputs[coord], mp.inputs['Vector']); return mp.outputs['Vector'], tc
def pbr(name, tex, scale=1.0, coord="Object", proj='BOX', tint=None, tint_fac=1.0, nstr=1.0, rough_add=0.0, rough_mul=1.0, metal=0.0, rot=(0,0,0), diff=None, nor=None, rough=None, spec=0.5, island_var=0.0, val=1.0):
    m, nt, out = new_mat(name)
    vec, tc = mapping(nt, coord, scale, rot)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled"); b.location = (400, 0)
    d = diff or ph(tex, "diff"); n = nor or ph(tex, "nor_gl"); r = rough or ph(tex, "rough")
    col = None
    if d:
        td = tex_node(nt, d, vec, False, proj, y=300); col = td.outputs['Color']
        hs = nt.nodes.new("ShaderNodeHueSaturation"); hs.location = (0, 300); hs.inputs['Value'].default_value = val
        nt.links.new(col, hs.inputs['Color']); col = hs.outputs['Color']
    if tint:
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.location = (200, 300)
        mx.inputs['Factor'].default_value = tint_fac; mx.inputs[7].default_value = lin(tint) if isinstance(tint, str) else tint
        if col: nt.links.new(col, mx.inputs[6])
        else: mx.inputs[6].default_value = (1,1,1,1)
        col = mx.outputs[2]
    if island_var:
        g = nt.nodes.new("ShaderNodeNewGeometry"); g.location = (-300, 600)
        mr = nt.nodes.new("ShaderNodeMapRange"); mr.location = (-100, 600)
        mr.inputs['To Min'].default_value = 1 - island_var; mr.inputs['To Max'].default_value = 1 + island_var
        nt.links.new(g.outputs['Random Per Island'], mr.inputs['Value'])
        mx2 = nt.nodes.new("ShaderNodeMix"); mx2.data_type = 'RGBA'; mx2.blend_type = 'MULTIPLY'; mx2.location = (300, 450); mx2.inputs['Factor'].default_value = 1
        nt.links.new(col, mx2.inputs[6]); cr = nt.nodes.new("ShaderNodeCombineColor"); cr.location = (100, 600)
        for i in range(3): nt.links.new(mr.outputs[0], cr.inputs[i])
        nt.links.new(cr.outputs[0], mx2.inputs[7]); col = mx2.outputs[2]
    if col: nt.links.new(col, b.inputs['Base Color'])
    if r:
        tr = tex_node(nt, r, vec, True, proj, y=0)
        mr = nt.nodes.new("ShaderNodeMath"); mr.operation = 'MULTIPLY_ADD'; mr.location = (100, 0)
        mr.inputs[1].default_value = rough_mul; mr.inputs[2].default_value = rough_add; mr.use_clamp = True
        nt.links.new(tr.outputs['Color'], mr.inputs[0]); nt.links.new(mr.outputs[0], b.inputs['Roughness'])
    else:
        b.inputs['Roughness'].default_value = 0.6 * rough_mul + rough_add
    if n:
        tn = tex_node(nt, n, vec, True, proj, y=-300)
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.location = (100, -300); nm.inputs['Strength'].default_value = nstr
        nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Metallic'].default_value = metal
    b.inputs['Specular IOR Level'].default_value = spec
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    return m
def add_snow(m, coverage=0.55, bump=True):
    nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    src = out.inputs['Surface'].links[0].from_socket
    sn = M.get("E_Snow"); sb = None
    sb = nt.nodes.new("ShaderNodeBsdfPrincipled"); sb.location = (600, -500)
    sb.inputs['Base Color'].default_value = lin("#EEF3FA"); sb.inputs['Roughness'].default_value = 0.55
    sb.inputs['Subsurface Weight'].default_value = 0.2; sb.inputs['Subsurface Radius'].default_value = (0.5, 0.7, 1.0); sb.inputs['Subsurface Scale'].default_value = 0.02
    g = nt.nodes.new("ShaderNodeGroup"); g.node_tree = bpy.data.node_groups["G_SnowMask"]; g.location = (400, -700)
    g.inputs['Coverage'].default_value = coverage
    mx = nt.nodes.new("ShaderNodeMixShader"); mx.location = (750, -200)
    nt.links.new(g.outputs['Fac'], mx.inputs['Fac']); nt.links.new(src, mx.inputs[1]); nt.links.new(sb.outputs['BSDF'], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
    return m
def ensure_coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name); (parent or sc.collection).children.link(c)
    return c
def kill(name):
    if name in O: bpy.data.objects.remove(O[name], do_unlink=True)
def mk(name, bm, mats, cname, smooth=False):
    kill(name)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for mt in mats: me.materials.append(M[mt] if isinstance(mt, str) else mt)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); bpy.data.collections[cname].objects.link(o); return o
def cube(bm, c, s, rot=None, mat=0):
    r = bmesh.ops.create_cube(bm, size=1.0)
    vs = r['verts']
    bmesh.ops.scale(bm, vec=s, verts=vs)
    if rot is not None: bmesh.ops.rotate(bm, cent=(0,0,0), matrix=rot, verts=vs)
    bmesh.ops.translate(bm, vec=c, verts=vs)
    for f in {f for v in vs for f in v.link_faces}: f.material_index = mat
    return vs
def cyl(bm, p0, p1, r, seg=12, mat=0, cap=True):
    p0 = V(p0); p1 = V(p1); d = p1 - p0; L = d.length
    res = bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=L)
    vs = res['verts']
    q = V((0,0,1)).rotation_difference(d.normalized())
    bmesh.ops.rotate(bm, cent=(0,0,0), matrix=q.to_matrix(), verts=vs)
    bmesh.ops.translate(bm, vec=(p0 + p1)/2, verts=vs)
    for f in {f for v in vs for f in v.link_faces}: f.material_index = mat
    return vs
def bevel_mod(o, w=0.004, seg=2):
    b = o.modifiers.new("Bevel", 'BEVEL'); b.width = w; b.segments = seg; b.limit_method = 'ANGLE'; return b
def quick(cam, path, spp=24, w=1000, h=625):
    sc.camera = O[cam]; sc.cycles.samples = spp; sc.render.resolution_x = w; sc.render.resolution_y = h
    sc.render.resolution_percentage = 100; sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 88
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

def ground_z(x, y, default=-0.65):
    g = O["EXT_Ground"]; mi = g.matrix_world.inverted()
    o = mi @ V((x, y, 50)); d = (mi.to_3x3() @ V((0, 0, -1))).normalized()
    hit, loc, nrm, idx = g.ray_cast(o, d)
    return (g.matrix_world @ loc).z if hit else default
def rect_path(x0, x1, y0, y1, r=0.4, step=0.2):
    pts = []
    corners = [(x1, y1, 0), (x0, y1, 1), (x0, y0, 2), (x1, y0, 3)]
    import math
    # walk counter-clockwise: edges with outward normals
    segs = [((x1, y0), (x1, y1), (1, 0)), ((x1, y1), (x0, y1), (0, 1)), ((x0, y1), (x0, y0), (-1, 0)), ((x0, y0), (x1, y0), (0, -1))]
    for (a, b, n) in segs:
        L = math.hypot(b[0]-a[0], b[1]-a[1]); k = max(2, int(L/step))
        for i in range(k):
            t = i/k; pts.append(((a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t), n))
    return pts
def drift(name, pts, h=0.3, w=0.7, zoff=0.0, closed=True, seed=1, cname="EXT_Snow", sink=0.15, wall_in=0.05):
    import random
    rnd = random.Random(seed)
    bm = bmesh.new(); K = 7; rows = []
    # smooth normals at corners
    n = len(pts)
    for i, ((x, y), nr) in enumerate(pts):
        if closed:
            p0 = pts[(i-1) % n][1]; p1 = pts[(i+1) % n][1]
            nx, ny = (nr[0]*2 + p0[0] + p1[0]), (nr[1]*2 + p0[1] + p1[1])
        else: nx, ny = nr
        l = math.hypot(nx, ny) or 1; nx, ny = nx/l, ny/l
        if i == 0: acc = 0.0; prev = (x, y)
        acc += math.hypot(x - prev[0], y - prev[1]); prev = (x, y)
        nv = mathutils.noise.noise(V((acc*0.28, seed*1.7, 0.3))); nv2 = mathutils.noise.noise(V((acc*0.9, seed*3.1, 1.3)))
        hh = h*(0.92 + 0.45*nv + 0.08*nv2); ww = w*(0.95 + 0.35*nv)
        row = []
        for k in range(K+1):
            t = k/K
            px, py = x + nx*(-wall_in + (ww+wall_in)*t), y + ny*(-wall_in + (ww+wall_in)*t)
            zg = ground_z(px, py)
            z = zg - sink + (hh + sink)*((1 - t)**1.7) + zoff*(1-t)
            row.append(bm.verts.new((px, py, z)))
        rows.append(row)
    m = len(rows)
    for i in range(m if closed else m-1):
        A = rows[i]; B = rows[(i+1) % m]
        for k in range(K):
            bm.faces.new((A[k], A[k+1], B[k+1], B[k]))
    bm.normal_update()
    o = mk(name, bm, ["E_GroundSnow"] if "E_GroundSnow" in M else ["E_Snow"], cname, smooth=True)
    s = o.modifiers.new("Sub", 'SUBSURF'); s.levels = 1; s.render_levels = 2
    d = o.modifiers.new("Disp", 'DISPLACE'); d.texture = bpy.data.textures["SnowCapNoise"]; d.texture_coords = 'GLOBAL'; d.strength = 0.06
    return o

def poly_path(verts, step=0.22, closed=False):
    pts = []; n = len(verts)
    E = n if closed else n-1
    def nrm(i):
        a = verts[i % n]; b = verts[(i+1) % n]; dx, dy = b[0]-a[0], b[1]-a[1]; l = math.hypot(dx, dy)
        return (dy/l, -dx/l)
    for i in range(E):
        a = verts[i]; b = verts[(i+1) % n]; nn = nrm(i)
        L = math.hypot(b[0]-a[0], b[1]-a[1]); k = max(2, int(L/step))
        for j in range(k):
            t = j/k
            if j == 0 and (closed or i > 0):
                p = nrm(i-1); c = (p[0]+nn[0], p[1]+nn[1]); l = math.hypot(*c); pts.append((a, (c[0]/l, c[1]/l)))
            else:
                pts.append(((a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t), nn))
    if not closed: pts.append((verts[-1], nrm(n-2)))
    return pts

def eve(exposure=0.6):
    for n in ("DayWin0", "DayWin1", "DayKWin"): O[n].hide_render = True
    for n in ("PendLight0", "PendLight1", "PendLight2", "EveFill", "EveLamp"): O[n].hide_render = False
    for n in ("PendLight0", "PendLight1", "PendLight2"): O[n].data.energy = 160
    O["EveFill"].data.energy = 450; O["CorrLight"].data.energy = 40
    sc.world = bpy.data.worlds["EXT_WorldEve"]
    sc.view_settings.look = "AgX - Medium High Contrast"; sc.view_settings.exposure = exposure
    O["EXT_Sun"].hide_render = False; O["EXT_Moon"].hide_render = False  # солнце = сумеречная подсветка, без него шторы в порталах тёмные
    def _e(mat, s):
        b = next(n for n in M[mat].node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); b.inputs['Emission Strength'].default_value = s
    _e("E_GarlandBulb", 9.0); _e("E_BanyaWindow", 6.0); _e("E_Fire", 6.0)
    for n in ("EXT_BanyaLight", "EXT_ChanLight", "EXT_ChanGlow", "EXT_GarlandFill", "EXT_WallLamp"):
        if n in O: O[n].hide_render = False
    bl = M["E_Blind"]; b = next(x for x in bl.node_tree.nodes if x.type == 'BSDF_PRINCIPLED')
    b.inputs['Emission Color'].default_value = lin("#FFB56B"); b.inputs['Emission Strength'].default_value = 1.2
    pg = M["E_PortalGlass"]
    for o in sc.objects:
        if o.type == 'MESH' and (o.name.endswith(("glassL", "glassR")) or o.name == "KWinGlass"): o.material_slots[0].material = pg
def rq(jobs, spp=24, w=1000, h=625):
    """queue renders in background timer: jobs = [(cam, path), ...]"""
    q = list(jobs); st = bpy.app.driver_namespace.setdefault("rq_state", {}); st["left"] = len(q); st["done"] = []
    def step():
        if not q: st["left"] = 0; return None
        job = q.pop(0); cam, path = job[0], job[1]
        if len(job) > 2: sc.frame_set(job[2])
        quick(cam, path, spp, w, h); st["done"].append(path); st["left"] = len(q)
        return 0.2
    bpy.app.timers.register(step, first_interval=0.3)

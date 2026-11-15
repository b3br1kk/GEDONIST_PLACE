"""Мини-кодировщик QR (байтовый режим, уровень коррекции M, версии 1–10) без внешних библиотек.
Использование: python3 tools/qr.py "<текст>" out.svg [цвет]
"""
import sys

# --- Галуа GF(256) ---
EXP = [0] * 512
LOG = [0] * 256
x = 1
for i in range(255):
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if x & 0x100:
        x ^= 0x11D
for i in range(255, 512):
    EXP[i] = EXP[i - 255]


def gmul(a, b):
    return 0 if a == 0 or b == 0 else EXP[LOG[a] + LOG[b]]


def rs_gen(n):
    g = [1]
    for i in range(n):
        ng = [0] * (len(g) + 1)
        for j, c in enumerate(g):
            ng[j] ^= c
            ng[j + 1] ^= gmul(c, EXP[i])
        g = ng
    return g


def rs_ecc(data, n):
    g = rs_gen(n)
    res = list(data) + [0] * n
    for i in range(len(data)):
        c = res[i]
        if c:
            for j in range(1, len(g)):
                res[i + j] ^= gmul(g[j], c)
    return res[len(data):]


# Уровень M: (ecc на блок, [(число блоков, данных в блоке), ...]) для версий 1–10
TABLE_M = {
    1: (10, [(1, 16)]), 2: (16, [(1, 28)]), 3: (26, [(1, 44)]), 4: (18, [(2, 32)]),
    5: (24, [(2, 43)]), 6: (16, [(4, 27)]), 7: (18, [(4, 31)]),
    8: (22, [(2, 38), (2, 39)]), 9: (22, [(3, 36), (2, 37)]), 10: (26, [(4, 43), (1, 44)]),
}
ALIGN = {1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38],
         8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]}


def bch(value, poly, bits):
    v = value << (bits)
    plen = poly.bit_length()
    while v.bit_length() >= plen:
        v ^= poly << (v.bit_length() - plen)
    return v


def encode(text):
    data = text.encode('utf-8')
    for ver in range(1, 11):
        ecc, groups = TABLE_M[ver]
        cap = sum(n * k for n, k in groups)
        cc_bits = 8 if ver <= 9 else 16
        if 4 + cc_bits + 8 * len(data) <= cap * 8:
            break
    else:
        raise ValueError('слишком длинный текст')
    bits = []

    def put(v, n):
        for i in range(n - 1, -1, -1):
            bits.append((v >> i) & 1)
    put(0b0100, 4)
    put(len(data), cc_bits)
    for b in data:
        put(b, 8)
    put(0, min(4, cap * 8 - len(bits)))
    while len(bits) % 8:
        bits.append(0)
    cw = [int(''.join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]
    pad = [0xEC, 0x11]
    i = 0
    while len(cw) < cap:
        cw.append(pad[i % 2])
        i += 1
    # блоки и чередование
    blocks, eccs, pos = [], [], 0
    for n, k in groups:
        for _ in range(n):
            blk = cw[pos:pos + k]
            pos += k
            blocks.append(blk)
            eccs.append(rs_ecc(blk, ecc))
    final = []
    for i in range(max(len(b) for b in blocks)):
        for b in blocks:
            if i < len(b):
                final.append(b[i])
    for i in range(ecc):
        for e in eccs:
            final.append(e[i])
    return ver, final


def build(text):
    ver, cws = encode(text)
    n = 17 + 4 * ver
    M = [[None] * n for _ in range(n)]
    F = [[False] * n for _ in range(n)]  # служебные модули

    def setf(r, c, v):
        M[r][c] = v
        F[r][c] = True

    def finder(r0, c0):
        for r in range(-1, 8):
            for c in range(-1, 8):
                rr, cc = r0 + r, c0 + c
                if 0 <= rr < n and 0 <= cc < n:
                    on = (0 <= r <= 6 and 0 <= c <= 6 and (r in (0, 6) or c in (0, 6) or (2 <= r <= 4 and 2 <= c <= 4)))
                    setf(rr, cc, 1 if on else 0)
    finder(0, 0)
    finder(0, n - 7)
    finder(n - 7, 0)
    for i in range(8, n - 8):
        setf(6, i, 1 if i % 2 == 0 else 0)
        setf(i, 6, 1 if i % 2 == 0 else 0)
    al = ALIGN[ver]
    k = len(al)
    for ia, r in enumerate(al):
        for ja, c in enumerate(al):
            if (ia == 0 and ja == 0) or (ia == 0 and ja == k - 1) or (ia == k - 1 and ja == 0):
                continue
            for dr in range(-2, 3):
                for dc in range(-2, 3):
                    setf(r + dr, c + dc, 1 if max(abs(dr), abs(dc)) != 1 else 0)
    setf(n - 8, 8, 1)  # тёмный модуль
    # резерв под формат и версию
    for i in range(9):
        if not F[8][i]:
            setf(8, i, 0)
        if not F[i][8]:
            setf(i, 8, 0)
    for i in range(8):
        if not F[8][n - 1 - i]:
            setf(8, n - 1 - i, 0)
        if not F[n - 1 - i][8]:
            setf(n - 1 - i, 8, 0)
    if ver >= 7:
        vb = (ver << 12) | bch(ver, 0x1F25, 12)
        for i in range(18):
            b = (vb >> i) & 1
            r, c = i // 3, i % 3 + n - 11
            setf(r, c, b)
            setf(c, r, b)
    # размещение данных
    bits = []
    for b in cws:
        for i in range(7, -1, -1):
            bits.append((b >> i) & 1)
    idx = 0
    up = True
    c = n - 1
    while c > 0:
        if c == 6:
            c -= 1
        rows = range(n - 1, -1, -1) if up else range(n)
        for r in rows:
            for cc in (c, c - 1):
                if not F[r][cc]:
                    M[r][cc] = bits[idx] if idx < len(bits) else 0
                    idx += 1
        up = not up
        c -= 2
    masks = [lambda r, c: (r + c) % 2 == 0, lambda r, c: r % 2 == 0, lambda r, c: c % 3 == 0,
             lambda r, c: (r + c) % 3 == 0, lambda r, c: (r // 2 + c // 3) % 2 == 0,
             lambda r, c: (r * c) % 2 + (r * c) % 3 == 0, lambda r, c: ((r * c) % 2 + (r * c) % 3) % 2 == 0,
             lambda r, c: ((r + c) % 2 + (r * c) % 3) % 2 == 0]

    def with_mask(m):
        G = [row[:] for row in M]
        for r in range(n):
            for c in range(n):
                if not F[r][c] and masks[m](r, c):
                    G[r][c] ^= 1
        fmt = (0b00 << 3) | m  # уровень M = 00
        fb = ((fmt << 10) | bch(fmt, 0x537, 10)) ^ 0x5412
        bit = lambda i: (fb >> i) & 1
        for i in range(6):
            G[i][8] = bit(i)
        G[7][8] = bit(6)
        G[8][8] = bit(7)
        G[8][7] = bit(8)
        for i in range(9, 15):
            G[8][14 - i] = bit(i)
        for i in range(8):
            G[8][n - 1 - i] = bit(i)
        for i in range(8, 15):
            G[n - 15 + i][8] = bit(i)
        G[n - 8][8] = 1
        return G

    def penalty(G):
        s = 0
        for grid in (G, list(map(list, zip(*G)))):
            for row in grid:
                run = 1
                for i in range(1, n):
                    if row[i] == row[i - 1]:
                        run += 1
                    else:
                        if run >= 5:
                            s += run - 2
                        run = 1
                if run >= 5:
                    s += run - 2
        for r in range(n - 1):
            for c in range(n - 1):
                if G[r][c] == G[r + 1][c] == G[r][c + 1] == G[r + 1][c + 1]:
                    s += 3
        dark = sum(map(sum, G))
        s += abs(dark * 20 - n * n * 10) // (n * n) * 10
        return s
    best = min(range(8), key=lambda m: penalty(with_mask(m)))
    return with_mask(best)


def svg(G, color='#1b1b1b', quiet=0):
    n = len(G)
    path = []
    for r in range(n):
        c = 0
        while c < n:
            if G[r][c]:
                s = c
                while c < n and G[r][c]:
                    c += 1
                path.append(f'M{s + quiet} {r + quiet}h{c - s}v1h-{c - s}z')
            else:
                c += 1
    w = n + 2 * quiet
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {w}" shape-rendering="crispEdges">'
            f'<path fill="{color}" d="{"".join(path)}"/></svg>')


if __name__ == '__main__':
    text, out = sys.argv[1], sys.argv[2]
    color = sys.argv[3] if len(sys.argv) > 3 else '#1b1b1b'
    open(out, 'w').write(svg(build(text), color))

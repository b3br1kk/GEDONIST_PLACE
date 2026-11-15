# Vendored libraries


## GSAP 3.15.1 (GreenSock standard license, free)
```html
<script src="vendor/gsap/gsap.min.js"></script>
<script src="vendor/gsap/ScrollTrigger.min.js"></script>
```

## three 0.185.1 (r185, MIT)
```html
<script type="importmap">
{ "imports": { "three": "./vendor/three/build/three.module.js", "three/addons/": "./vendor/three/addons/" } }
</script>
```
Draco decoder path: `vendor/three/addons/libs/draco/gltf/`. Delete unused files from `addons/` before deploy.

## Font Prata: Prata-Regular.ttf, 60 KB, Cyrillic: yes (OFL license)

## Font Golos Text: GolosText-wght.ttf, 111 KB, Cyrillic: yes (OFL license)

## Font Sofia Sans Extra Condensed: SofiaSansExtraCondensed-Italic-wght.ttf, 185 KB, Cyrillic: yes (OFL license)

## Font Sofia Sans Extra Condensed: SofiaSansExtraCondensed-wght.ttf, 208 KB, Cyrillic: yes (OFL license)

Fonts CSS: paste `vendor/fonts/fonts.css` rules at the top of styles.css (paths are relative to docs/).

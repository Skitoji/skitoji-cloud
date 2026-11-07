#!/usr/bin/env python3
"""Export the approved Flujo SVG directly at every size; requires Inkscape and ImageMagick."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ROOT = Path(__file__).resolve().parents[1]
COLORS = {'azul': '#3049e8', 'oscuro': '#20231f', 'blanco': '#ffffff'}
PROFILES = {'claro': ('#f7f7f2', '#3049e8'), 'oscuro': ('#20231f', '#ffffff'), 'azul': ('#3049e8', '#ffffff')}
SIZES = (128, 256, 512, 1024, 2048, 4096)
PROFILE_SIZES = (400, 800, 1080, 2048)


def load_master(path):
    master = ET.parse(path).getroot()
    if list(map(float, master.get('viewBox', '').split())) != [0, 0, 100, 100]:
        raise ValueError('The approved master must use viewBox="0 0 100 100".')
    paths = [e for e in master.iter() if e.tag == f'{{{NS}}}path']
    if not paths or not all(e.get('d') for e in paths):
        raise ValueError('The master must contain vector paths.')
    for element in master.iter():
        if element.tag.split('}')[-1] not in ('svg', 'title', 'desc', 'g', 'path'):
            raise ValueError('Only self-contained vector geometry is supported.')
        if any(k.startswith('on') or 'href' in k for k in element.attrib):
            raise ValueError('External references and event handlers are not supported.')
    return master


def recolor(master, color):
    result = copy.deepcopy(master)
    result.set('width', '100'); result.set('height', '100')
    for element in result.iter():
        if element.tag.split('}')[-1] in ('svg', 'g', 'path'):
            element.set('fill', color)
    return result


def profile(master, background, color):
    root = ET.Element(f'{{{NS}}}svg', {'viewBox': '0 0 100 100', 'width': '100', 'height': '100'})
    ET.SubElement(root, f'{{{NS}}}title').text = 'Skitoji — Flujo / perfil'
    ET.SubElement(root, f'{{{NS}}}rect', {'width': '100', 'height': '100', 'fill': background})
    group = ET.SubElement(root, f'{{{NS}}}g', {'transform': 'translate(16 16) scale(0.68)'})
    for child in recolor(master, color):
        if child.tag.split('}')[-1] in ('g', 'path'):
            group.append(child)
    return root


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--master', type=Path, default=ROOT/'skitoji-landing/assets/skitoji-symbol.svg')
    parser.add_argument('--output', type=Path, default=Path('/workspace/work/skitoji-flujo-kit'))
    parser.add_argument('--zip', dest='archive', type=Path, default=Path('/workspace/work/skitoji-flujo-kit.zip'))
    parser.add_argument('--validate-only', action='store_true')
    args = parser.parse_args()
    master = load_master(args.master)
    if args.validate_only:
        print('Master is self-contained vector geometry with a square viewBox.'); return
    for binary in ('inkscape', 'magick'):
        if not shutil.which(binary):
            raise SystemExit(f'Required program is missing: {binary}')
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=True)
    runtime = output.parent/'brand-export-runtime'; runtime.mkdir(exist_ok=True)
    env = dict(os.environ, INKSCAPE_PROFILE_DIR=str(runtime/'inkscape'), XDG_CACHE_HOME=str(runtime/'cache'))
    assets = []

    def run(command):
        result = subprocess.run(command, env=env, capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError(f'{command[0]} failed: {result.stderr.strip()}')
        return result.stdout.strip()

    def record(path, variant, background, width, height, unit='px'):
        if not path.is_file() or not path.stat().st_size:
            raise ValueError(f'Export missing or empty: {path}')
        if path.suffix.lower() in ('.png', '.jpg'):
            actual = run(['magick', 'identify', '-format', '%w %h', str(path)])
            if actual != f'{width} {height}':
                raise ValueError(f'Incorrect dimensions in {path}: {actual}')
        assets.append({'path': path.relative_to(output).as_posix(), 'width': width, 'height': height,
                       'unit': unit, 'format': path.suffix[1:].upper(), 'variant': variant,
                       'background': background, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})

    def save_svg(document, relative, variant, background):
        path = output/relative; path.parent.mkdir(parents=True, exist_ok=True)
        ET.ElementTree(document).write(path, encoding='utf-8', xml_declaration=True)
        record(path, variant, background, 100, 100, 'viewBox')
        return path

    def render(source, relative, size, variant, background):
        path = output/relative; path.parent.mkdir(parents=True, exist_ok=True)
        run(['inkscape', str(source), '--export-area-page', '--export-type=png',
             f'--export-width={size}', f'--export-height={size}', f'--export-filename={path}'])
        record(path, variant, background, size, size)
        return path

    for name, color in COLORS.items():
        source = save_svg(recolor(master, color), f'01-vector/flujo-{name}.svg', name, 'transparent')
        pdf = source.with_suffix('.pdf')
        run(['inkscape', str(source), '--export-area-page', '--export-type=pdf', f'--export-filename={pdf}'])
        record(pdf, name, 'transparent', 75, 75, 'pt')
        for size in SIZES:
            render(source, f'02-transparent/{name}/flujo-{name}-{size}.png', size, name, 'transparent')

    for name, (background, color) in PROFILES.items():
        source = save_svg(profile(master, background, color), f'03-profile/flujo-perfil-{name}.svg', name, background)
        for size in PROFILE_SIZES:
            png = render(source, f'03-profile/{name}/flujo-perfil-{name}-{size}.png', size, name, background)
            if size == 1080:
                jpg = png.with_suffix('.jpg')
                run(['magick', str(png), '-quality', '95', str(jpg)])
                record(jpg, name, background, size, size)

    readme = output/'LEEME.md'
    readme.write_text('''# SKITOJI — FLUJO / kit de logo

La S elegida en la propuesta 06, preparada como símbolo vectorial y archivos de uso diario.

- **01-vector:** SVG escalables y PDF vectoriales en azul, oscuro y blanco.
- **02-transparent:** PNG cuadrados sin fondo, en 128, 256, 512, 1024, 2048 y 4096 píxeles.
- **03-profile:** avatares cuadrados con fondo claro, oscuro y azul, en 400, 800, 1080 y 2048 píxeles. Incluye SVG y JPG de 1080 px.

## Qué archivo usar

Para la foto de perfil de tus redes, empieza con un PNG **perfil** de 1080 px. El símbolo tiene un margen amplio para los recortes circulares; revisa la vista previa de cada plataforma antes de guardar. Para un diseño sobre una foto o vídeo, usa un PNG **transparent**. Para imprenta, animación o cambios de escala, parte del SVG o PDF.

Todos los archivos se renderizaron directamente desde el vector a su resolución final; no se ampliaron imágenes pequeñas. Los PNG transparentes mantienen alfa. Los avatares son cuadrados, no círculos precortados. Los tamaños son opciones de exportación, no requisitos específicos de plataformas.

## Color y conservación

- Azul: #3049E8. Oscuro: #20231F. Blanco: #FFFFFF. Fondo claro: #F7F7F2.
- Mantén las proporciones. No estires, recortes ni alteres el contorno o los espacios negativos.
- Usa blanco sobre fondos oscuros y azul u oscuro sobre fondos claros.
- No añadas sombras, degradados, bordes ni otros efectos al símbolo.

manifest.json contiene dimensiones, variantes y hashes SHA-256 de todos los gráficos. El símbolo se usa con el nombre SKITOJI en la web, pero los archivos de perfil contienen solo la marca para que se reconozca a tamaños pequeños.
''', encoding='utf-8')
    manifest = output/'manifest.json'
    manifest.write_text(json.dumps({'brand': 'SKITOJI', 'logo': 'Flujo', 'version': 1, 'assets': assets}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    args.archive.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(args.archive, 'w', ZIP_DEFLATED) as archive:
        for relative in sorted([asset['path'] for asset in assets] + ['LEEME.md', 'manifest.json']):
            archive.write(output/relative, f'skitoji-flujo-kit/{relative}')
    print(json.dumps({'files': len(assets)+2, 'graphics': len(assets), 'output': str(output), 'zip': str(args.archive),
                      'zip_bytes': args.archive.stat().st_size, 'zip_sha256': hashlib.sha256(args.archive.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()

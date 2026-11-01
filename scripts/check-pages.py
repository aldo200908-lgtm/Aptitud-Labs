from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=[]; self.missing_alt=False
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag=='img' and 'alt' not in attrs: self.missing_alt=True
        for name in ('href','src'):
            if name in attrs: self.refs.append(attrs[name])

routes=['','servicios','proyectos','planes','nfc-qr','cotizar','privacidad','diseno-web-puno','diseno-web-juliaca','web-para-barberias','web-para-restaurantes','soluciones']
errors=[];count=0
for route in routes:
    path=Path(route)/'index.html'
    page=Page();page.feed(path.read_text())
    if len(page.ids)!=len(set(page.ids)): errors.append(f'{path}: duplicate IDs')
    if page.missing_alt: errors.append(f'{path}: image without alt')
    for ref in page.refs:
        if not ref.startswith('/Aptitud-Labs/'): continue
        url=urlsplit(ref);target=Path(unquote(url.path.removeprefix('/Aptitud-Labs/')))
        if target.is_dir(): target=target/'index.html'
        count+=1
        if not target.exists(): errors.append(f'{path}: missing file {ref}');continue
        if url.fragment and target.suffix=='.html':
            linked=Page();linked.feed(target.read_text())
            if url.fragment not in linked.ids: errors.append(f'{path}: missing anchor {ref}')
print(f'{len(routes)} pages, {count} local links/assets checked')
if errors:
    print('\n'.join(errors));raise SystemExit(1)
print('PASS: all local paths/anchors, unique IDs, and image alt attributes')

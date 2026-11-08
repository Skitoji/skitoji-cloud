"""Validate navigation and progressive enhancement without external dependencies."""
from html.parser import HTMLParser
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1] / 'skitoji-landing'

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class PortfolioTests(unittest.TestCase):
    def setUp(self):
        self.text = (ROOT/'index.html').read_text()
        self.doc = Document(self.text)
    def test_unique_ids_and_anchor_destinations(self):
        ids=[a['id'] for _,a in self.doc.tags if 'id' in a]
        self.assertEqual(len(ids), len(set(ids)))
        for tag,attrs in self.doc.tags:
            if tag=='a' and attrs.get('href','').startswith('#'):
                self.assertIn(attrs['href'][1:],ids)
    def test_one_primary_heading_and_merged_about_skills(self):
        self.assertEqual(sum(t=='h1' for t,_ in self.doc.tags),1)
        section=self.text.split('<section class="about-section',1)[1].split('<section class="section services-section',1)[0]
        for token in ['id="about"','id="skills"','About me','Adobe Animate','Autodesk Maya','Autodesk 3ds Max']:
            self.assertIn(token,section)
    def test_no_inline_script_styles_and_secure_external_links(self):
        for tag,attrs in self.doc.tags:
            self.assertNotIn('style',attrs)
            self.assertFalse(any(k.startswith('on') for k in attrs))
            if tag=='script': self.assertTrue(attrs.get('src','').startswith('/'))
            if tag=='a' and attrs.get('target')=='_blank':
                self.assertIn('noopener',attrs.get('rel',''))
    def test_legacy_routes_land_in_existing_sections(self):
        for path,target in [('about','about'),('skills','skills'),('work','work'),('services','services'),('contact','contact')]:
            text=(ROOT/f'{path}.html').read_text()
            self.assertIn(f'content="0;url=/#{target}"',text)
            self.assertIn(f'href="/#{target}"',text)
    def test_form_has_labels_honeypot_status_and_json_contract(self):
        labels={a.get('for') for t,a in self.doc.tags if t=='label'}
        for name in ['name','email','projectType','message','website']:
            self.assertIn(name,labels)
        inputs={a.get('name'):a for t,a in self.doc.tags if t in ['input','textarea','select']}
        self.assertIn('form_time',inputs)
        self.assertEqual(inputs['website'].get('tabindex'),'-1')
        status=next(a for _,a in self.doc.tags if a.get('id')=='formStatus')
        self.assertEqual(status.get('aria-live'),'polite')
        button=next(a for t,a in self.doc.tags if t=='button' and a.get('type')=='submit')
        self.assertIn('disabled',button) # JS enables the JSON-only endpoint.
    def test_initial_projects_exist_without_javascript(self):
        projects=json.loads((ROOT/'works.json').read_text())['projects']
        for p in projects:
            self.assertIn(p['url'],self.text)
            self.assertIn(p['cover'],self.text)
    def test_identity_assets_and_useful_framing_controls(self):
        for tag,a in self.doc.tags:
            if tag=='img' and a.get('src','').startswith('/assets/'):
                self.assertTrue((ROOT/a['src'].lstrip('/')).is_file())
                self.assertIn('width',a)
                self.assertIn('height',a)
                self.assertIn('alt',a)
        nodes=[a for t,a in self.doc.tags if t=='button' and 'data-frame-ratio' in a]
        self.assertEqual({a['data-frame-ratio'] for a in nodes},{'16:9','4:3','9:16'})
        for a in nodes:
            self.assertEqual(a['type'],'button')
            self.assertIn('disabled',a)
            self.assertIn('frameDimensions',a['aria-controls'])
        self.assertEqual(sum(a['aria-pressed']=='true' for a in nodes),1)
        width=next(a for _,a in self.doc.tags if a.get('id')=='frameWidth')
        self.assertEqual(width['type'],'number')
        self.assertEqual(width['value'],'1920')
        self.assertNotIn('overflow: hidden',self.text)
    def test_vector_assets_are_well_formed_and_have_no_external_dependencies(self):
        import xml.etree.ElementTree as ET
        for p in [ROOT/'favicon.svg', *sorted((ROOT/'assets').glob('*.svg'))]:
            doc=ET.fromstring(p.read_text())
            self.assertIn('viewBox',doc.attrib)
            self.assertTrue(any(el.tag.endswith('path') for el in doc.iter()))
            for el in doc.iter():
                self.assertFalse(el.tag.endswith('script'))
                self.assertFalse(el.tag.endswith('image'))
                self.assertFalse(any(k.startswith('on') for k in el.attrib))
    def test_motion_silent_page_and_optional_media_contracts(self):
        ids={a.get('id'):a for _,a in self.doc.tags if a.get('id')}
        for name in ['motionCanvas','motionStudy','storyMotionToggle','storySceneMode','chapterNav','journalTrack','studioPhoto','studioVideo']:
            self.assertIn(name,ids)
        self.assertNotIn('soundToggle',ids)
        self.assertNotIn('studioPlay',ids)
        for path in ROOT.glob('*.js'):
            self.assertNotIn('AudioContext',path.read_text())
        self.assertFalse((ROOT/'sound.js').exists())
        self.assertNotIn('autoplay',ids['studioVideo'])
        self.assertNotIn('src',ids['studioPhoto'])
        self.assertNotIn('src',ids['studioVideo'])
        for a in [a for t,a in self.doc.tags if t=='button' and 'data-chapter' in a]:
            self.assertEqual(a['type'],'button')
            self.assertIn(a['aria-controls'],ids)
        scripts={a.get('src') for t,a in self.doc.tags if t=='script'}
        self.assertNotIn('/sound.js',scripts)
        self.assertNotIn('/delight.js',scripts)
        for name in ['scene.js','camera.js','studio.js','editorial.js','workbench.js','projector.js']:
            self.assertIn('/'+name,scripts)
            self.assertTrue((ROOT/name).is_file())
    def test_audiovisual_camera_notes_and_footer_contracts(self):
        ids={a.get('id'):a for _,a in self.doc.tags if a.get('id')}
        self.assertIn('enfoque audiovisual',self.text)
        chapters=[a for t,a in self.doc.tags if t=='button' and 'data-chapter' in a]
        self.assertEqual([a['data-chapter'] for a in chapters],['0','1','2','3'])
        self.assertEqual(ids['cameraScrub']['type'],'range')
        self.assertEqual(ids['cameraScrub']['max'],'100')
        self.assertIn('disabled',ids['cameraScrub'])
        parts=[a for t,a in self.doc.tags if t=='button' and 'data-camera-part' in a]
        self.assertEqual({a['data-camera-part'] for a in parts},{'lens','sensor','body','monitor'})
        self.assertEqual(sum(a['aria-pressed']=='true' for a in parts),0)
        self.assertIn('hidden',ids['cameraParts'])
        self.assertEqual(sum(t=='details' and 'process-note' in a.get('class','') for t,a in self.doc.tags),3)
        self.assertEqual(ids['noteDialog']['aria-labelledby'],'noteDialogTitle')
        self.assertNotIn('footerFilmstrip',ids)
        self.assertIn('projectorCanvas',ids)
        self.assertIn('disabled',ids['projectorLight'])
        self.assertIn('hidden',ids['projectorPause'])
        self.assertEqual(ids['projectorLight']['type'],'range')
        self.assertEqual(ids['copyEmail']['data-email'],'smonroysalas@skitoji.cloud')
        for a in parts:
            self.assertEqual(a['type'],'button')
            self.assertIn(a['aria-controls'],ids)
    def test_applications_are_explicit_buttons_with_a_process_destination(self):
        apps=[a for t,a in self.doc.tags if t=='button' and 'data-tool' in a]
        self.assertEqual(len(apps),18)
        self.assertEqual(len({a['data-tool'] for a in apps}),18)
        for a in apps:
            self.assertEqual(a['type'],'button')
            self.assertEqual(a['aria-controls'],'toolDetail')
            self.assertIn('disabled',a)
        self.assertEqual(sum(a['aria-pressed']=='true' for a in apps),1)
        link=next(a for _,a in self.doc.tags if a.get('id')=='toolProcessLink')
        self.assertEqual(link['href'],'#motionStudy')
    def test_marquee_duplicate_is_hidden_from_accessibility_tree_and_can_pause(self):
        groups=[a for _,a in self.doc.tags if 'discipline-group' in a.get('class','').split()]
        self.assertEqual(len(groups),2)
        self.assertEqual(groups[1]['aria-hidden'],'true')
        button=next(a for _,a in self.doc.tags if a.get('id')=='marqueeToggle')
        self.assertEqual(button['type'],'button')
        self.assertIn('hidden',button)
    def test_all_translation_attributes_are_paired(self):
        for _,a in self.doc.tags:
            self.assertEqual('data-es' in a,'data-en' in a)
            self.assertEqual('data-placeholder-es' in a,'data-placeholder-en' in a)

if __name__=='__main__': unittest.main()

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
        section=self.text.split('<section class="about-section',1)[1].split('</section>',1)[0]
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
    def test_all_translation_attributes_are_paired(self):
        for _,a in self.doc.tags:
            self.assertEqual('data-es' in a,'data-en' in a)
            self.assertEqual('data-placeholder-es' in a,'data-placeholder-en' in a)

if __name__=='__main__': unittest.main()

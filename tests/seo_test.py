"""Source-level SEO contracts; these do not assert production HTTP or indexing."""
import json
import re
import unittest
import xml.etree.ElementTree as ET
from collections import Counter, deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from urllib.robotparser import RobotFileParser

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://calculate.everytinytool.com/'


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.text = {}
        self.stack = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag in ('title', 'h1', 'summary', 'p', 'script'):
            self.stack.append((tag, len(self.tags) - 1))

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_data(self, text):
        for _, index in self.stack:
            self.text[index] = self.text.get(index, '') + text

    def values(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]

    def texts(self, tag):
        return [self.text.get(i, '').strip() for i, (t, _) in enumerate(self.tags) if t == tag]


FILES = sorted([ROOT / 'index.html', *ROOT.glob('*-calculator/index.html'),
                ROOT / 'ko/index.html', *ROOT.glob('ko/*-calculator/index.html')])
PAGES = {ORIGIN + p.relative_to(ROOT).as_posix().removesuffix('index.html'): Page(p.read_text()) for p in FILES}


class SEOContracts(unittest.TestCase):
    def test_sitemap_equals_public_canonical_pages(self):
        tree = ET.parse(ROOT / 'sitemap.xml')
        urls = [node.text for node in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        self.assertEqual(len(urls), len(set(urls)))
        self.assertEqual(set(urls), set(PAGES))
        for url, page in PAGES.items():
            with self.subTest(url=url):
                self.assertEqual(page.values('link', rel='canonical'), [{'rel': 'canonical', 'href': url}])

    def test_unique_metadata_and_one_h1_in_initial_html(self):
        for tag, attr in [('title', None), ('meta', 'description')]:
            values = []
            for url, page in PAGES.items():
                with self.subTest(url=url, field=tag):
                    found = page.texts(tag) if attr is None else [a.get('content', '') for a in page.values(tag, name=attr)]
                    self.assertEqual(len(found), 1)
                    self.assertTrue(found[0].strip())
                    values.extend(found)
                    self.assertEqual(len(page.texts('h1')), 1)
                    self.assertTrue(page.texts('h1')[0])
            self.assertFalse([v for v, count in Counter(values).items() if count > 1])

    def test_no_source_indexing_blocks_or_meta_redirects(self):
        robot = RobotFileParser()
        robot.parse((ROOT / 'robots.txt').read_text().splitlines())
        self.assertIn(urljoin(ORIGIN, 'sitemap.xml'), robot.site_maps())
        for url, page in PAGES.items():
            with self.subTest(url=url):
                self.assertTrue(robot.can_fetch('Googlebot', url))
                for a in page.values('meta'):
                    if a.get('name', '').lower() in ('robots', 'googlebot'):
                        self.assertFalse(set(re.split(r'[\s,]+', a.get('content', '').lower())) & {'noindex', 'none'})
                    self.assertNotEqual(a.get('http-equiv', '').lower(), 'refresh')

    def test_reciprocal_language_alternates(self):
        for url, page in PAGES.items():
            with self.subTest(url=url):
                relative = url.removeprefix(ORIGIN).removeprefix('ko/')
                expected = {'en': ORIGIN + relative, 'ko': ORIGIN + 'ko/' + relative, 'x-default': ORIGIN + relative}
                links = page.values('link', rel='alternate')
                self.assertEqual(len(links), 3)
                self.assertEqual({a['hreflang']: a['href'] for a in links}, expected)
                self.assertEqual(page.values('html')[0]['lang'], 'ko' if '/ko/' in url else 'en')
                for target in expected.values():
                    self.assertIn(target, PAGES)

    def test_internal_links_and_assets_exist(self):
        for url, page in PAGES.items():
            for tag, attrs in page.tags:
                target = attrs.get('href') if tag in ('a', 'link') else attrs.get('src')
                if not target:
                    continue
                parsed = urlsplit(urljoin(url, target))
                if parsed.netloc != urlsplit(ORIGIN).netloc:
                    continue
                with self.subTest(url=url, target=target):
                    file = ROOT / unquote(parsed.path).lstrip('/')
                    if parsed.path.endswith('/'):
                        file /= 'index.html'
                    self.assertTrue(file.is_file(), str(file))

    def test_all_pages_reachable_by_static_anchors_from_home(self):
        seen, queue = set(), deque([ORIGIN, ORIGIN + 'ko/'])
        while queue:
            url = queue.popleft()
            if url in seen:
                continue
            seen.add(url)
            for a in PAGES[url].values('a'):
                target = urljoin(url, a.get('href', '')).split('#')[0]
                if target in PAGES and target not in seen:
                    queue.append(target)
        self.assertEqual(seen, set(PAGES))

    def test_faq_jsonld_matches_visible_questions_and_answers(self):
        for url, page in PAGES.items():
            questions, paragraphs = page.texts('summary'), page.texts('p')
            for i, (tag, attrs) in enumerate(page.tags):
                if tag != 'script' or attrs.get('type') != 'application/ld+json':
                    continue
                with self.subTest(url=url):
                    data = json.loads(page.text[i])
                    self.assertEqual(data['@type'], 'FAQPage')
                    self.assertEqual(data['inLanguage'], page.values('html')[0]['lang'])
                    self.assertEqual(len(data['mainEntity']), len(questions))
                    for item in data['mainEntity']:
                        self.assertIn(item['name'], questions)
                        self.assertIn(item['acceptedAnswer']['text'], paragraphs)


if __name__ == '__main__':
    unittest.main()

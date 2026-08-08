import requests, re, sys, urllib.parse

base = 'http://127.0.0.1:5000'
paths = ['/login', '/']

for path in paths:
    url = base + path
    try:
        r = requests.get(url, timeout=5)
        print(f'PAGE {url} {r.status_code}')
        html = r.text
    except Exception as e:
        print(f'PAGE {url} ERROR {e}')
        continue

    urls = set(re.findall(r'(?:href|src)=["\']([^"\']+)["\']', html))
    if not urls:
        print('  No assets found on page')
    for u in sorted(urls):
        if u.startswith('data:') or u.startswith('mailto:') or u.startswith('javascript:'):
            continue
        if u.startswith('http://') or u.startswith('https://'):
            full = u
        elif u.startswith('//'):
            full = 'http:' + u
        else:
            full = urllib.parse.urljoin(url, u)
        try:
            resp = requests.get(full, timeout=5)
            print(f'  {full} {resp.status_code}')
        except Exception as e:
            print(f'  {full} ERROR {e}')

print('\nCheck complete')

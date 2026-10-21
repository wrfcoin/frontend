#!/usr/bin/env python3
"""Publish the canonical core4 document as a static invitee-readable page."""
import argparse
import hashlib
import html
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True, help='core4/docs/TESTNET_DISCLAIMER.md')
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
source = args.source.read_bytes()
text = source.decode()
# The document owns the wording. The attachment policy reference remains in the source;
# publish its user-facing paragraphs verbatim, without a private-repository link.
paragraphs = text.split('\n\n')
title = paragraphs[0].removeprefix('# ')
body = ''.join('<p>' + html.escape(p.replace('\n', ' ')) + '</p>' for p in paragraphs[1:3])
page = f'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n<title>{html.escape(title)}</title>\n<style>body {{font: 18px/1.6 system-ui,sans-serif; max-width: 48rem; margin: 3rem auto; padding: 0 1rem; color: #222; background: #fff}}</style>\n</head><body><main><h1>{html.escape(title)}</h1>{body}</main>\n<!-- Generated from core4/docs/TESTNET_DISCLAIMER.md; sha256={hashlib.sha256(source).hexdigest()} -->\n</body></html>\n'
output = Path(__file__).resolve().parents[1] / 'public/testnet-disclaimer.html'
if args.check:
    if not output.is_file() or output.read_text() != page:
        raise SystemExit('Public disclaimer differs from canonical source; regenerate it.')
else:
    output.write_text(page)

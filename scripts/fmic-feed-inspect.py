#!/usr/bin/env python3
"""Read-only streaming FMIC feed validation. No database writes or publication."""
import argparse
import json
import re
import sys
import zipfile
from collections import Counter
from decimal import Decimal, InvalidOperation, ROUND_CEILING
from pathlib import Path
from xml.etree import ElementTree as ET
from contextlib import contextmanager
from urllib.parse import urlsplit

G = "{http://base.google.com/ns/1.0}"
MAX_BYTES = 512 * 1024 * 1024

@contextmanager
def source(path):
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            entries = [x for x in archive.infolist() if not x.is_dir() and x.filename.lower().endswith(".xml")]
            if len(entries) != 1 or entries[0].file_size > MAX_BYTES:
                raise ValueError("Expected exactly one XML file, maximum 512 MiB")
            with archive.open(entries[0]) as stream:
                yield stream
    else:
        if Path(path).stat().st_size > MAX_BYTES:
            raise ValueError("XML exceeds 512 MiB")
        with open(path, "rb") as stream:
            yield stream

class SafeStream:
    def __init__(self, stream):
        self.stream = stream
        self.tail = b""
        self.size = 0
    def read(self, n=-1):
        chunk = self.stream.read(n)
        self.size += len(chunk)
        if self.size > MAX_BYTES:
            raise ValueError("XML exceeds size limit")
        sample = (self.tail + chunk).replace(b"\x00", b"").upper()
        if b"<!DOCTYPE" in sample or b"<!ENTITY" in sample:
            raise ValueError("DTD and entity declarations are forbidden")
        self.tail = (self.tail + chunk)[-64:]
        return chunk

def money(value):
    match = re.fullmatch(r"(\d+(?:\.\d{1,2})?)(?:\s+PLN)?", value.strip())
    if not match:
        raise ValueError("invalid source price")
    amount = Decimal(match.group(1))
    if amount <= 0 or amount > 10000000:
        raise ValueError("source price outside bounds")
    return str(amount.quantize(Decimal("0.01")))

def proposed_gross(source_price, discount=Decimal("5")):
    """Provisional gross selling price in whole PLN; never silently publish zero."""
    amount = Decimal(source_price)
    discount = Decimal(str(discount))
    if not amount.is_finite() or amount <= 0:
        raise ValueError("invalid reference price")
    if not discount.is_finite() or not 0 <= discount < 100:
        raise ValueError("discount must be between 0 and 100 percent (exclusive)")
    rounded = (amount * (100 - discount) / 100).to_integral_value(rounding=ROUND_CEILING)
    return str(rounded.quantize(Decimal("0.01"))) if rounded >= 1 else None

def https_url(value):
    try:
        u = urlsplit(value)
        return value if u.scheme == "https" and u.hostname and not u.username and not u.password else ""
    except ValueError:
        return ""

def normalize(item, discount=Decimal('5')):
    def get(tag):
        return (item.findtext(tag) or "").strip()
    sku = get(G+"id")
    name = get("title")
    if not sku or len(sku) > 120 or not name:
        raise ValueError("missing or invalid SKU/name")
    availability = get(G+"availability")
    if availability not in {"in stock", "out of stock"}:
        raise ValueError("unknown availability")
    images = list(dict.fromkeys(filter(None, [https_url(get(G+"image_link"))] +
        [https_url((x.text or "").strip()) for x in item.findall(G+"additional_image_link")])))
    source_price = money(get(G+"price"))
    return {"supplier":"fmic", "sku":sku, "name":name,
        "source_price":source_price, "currency":"PLN",
        "proposed_gross":proposed_gross(source_price, discount),
        "price_kind":"unknown", "availability":availability,
        "category_path":get(G+"product_type"), "url":https_url(get("link")),
        "images":images, "mpn":get(G+"mpn"), "ean":get(G+"ean"),
        "brand":get(G+"brand"), "shipping_weight_raw":get(G+"shipping_weight")}

def inspect(path, discount=Decimal('5'), on_row=None):
    seen = set()
    counts = Counter()
    errors = Counter()
    categories = set()
    with source(path) as raw:
        stack = []
        for event, element in ET.iterparse(SafeStream(raw), events=("start","end")):
            if event == "start":
                stack.append(element)
                continue
            if element.tag == "item":
                counts["items"] += 1
                try:
                    row = normalize(element, discount)
                    if row["sku"] in seen:
                        raise ValueError("duplicate SKU")
                    seen.add(row["sku"])
                    counts["valid"] += 1
                    if on_row is not None:
                        on_row(row)
                    if row["proposed_gross"] is None:
                        counts["manual_price_required"] += 1
                    counts[row["availability"]] += 1
                    if not row["images"]:
                        counts["missing_images"] += 1
                    if row["category_path"]:
                        categories.add(row["category_path"])
                    else:
                        counts["missing_category"] += 1
                except (ValueError, InvalidOperation) as exc:
                    counts["invalid"] += 1
                    errors[str(exc)] += 1
                if len(stack) > 1:
                    stack[-2].remove(element)
                element.clear()
            stack.pop()
    if not counts["items"]:
        raise ValueError("No product items found")
    return {"counts":dict(counts), "categories":len(categories), "errors":dict(errors),
            "price_kind":"unknown", "discount_percent":str(discount),
            "rounding":"ceil_whole_pln", "published":0}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feed", help="Local XML or ZIP file")
    parser.add_argument("--jsonl", action="store_true", help="Stream normalized rows to stdout, report to stderr")
    parser.add_argument("--discount", type=Decimal, default=Decimal("5"))
    args = parser.parse_args()
    try:
        if not args.discount.is_finite() or not 0 <= args.discount < 100:
            raise ValueError('Invalid discount')
        emit = (lambda row: print(json.dumps(row, ensure_ascii=False))) if args.jsonl else None
        result = inspect(args.feed, args.discount, emit)
        print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr if args.jsonl else sys.stdout)
        sys.exit(1 if result["counts"].get("invalid") else 0)
    except (OSError, ValueError, ET.ParseError, zipfile.BadZipFile) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(2)

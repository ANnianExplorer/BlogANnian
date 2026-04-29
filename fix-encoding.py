import sys

files = [
    r"pages\posts\阿里云百炼-实现语音克隆.md",
    r"pages\posts\在调用智谱AI的过程中遇到的问题.md",
]

encodings_to_try = ['utf-8-sig', 'gbk', 'gb2312', 'gb18030', 'utf-8']

for filepath in files:
    raw = open(filepath, 'rb').read()
    print(f"\n=== {filepath} ===")
    print(f"First 20 bytes: {raw[:20].hex()}")
    for enc in encodings_to_try:
        try:
            decoded = raw.decode(enc)
            # 检查前100个字符是否合理
            snippet = decoded[:100].replace('\n', ' ')
            print(f"  {enc}: OK -> {snippet[:80]}")
            break
        except Exception as e:
            print(f"  {enc}: FAIL ({e})")

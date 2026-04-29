import sys

files = [
    r"pages\posts\阿里云百炼-实现语音克隆.md",
    r"pages\posts\在调用智谱AI的过程中遇到的问题.md",
]

for filepath in files:
    raw = open(filepath, 'rb').read()
    print(f"\n=== {filepath} (total {len(raw)} bytes) ===")
    
    # 找出所有无效 UTF-8 字节的位置
    bad_positions = []
    i = 0
    while i < len(raw):
        b = raw[i]
        try:
            if b < 0x80:
                i += 1
            elif b < 0xC0:
                # 非法：不应出现的续接字节
                bad_positions.append((i, raw[i:i+4].hex(), 'unexpected continuation'))
                i += 1
            elif b < 0xE0:
                seq = raw[i:i+2]
                seq.decode('utf-8')
                i += 2
            elif b < 0xF0:
                seq = raw[i:i+3]
                seq.decode('utf-8')
                i += 3
            else:
                seq = raw[i:i+4]
                seq.decode('utf-8')
                i += 4
        except Exception:
            bad_positions.append((i, raw[i:i+4].hex(), raw[i:i+4]))
            i += 1

    print(f"Found {len(bad_positions)} invalid byte positions")
    for pos, hexval, ctx in bad_positions[:20]:
        # 显示周围上下文
        context_start = max(0, pos - 6)
        context_bytes = raw[context_start:pos+4]
        try:
            context_str = context_bytes.decode('utf-8', errors='replace')
        except:
            context_str = '?'
        print(f"  pos {pos}: {hexval} | context: {context_str!r}")

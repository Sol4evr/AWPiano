from pathlib import Path
import os

root = Path(__file__).resolve().parent.parent
limit_mib = float(os.environ.get('AWPIANO_MAX_DEPLOY_MIB', '10'))
exclude = {'.git', '.vercel'}
files = []
for path in root.rglob('*'):
    if not path.is_file() or any(part in exclude for part in path.parts):
        continue
    files.append((path.stat().st_size, path.relative_to(root)))
total = sum(size for size, _ in files)
mib = total / 1024 / 1024
print(f'AWPiano deployment working set: {len(files)} files, {mib:.2f} MiB (limit {limit_mib:g} MiB)')
for size, path in sorted(files, reverse=True)[:10]:
    print(f'  {size/1024/1024:8.2f} MiB  {path}')
if mib > limit_mib:
    raise SystemExit(f'Deployment size guard failed: {mib:.2f} MiB exceeds {limit_mib:g} MiB')

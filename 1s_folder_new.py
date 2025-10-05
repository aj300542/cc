import os
import shutil
import re

source_folder = './word/edit'
target_root = './json'

# 获取所有源文件
files = [f for f in os.listdir(source_folder) if f.lower().endswith('.jpg')]

# 按字符分组
char_groups = {}
for filename in files:
    base = os.path.splitext(filename)[0]
    char = base.split('.')[0]  # 例如 "自.001" → "自"
    char_groups.setdefault(char, []).append(filename)

# 处理每个字符组
for char, file_list in char_groups.items():
    target_folder = os.path.join(target_root, char)
    os.makedirs(target_folder, exist_ok=True)

    # 获取已有文件最大编号
    existing_files = [f for f in os.listdir(target_folder) if f.lower().endswith('.jpg')]
    max_index = 0
    for f in existing_files:
        match = re.match(rf'{re.escape(char)}_(\d+)\.jpg', f)
        if match:
            idx = int(match.group(1))
            max_index = max(max_index, idx)

    # 移动并重命名新文件
    for i, filename in enumerate(sorted(file_list)):
        new_index = max_index + i + 1
        new_name = f"{char}_{new_index:03d}.jpg"
        src_path = os.path.join(source_folder, filename)
        dst_path = os.path.join(target_folder, new_name)
        shutil.move(src_path, dst_path)

print("✅ 所有新图片已按字符归类并自动编号移动完成")

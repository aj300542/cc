import os
import shutil
import re

target_root = './json'

# 遍历 json 目录下的所有子目录
for folder in os.listdir(target_root):
    folder_path = os.path.join(target_root, folder)

    # 跳过非目录项
    if not os.path.isdir(folder_path):
        continue

    # 检查是否是多余目录（例如 百_001）
    match = re.match(r'^(.+?)_(\d+)$', folder)
    if not match:
        continue  # 跳过正常目录（如 百）

    base_char = match.group(1)
    base_folder = os.path.join(target_root, base_char)

    # 如果主目录不存在，则创建
    os.makedirs(base_folder, exist_ok=True)

    # 获取主目录中已有的最大编号
    existing_files = [f for f in os.listdir(base_folder) if f.lower().endswith('.jpg')]
    max_index = 0
    for f in existing_files:
        m = re.match(rf'{re.escape(base_char)}_(\d+)\.jpg', f)
        if m:
            idx = int(m.group(1))
            max_index = max(max_index, idx)

    # 移动并重命名当前目录中的所有图片
    images = [f for f in os.listdir(folder_path) if f.lower().endswith('.jpg')]
    for i, img in enumerate(sorted(images)):
        new_index = max_index + i + 1
        new_name = f"{base_char}_{new_index:03d}.jpg"
        src_path = os.path.join(folder_path, img)
        dst_path = os.path.join(base_folder, new_name)
        shutil.move(src_path, dst_path)

    # 删除空目录
    shutil.rmtree(folder_path)
    print(f"✅ 已合并并删除目录：{folder}")

print("🎉 所有多余目录已整理完毕，图片统一归类并重新编号")

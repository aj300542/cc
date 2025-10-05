import os
import json

root_folder = './json'

total_json_files = 0
total_images = 0
updated_chars = []

for char_folder in os.listdir(root_folder):
    folder_path = os.path.join(root_folder, char_folder)
    if not os.path.isdir(folder_path):
        continue

    indices = []

    for filename in os.listdir(folder_path):
        if not filename.lower().endswith('.jpg'):
            continue

        base_name = os.path.splitext(filename)[0]
        parts = base_name.split('_')

        # 确保文件属于当前字符
        if parts[0] != char_folder:
            continue

        # 提取编号
        if len(parts) == 1:
            index = 0
        else:
            try:
                index = int(parts[1])
            except ValueError:
                continue

        indices.append(index)

    if indices:
        indices.sort()
        json_path = os.path.join(root_folder, f"{char_folder}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(indices, f, ensure_ascii=False, separators=(', ', ': '))

        total_json_files += 1
        total_images += len(indices)
        updated_chars.append((char_folder, len(indices)))

# ✅ 输出统计信息
print(f"\n✅ 共生成 JSON 文件：{total_json_files} 个")
print(f"📦 总计处理字符图片：{total_images} 张")
print("📝 更新的字符目录：")
for char, count in updated_chars:
    print(f"  - {char}：{count} 张图片")

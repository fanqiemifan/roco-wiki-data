# roco-wiki-data

洛克王国宠物图鉴数据（JSON），托管在 GitHub，可通过以下方式在国内直接访问。

## 数据文件

| 文件 | 内容 | 条数 |
| --- | --- | --- |
| [`data/pets.json`](data/pets.json) | 宠物完整数据（`pet_id` 为主键，含 `form` 形态字段） | 657 |
| [`data/final_forms.json`](data/final_forms.json) | 最终形态精简表（字段：`id` / `name` / `form` / `leader_potential` / `main_type` / `sub_type` / `implemented`） | 259 |
| [`data/attribute_mapping.json`](data/attribute_mapping.json) | 属性编号 → 属性名映射（如 `06`=光、`18`=恶） | 18 |

数据约定：`pets.json` 的 `form` 为空字符串表示无形态；`final_forms.json` 无副属性时 `sub_type` 为 `null`。

## 访问方式

以 `pets.json` 为例，把路径中的文件名替换即可访问其他文件。

### jsDelivr CDN（国内推荐，速度快）

```text
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/pets.json
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/final_forms.json
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/attribute_mapping.json
```

如需固定版本、避免缓存影响，可用 commit/tag 替换 `@main`，例如 `@75037af`。

### GitHub Pages

```text
https://fanqiemifan.github.io/roco-wiki-data/data/pets.json
https://fanqiemifan.github.io/roco-wiki-data/data/final_forms.json
https://fanqiemifan.github.io/roco-wiki-data/data/attribute_mapping.json
```

### GitHub Raw（国内直连不稳定，备用）

```text
https://raw.githubusercontent.com/fanqiemifan/roco-wiki-data/main/data/pets.json
```

## 快速使用

```bash
curl -sL https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/pets.json -o pets.json
```

```javascript
const res = await fetch('https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/pets.json');
const pets = await res.json();
```

## 更新数据

修改 `data/` 下的 JSON 并推送到 `main` 分支即可，jsDelivr 与 GitHub Pages 会自动同步（jsDelivr 有约 12 小时缓存，可用 `@<commit>` 立即取到最新内容）。

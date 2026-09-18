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

修改 `data/` 下的 JSON 并推送到 `main` 分支即可，jsDelivr 与 GitHub Pages 会自动同步（jsDelivr 有约 12 小时缓存，可用 `@<commit>` 立即取到最新内容）。`data/SHA256SUMS` 无需手动维护，CI 会自动重算并提交。

## 完整性校验（防劫持）

所有访问端点均为 HTTPS，但 HTTPS 防不了「返回合法证书的假内容」（DNS 劫持、CDN 缓存投毒、镜像篡改）。因此仓库提供 `data/SHA256SUMS` 校验文件，并由 GitHub Actions 自动保障：

- **数据更新时**：自动重算各 JSON 的 SHA-256，更新 `data/SHA256SUMS`；
- **每 6 小时巡检**：从 jsDelivr 和 GitHub Pages 实际下载文件，与仓库内哈希逐一比对，不一致则该次 Action 失败（GitHub 默认会给仓库所有者发失败通知邮件），即可第一时间发现镜像被劫持。

### 下载后手动校验

```bash
base="https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data"
curl -fsSL "$base/SHA256SUMS" -o SHA256SUMS
for f in pets.json final_forms.json attribute_mapping.json; do
  curl -fsSL "$base/$f" -o "$f"
done
shasum -a 256 -c SHA256SUMS   # macOS；Linux 用 sha256sum -c SHA256SUMS
```

三行输出 `OK` 即内容未被篡改。基准哈希以 GitHub 仓库为准；更严格的场景可在固定 commit 的 URL 上取 SHA256SUMS（`@<commit>` 内容不可变）。

### 前端 / 客户端内置校验

发布客户端时，把当时版本的哈希写死在代码里（从 `data/SHA256SUMS` 取），下载后比对：

```javascript
const EXPECTED_SHA256 = {
  'pets.json': 'b2b4d119ef51cd9420ca13e4fda40570326017855b537e3bf38b54f1af2e35b9',
  // 其他文件同理，发版时从 data/SHA256SUMS 取最新值
};

const buf = await (await fetch(url)).arrayBuffer();
const hex = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))]
  .map(b => b.toString(16).padStart(2, '0')).join('');
if (hex !== EXPECTED_SHA256['pets.json']) throw new Error('数据校验失败，可能被劫持');
```

网页用 `<script>`/`<link>` 标签加载时，也可直接用 SRI 的 `integrity` 属性（`sha384-<base64>`，可用 `openssl dgst -sha384 -binary 文件 | openssl base64 -A` 生成）。

### 信任边界

这套机制校验的是「CDN / Pages 镜像与 GitHub 仓库内容是否一致」，可防 DNS 劫持、缓存投毒、CDN 篡改。它不能防 GitHub 仓库本身被改（写权限泄露）；如有该需求，可对 `SHA256SUMS` 做离线签名（如 minisign），公钥内置到客户端，此处暂未启用。

# roco-wiki-data

洛克王国宠物图鉴数据（JSON），托管在 GitHub，可通过以下方式在国内直接访问。

## 数据文件

| 文件 | 内容 | 条数 |
| --- | --- | --- |
| [`data/pets_family.json`](data/pets_family.json) | 进化链（`families` → `chains` → `members`，含 `is_final` 终态标记与 `pet_family_map` / `pet_chain_map` 索引） | 194 家族 / 262 条链 |
| [`data/pets_norm.json`](data/pets_norm.json) | 宠物完整数据（主键 `pet_id`，含 `stage` / `form` / `elements` / 四个图片 URL / `season` / `feature` / `description` / 技能 ID 列表 / `profile.attributes` 与克制关系） | 667 |
| [`data/skills.json`](data/skills.json) | 技能数据（主键 `skill_id`，含 `name` / `icon` / `description` / `cost` / `power` / `element_type` / `skill_type` / `pet_count` / `flavor_text`），与 `pets_norm.json` 的 `skills` ID 列表对应 | 588 |
| [`data/attribute_mapping.json`](data/attribute_mapping.json) | 属性编号 → 属性名映射（如 `06`=光、`18`=恶） | 18 |

数据约定：`pets_norm.json` 的 `form` 为空字符串表示无形态；`elements` 是同序数组，`elements[0]` 即主属性、`[1]` 为副属性；`skills` 只存技能 ID（技能详情见同目录 `skills.json`，按 `skill_id` 反查）；`profile.type_effectiveness` 已去掉 `type_id`，只保留 `multiplier` 与属性名。`skills.json` 的 `element_type` / `skill_type` 是字符串（上游原始响应给的是 `{id, name}` 对象，发布前已归一成名字）。

`pets_family.json` 的结构要点：同一图鉴号的多个形态是**并列**的多条 `chains`（按 `family_id` 归到同一家族，`multi_form: true`），上下游一律靠成员的 `previous_pet_id` 串，**不要按图鉴号或名称关联**；成员的 `is_final` 已排除首领化（`condition: "首领化"`）与展示形态（`form` 为 `首领形态` / `领地试炼用`），顶层 `final_pet_ids` 是去重后的终态清单；`pet_chain_map` 给 form 级链 id，`pet_family_map` 给家族 id。

`pets_norm.json` 是唯一精灵主表（667 条），`pets_family.json` 里的 `pet_family_map` / `pet_chain_map` / 成员 `pet_id` 全部以它为基准；最终形态看进化链成员的 `is_final`（顶层另有去重后的 `final_pet_ids`），不再单独提供最终形态表。

本仓库是对外**唯一数据源**，内容不由此仓库产生：四个 JSON 由 [`roco-Component-Library`](https://github.com/fanqiemifan/roco-Component-Library) 的 `getdata/` 脚本抓取、清洗后发布过来（见下文「更新数据」）。

## 访问方式

以 `pets_norm.json` 为例，把路径中的文件名替换即可访问其他文件。

**新鲜度**：jsDelivr 对 `@main` 有约 12 小时缓存，过期副本的签名依然合法（验签拦不住），会让下游静默滞后——2026-10-17 实测过：仓库已是 667 条 / v3，`@main` 仍返回 657 条 / v2 且验签通过。因此：

- 要**最新数据**：用 GitHub Pages（跟着默认分支走，无长缓存），或 jsDelivr 锁 `@<commit>` / `@<tag>`；
- 锁 commit/tag 时 jsDelivr 内容不可变、国内也最快，是首选；
- 下面的 Node 客户端已按此排序：`ref: 'main'` 时 Pages 优先、jsDelivr 兜底，锁定 commit/tag 时 jsDelivr 优先。

### jsDelivr CDN（国内速度快，`@main` 有约 12 小时缓存）

```text
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/pets_family.json
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/pets_norm.json
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/skills.json
https://cdn.jsdelivr.net/gh/fanqiemifan/roco-wiki-data@main/data/attribute_mapping.json
```

如需固定版本、避免缓存影响，可用 commit/tag 替换 `@main`，例如 `@75037af`。

### GitHub Pages（跟着默认分支，取最新用它）

```text
https://fanqiemifan.github.io/roco-wiki-data/data/pets_family.json
https://fanqiemifan.github.io/roco-wiki-data/data/pets_norm.json
https://fanqiemifan.github.io/roco-wiki-data/data/skills.json
https://fanqiemifan.github.io/roco-wiki-data/data/attribute_mapping.json
```

### GitHub Raw（国内直连不稳定，备用）

```text
https://raw.githubusercontent.com/fanqiemifan/roco-wiki-data/main/data/pets_norm.json
```

## 快速使用

```bash
curl -sL https://fanqiemifan.github.io/roco-wiki-data/data/pets_norm.json -o pets_norm.json
```

```javascript
const res = await fetch('https://fanqiemifan.github.io/roco-wiki-data/data/pets_norm.json');
const pets = await res.json();
```

查进化链（上一阶段 / 下一阶段）时，顺着 `previous_pet_id` 走，不要按图鉴号关联：

```javascript
const fam = await (await fetch('https://fanqiemifan.github.io/roco-wiki-data/data/pets_family.json
https://fanqiemifan.github.io/roco-wiki-data/data/pets_norm.json')).json();
const petId = 3296;   // 卡瓦重·雪山附近的样子
const chain = fam.families
  .flatMap(f => f.chains)
  .find(c => c.family_id === fam.pet_chain_map[String(petId)]);
const me = chain.members.find(m => m.pet_id === petId);
const prev = chain.members.find(m => m.pet_id === me.previous_pet_id);  // 上一阶段 3293 卡卡虫
const next = chain.members.filter(m => m.previous_pet_id === petId);   // 下一阶段（可能含「首领化」）
```

## 作为 npm 依赖引入（Node / Electron，推荐）

npm 11 起**默认禁用 git 依赖**，直接 `npm i github:...` 会报 `EALLOWGIT — Fetching packages of type "git" have been disabled`，需要显式放开：

```bash
npm i github:fanqiemifan/roco-wiki-data --allow-git=all
```

或在项目 `.npmrc` 里长期放开（团队/CI 都要装时推荐这个）：

```ini
allow-git=all
```

lockfile 会把依赖锁定到具体 commit，升级用 `npm update roco-wiki-data`；`signing-key.pub` 随包进入 `node_modules`，等同于把公钥打包进软件。

```javascript
const { loadAll } = require('roco-wiki-data');

// 联网验签取最新；全部来源失败时自动回退到 cacheDir 里上次验签通过的副本
const data = await loadAll({ ref: 'main', cacheDir: './.cache/roco-wiki-data' });
const attrs = data['pets_norm.json'].json.items[0].profile.attributes;
```

`cacheDir` 里存的是**验签通过的原始字节和对应的 `.sig`**，不是重新序列化的 JSON，所以离线读取时会再验一次签：缓存被改动或截断就直接丢弃并抛错，不会返回 `null` 或半截数据。`ref: 'main'` 时来源顺序是 Pages → jsDelivr → raw（原因见「访问方式」的新鲜度说明），锁定 commit/tag 时是 jsDelivr → raw。

`loadAll()` 默认只取三份核心数据；技能表不在默认集里，按需单独取（同样验签 + 缓存）：

```javascript
const skills = await loadFile('skills.json', { ref: 'main', cacheDir: './.cache/roco-wiki-data' });
const byId = new Map(skills.json.items.map(s => [s.skill_id, s]));
```

不需要签名校验、只要静态读一份快照时，直接引 JSON 子路径：

```javascript
const pets = require('roco-wiki-data/data/pets_norm.json');
const families = require('roco-wiki-data/data/pets_family.json');
const skills = require('roco-wiki-data/data/skills.json');
const norm = require('roco-wiki-data/data/pets_norm.json');
```

`loadFile(name, { ref, cacheDir, timeout, offline })` / `loadAll(opts)` / `fetchVerified(name, opts)` / `verifySignature(buf, sig)` 均可单独使用；ESM 走 `import { loadFile } from 'roco-wiki-data'`。

## 更新数据

不要在本仓库手改 JSON。生产端是 `roco-Component-Library`，在那里跑：

```bash
python getdata/publish_wiki_data.py --dry-run   # 先看校验结果与将发布的增删
python getdata/publish_wiki_data.py             # 校验通过后同步到本仓库并推送
```

脚本会先校验（`count` 与条数一致、`pet_id` / `family_id` / `skill_id` 唯一、名称无不可见字符、`skills.json` 的 `element_type` / `skill_type` 是字符串而不是上游原始的 `{id, name}` 对象、`pets_family.json` 的成员 / 家族索引全部能在 `pets_norm.json` 里找到、条数不无故减少），通过后才把四个文件写进本地 clone 并提交推送；同时把 `package.json` 的 `version` 改成各文件 `updatetime` 里最新的那天（calver，如 `2026.10.30`）。写入时只把 CRLF 归一成 LF，不做重新序列化，推上去的字节就是生产端那份。

推送后 CI 自动重算 `data/SHA256SUMS`、重签全部数据文件，并巡检 jsDelivr 与 GitHub Pages 是否与仓库一致。jsDelivr 对 `@main` 有约 12 小时缓存，需要立刻取到最新内容就用 `@<commit>` 或 `@<tag>`。

## 完整性校验（防劫持）

所有访问端点均为 HTTPS，但 HTTPS 防不了「返回合法证书的假内容」（DNS 劫持、CDN 缓存投毒、镜像篡改）。因此仓库提供 `data/SHA256SUMS` 校验文件，并由 GitHub Actions 自动保障：

- **数据更新时**：自动重算各 JSON 的 SHA-256，更新 `data/SHA256SUMS`；
- **每 6 小时巡检**：从 jsDelivr 和 GitHub Pages 实际下载文件，与仓库内哈希逐一比对，不一致则该次 Action 失败（GitHub 默认会给仓库所有者发失败通知邮件），即可第一时间发现镜像被劫持。

### 下载后手动校验

```bash
base="https://fanqiemifan.github.io/roco-wiki-data/data"
curl -fsSL "$base/SHA256SUMS" -o SHA256SUMS
for f in pets_norm.json pets_family.json skills.json attribute_mapping.json; do
  curl -fsSL "$base/$f" -o "$f"
done
shasum -a 256 -c SHA256SUMS   # macOS；Linux 用 sha256sum -c SHA256SUMS
```

三行输出 `OK` 即内容未被篡改。基准哈希以 GitHub 仓库为准；更严格的场景可在固定 commit 的 URL 上取 SHA256SUMS（`@<commit>` 内容不可变）。

注意：校验文件和数据必须取自**同一来源同一版本**。若两者都取自 `jsDelivr@main` 的过期快照，`sha256sum -c` 同样全部 `OK`——它证明的是「这份内容与它的哈希表一致」，不是「这份内容是最新的」。要断言最新，把 SHA256SUMS 从 GitHub 仓库（或 `@<commit>`）取。

### 前端 / 客户端内置校验

发布客户端时，把当时版本的哈希写死在代码里（从 `data/SHA256SUMS` 取），下载后比对：

```javascript
const EXPECTED_SHA256 = {
  'pets_norm.json': '9fee917b7e73e1dc82c6857f49b2fbd94e0f512d48a8807d336b5d8e9efdc79c',
  // 其他文件同理，发版时从 data/SHA256SUMS 取最新值
};

const buf = await (await fetch(url)).arrayBuffer();
const hex = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))]
  .map(b => b.toString(16).padStart(2, '0')).join('');
if (hex !== EXPECTED_SHA256['pets_norm.json']) throw new Error('数据校验失败，可能被劫持');
```

网页用 `<script>`/`<link>` 标签加载时，也可直接用 SRI 的 `integrity` 属性（`sha384-<base64>`，可用 `openssl dgst -sha384 -binary 文件 | openssl base64 -A` 生成）。

### 信任边界

哈希巡检校验的是「CDN / Pages 镜像与 GitHub 仓库内容是否一致」，可防 DNS 劫持、缓存投毒、CDN 篡改。打包软件的热更新请使用下一节的签名校验，可进一步防仓库内容被篡改。

## 热更新签名校验（打包软件防污染下载）

软件热更新不能只靠 HTTPS——链路上的污染（DNS 劫持、假 CDN 内容）会带着合法证书原样到达客户端。因此每个数据文件都附带离线签名 `data/<文件名>.sig`（RSA-2048，SHA-256 + PKCS#1 v1.5，覆盖文件全部字节）：**私钥只存在于维护者本机 `~/.roco-wiki-signing/` 和 GitHub Secrets（`SIGNING_PRIVATE_KEY`）**，公钥 [`signing-key.pub`](signing-key.pub) 内置到软件里。私钥不泄露，任何人都无法伪造可通过校验的数据，CI 在每次数据更新时自动重签。

### 客户端更新流程（fail-closed）

1. 从同一来源下载 `pets_norm.json` 与 `pets_norm.json.sig`；
2. 用内置公钥验签，**失败则丢弃本次下载，沿用本地旧数据，稍后重试**；
3. 验签通过才解析并替换本地缓存。

注意：公钥必须**编译/打包进软件**，运行时从网络上取公钥会形成循环信任，等于没防。

### 客户端验签示例

Node / Electron：

```javascript
const crypto = require('node:crypto');

// 打包时把 signing-key.pub 的内容整体内置为字符串
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----`;

async function fetchVerified(baseUrl, file) {
  const [data, sig] = await Promise.all([
    (await fetch(`${baseUrl}/${file}`)).arrayBuffer(),
    (await fetch(`${baseUrl}/${file}.sig`)).arrayBuffer(),
  ]);
  const ok = crypto.verify('sha256', Buffer.from(data), PUBLIC_KEY, Buffer.from(sig));
  if (!ok) throw new Error(`${file} 签名校验失败，可能被污染，拒绝使用`);
  return JSON.parse(Buffer.from(data).toString('utf8'));
}
```

浏览器端用 WebCrypto：`crypto.subtle.importKey('spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])` 后 `crypto.subtle.verify(...)`。

Python：

```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

pub = serialization.load_pem_public_key(open('signing-key.pub', 'rb').read())
data = httpx.get(f'{base}/pets_norm.json').content
sig = httpx.get(f'{base}/pets_norm.json.sig').content
pub.verify(sig, data, padding.PKCS1v15(), hashes.SHA256())  # 失败抛 InvalidSignature
```

C# / .NET：

```csharp
using var rsa = RSA.Create();
rsa.ImportSubjectPublicKeyInfo(pubKeyPemBytes, out _);  // .NET Core 3+；Unity 需自备 PEM 解析或 BouncyCastle
bool ok = rsa.VerifyData(dataBytes, sigBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
```

Go：

```go
block, _ := pem.Decode(pubPem)
parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
pub := parsed.(*rsa.PublicKey)
if err := rsa.VerifyPKCS1v15(pub, crypto.SHA256, data, sig); err != nil {
    // 签名不符，拒绝使用
}
```

### 密钥保管与轮换

- 私钥 `~/.roco-wiki-signing/private-key.pem` **务必备份**；丢失后只能生成新密钥对，并通过发布软件更新替换内置公钥（旧软件只认旧公钥）。
- 更换密钥：生成新密钥对 → `gh secret set SIGNING_PRIVATE_KEY` 更新 Secrets → 推送新 `signing-key.pub` → 发布内置新公钥的软件版本。
- CI 自动签名意味着「获得仓库写权限的攻击者可让 CI 替其签名」；若要连这一层也防住，可改为本地手动签名后再推送：

```bash
openssl dgst -sha256 -sign ~/.roco-wiki-signing/private-key.pem -out data/pets_norm.json.sig data/pets_norm.json
```

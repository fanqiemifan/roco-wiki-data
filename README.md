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

哈希巡检校验的是「CDN / Pages 镜像与 GitHub 仓库内容是否一致」，可防 DNS 劫持、缓存投毒、CDN 篡改。打包软件的热更新请使用下一节的签名校验，可进一步防仓库内容被篡改。

## 热更新签名校验（打包软件防污染下载）

软件热更新不能只靠 HTTPS——链路上的污染（DNS 劫持、假 CDN 内容）会带着合法证书原样到达客户端。因此每个数据文件都附带离线签名 `data/<文件名>.sig`（RSA-2048，SHA-256 + PKCS#1 v1.5，覆盖文件全部字节）：**私钥只存在于维护者本机 `~/.roco-wiki-signing/` 和 GitHub Secrets（`SIGNING_PRIVATE_KEY`）**，公钥 [`signing-key.pub`](signing-key.pub) 内置到软件里。私钥不泄露，任何人都无法伪造可通过校验的数据，CI 在每次数据更新时自动重签。

### 客户端更新流程（fail-closed）

1. 从同一来源下载 `pets.json` 与 `pets.json.sig`；
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
data = httpx.get(f'{base}/pets.json').content
sig = httpx.get(f'{base}/pets.json.sig').content
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
openssl dgst -sha256 -sign ~/.roco-wiki-signing/private-key.pem -out data/pets.json.sig data/pets.json
```

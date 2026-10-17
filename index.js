'use strict';

/**
 * roco-wiki-data 热更新客户端（零依赖，Node >= 18）。
 *
 * 数据文件都带离线签名 data/<文件名>.sig（RSA-2048, SHA-256 + PKCS#1 v1.5）。
 * 本模块把公钥从包内 signing-key.pub 读取 —— 包随应用一起分发（npm git 依赖会被
 * lockfile 锁定到具体 commit），所以公钥等同于「编译进软件」，不存在运行时取公钥的循环信任。
 *
 * 安全策略是 fail-closed：所有来源都取不到、或验签不过，就丢弃本次下载，
 * 回退到 cacheDir 里上一次验签通过的副本；宁可继续用旧数据，也不接受未签名的内容。
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPO = 'fanqiemifan/roco-wiki-data';
const OWNER = 'fanqiemifan';
const FILES = ['pets.json', 'final_forms.json', 'attribute_mapping.json'];

const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, 'signing-key.pub'), 'utf8');

// ref 可以是 main / tag / commit。jsDelivr 对 @main 有约 12 小时缓存，
// 需要立刻拿到最新内容就传具体 commit 或 tag。
function sourcesFor(ref) {
  const list = [`https://cdn.jsdelivr.net/gh/${REPO}@${ref}/data`];
  // Pages 只服务默认分支，锁定 ref 时不能拿它兜底，否则会静默取到最新版
  if (ref === 'main') list.push(`https://${OWNER}.github.io/${REPO.split('/')[1]}/data`);
  list.push(`https://raw.githubusercontent.com/${REPO}/${ref}/data`);
  return list;
}

function verifySignature(data, signature) {
  return crypto.verify('sha256', data, PUBLIC_KEY, signature);
}

async function get(url, timeout) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// 返回 { json, source, verified: true }
async function fetchVerified(name, { ref = 'main', timeout = 15000 } = {}) {
  const attempts = [];
  for (const base of sourcesFor(ref)) {
    const url = `${base}/${name}`;
    try {
      const [data, sig] = await Promise.all([
        get(url, timeout),
        get(`${url}.sig`, timeout),
      ]);
      if (!verifySignature(data, sig)) throw new Error('签名校验失败');
      return { json: JSON.parse(data.toString('utf8')), source: url, verified: true };
    } catch (e) {
      attempts.push(`${url} : ${e.message}`);
    }
  }
  throw new Error(`${name} 未取得可信副本:\n  ${attempts.join('\n  ')}`);
}

function readCache(file) {
  try {
    return { json: JSON.parse(fs.readFileSync(file, 'utf8')), source: file, verified: true, fromCache: true };
  } catch (e) {
    // 缓存损坏（写半截等），删掉以免每次都命中坏文件
    fs.rmSync(file, { force: true });
    return null;
  }
}

/**
 * 取单个数据文件。默认联网优先，这样热更新能立刻生效：
 *   联网验签成功 -> 返回并写入 cacheDir
 *   联网全失败   -> 回退 cacheDir 里上一次验签通过的副本；没有缓存才抛错
 * opts.offline = true 时只读缓存，不联网。
 */
async function loadFile(name, opts = {}) {
  const cached = opts.cacheDir ? path.join(opts.cacheDir, name) : null;

  if (opts.offline) {
    if (cached && fs.existsSync(cached)) return readCache(cached);
    throw new Error(`offline 模式但本地无缓存: ${name}`);
  }

  try {
    const result = await fetchVerified(name, opts);
    if (cached) {
      fs.mkdirSync(opts.cacheDir, { recursive: true });
      const tmp = `${cached}.part`;
      fs.writeFileSync(tmp, JSON.stringify(result.json));
      fs.renameSync(tmp, cached);
    }
    return result;
  } catch (e) {
    if (cached && fs.existsSync(cached)) {
      const hit = readCache(cached);
      if (hit) return hit;
    }
    throw e;
  }
}

async function loadAll(opts = {}) {
  const out = {};
  for (const name of FILES) out[name] = await loadFile(name, opts);
  return out;
}

module.exports = { REPO, FILES, PUBLIC_KEY, sourcesFor, verifySignature, fetchVerified, loadFile, loadAll };

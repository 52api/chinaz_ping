<div align="center">
  <h1>Chinaz Ping 检测</h1>
  <p>基于 Playwright 浏览器自动化的多地 Ping 检测工具，获取 chinaz.com 的分布式节点检测结果</p>
  <img src="https://img.shields.io/badge/语言-JavaScript-f7df1e?style=flat-square&logo=javascript">
  <img src="https://img.shields.io/badge/运行时-Node.js_18%2B-339933?style=flat-square&logo=nodedotjs">
  <img src="https://img.shields.io/badge/自动化-Playwright-45ba4b?style=flat-square">
  <img src="https://img.shields.io/badge/浏览器-Chrome-4284f5?style=flat-square&logo=googlechrome">
  <br>
  <img src="https://img.shields.io/badge/检测节点-50%2B_全国多节点-00c853?style=flat-square">
  <img src="https://img.shields.io/badge/输出-JSON-ff6f00?style=flat-square">
  <br><br>
</div>

---

## 📋 项目信息

| 项目 | 说明 |
|------|------|
| **开发语言** | JavaScript (Node.js 18+) |
| **核心依赖** | Playwright 浏览器自动化框架 |
| **浏览器** | 系统已安装的 Chrome |
| **数据来源** | ping.chinaz.com |
| **检测类型** | ICMP Ping（多地分布式） |
| **输出格式** | JSON（stdout） |

---

## 🏗 架构说明

```
node chinaz_ping.js <域名>
        │
        ▼
  Playwright 启动 Headless Chrome
        │
        ▼
  访问 https://ping.chinaz.com/{域名}
        │
        ▼
  等待页面 JS 渲染完成 (networkidle)
        │
        ▼
  page.evaluate() 从 DOM 提取 Ping 结果表
        │
        ▼
  结构化 JSON 输出到 stdout
```

### 技术要点

| 要点 | 说明 |
|------|------|
| **反爬处理** | chinaz 禁止直接 HTTP POST（返回 503），必须通过浏览器执行 JS |
| **无界面模式** | `headless: true`，无需显示浏览器窗口 |
| **指纹隐藏** | 注入脚本覆盖 `navigator.webdriver`，降低自动化检测概率 |
| **数据提取** | 直接在页面 DOM 中定位结果表格，提取 IP / 时延 / TTL / 丢包率 |

---

## 🔧 安装

```bash
cd chinaz_ping
npm init -y
npm install playwright
```

---

## 📄 文件结构

| 文件 | 必需 | 说明 |
|------|------|------|
| `chinaz_ping.js` | ✅ | 主脚本（入口） |
| `README.md` | - | 本说明文档 |

---

## 🚀 使用

```bash
node chinaz_ping.js <域名>
node chinaz_ping.js cloud.tencent.com
node chinaz_ping.js baidu.com
node chinaz_ping.js 8.8.8.8
```

### 示例

```bash
$ node chinaz_ping.js cloud.tencent.com
```

输出：

```json
{
  "domain": "cloud.tencent.com",
  "nodes": [
    {
      "location": "浙江宁波[电信]",
      "ip": "125.64.108.14",
      "time": "38ms",
      "ttl": "45",
      "loss": "--"
    },
    {
      "location": "福建厦门[电信]",
      "ip": "171.80.10.86",
      "time": "31ms",
      "ttl": "42",
      "loss": "--"
    }
  ],
  "node_count": 57
}
```

---

## 📤 输出字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `domain` | string | 被检测的域名或 IP |
| `nodes` | array | 检测节点列表 |
| `nodes[].location` | string | 节点位置及运营商，如 `浙江宁波[电信]` |
| `nodes[].ip` | string | 响应 IP 地址，超时为 `超时` |
| `nodes[].time` | string | 响应时间，如 `38ms` |
| `nodes[].ttl` | string | TTL 值 |
| `nodes[].loss` | string | 丢包率 |
| `node_count` | int | 总节点数 |

---

## ⚠️ 注意事项

- **数据时效性**：脚本解析的是页面**当前已存在**的检测结果缓存，不是实时触发的新检测。Chinaz 对"立即检测"按钮的 POST 请求有严格的 503 反爬限制
- **如需实时数据**：手动在浏览器中打开 `https://ping.chinaz.com/{域名}`，点击"立即检测"，等待结果刷新后运行本脚本即可获取最新数据
- **浏览器要求**：需要系统已安装 Chrome 浏览器
- **运行速度**：首次运行需等待页面加载（约 5-10 秒），后续因缓存会更快

---

## 🔍 检测节点覆盖

chinaz 的 Ping 检测覆盖全国主要城市及部分海外节点，包括：

| 运营商 | 覆盖区域 |
|--------|---------|
| 电信 | 浙江、福建、广东、湖北、四川、陕西、上海、北京等 |
| 联通 | 山东、浙江、四川等 |
| 移动 | 四川等 |
| 多线 | 河南、内蒙古等 |
| 海外 | 香港、美国、日本、韩国、新加坡、德国等 |

---

<div align="center">
  <p>本项目由 <a href="https://www.52api.cn"><b>我爱API平台</b></a> 提供</p>
  <p>官方 QQ 群：<code>1072499758</code></p>
</div>

# DeepFill

> ⚠️ Unofficial third-party integration, not affiliated with DeepSeek.

基于 DeepSeek [FIM 补全 API](https://api-docs.deepseek.com/zh-cn/guides/fim_completion) 的 VSCode 行内代码补全插件。

## 特性

- 🔮 **行内幽灵文本补全**：输入停顿后自动请求补全，`Tab` 一键接受
- 🧩 **FIM 中间填充**：同时发送光标前后文（prefix + suffix），函数中间也能精准补全
- ⌨️ **手动触发**：`Alt+\`（可自定义）随时唤起补全
- 🔐 **API Key 安全存储**：保存在 VSCode Secret Storage，不写明文配置
- 🎛️ **可配置**：模型、token 上限、温度、上下文窗口、防抖时间均可调
- 📊 **状态栏指示**：实时显示补全状态，点击切换开关

## 快速开始

1. 在 [DeepSeek Platform](https://platform.deepseek.com/api_keys) 创建 API Key
2. 安装插件后，命令面板（`Cmd/Ctrl+Shift+P`）执行 **`DeepFill: Set API Key`**
3. 打开任意代码文件，输入停顿后自动出现灰色补全，按 `Tab` 接受
4. 手动触发：`Alt+\`；开关补全：点击状态栏 DeepFill 图标

## 开发调试

```bash
npm install
# F5 启动 Extension Development Host 调试
# 或手动编译：
npm run compile
```

打包发布：

```bash
npm run package   # 生成 deepfill-x.x.x.vsix
```

### 自动发布（GitHub Actions）

推送 `v*` tag 会自动打包并发布到 VS Code Marketplace：

```bash
# 1. 修改 package.json 的 version（例如 0.2.0）
# 2. 打 tag 并推送
git tag v0.2.0 && git push origin v0.2.0
```

工作流会校验 tag 与 package.json 版本一致，然后通过仓库 Secret `VSCE_PAT` 登录发布（PAT 需勾选 Marketplace > Manage 权限）。

## 配置项

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `deepfill.apiKey` | `""` | API Key（建议用命令保存到 Secret Storage，此项为兜底） |
| `deepfill.baseUrl` | `https://api.deepseek.com/beta` | API 地址，FIM 必须走 `/beta` |
| `deepfill.model` | `deepseek-v4-pro` | 模型 ID |
| `deepfill.maxTokens` | `256` | 最大生成 token（API 上限 4096） |
| `deepfill.temperature` | `0.2` | 采样温度，越低越稳定 |
| `deepfill.prefixLength` | `4000` | 光标前文最大字符数 |
| `deepfill.suffixLength` | `1024` | 光标后文最大字符数 |
| `deepfill.debounceMs` | `300` | 输入停顿多久后触发请求 |
| `deepfill.enabled` | `true` | 补全开关 |

## 工作原理

```
光标位置
   ↓
  前缀 (prompt)  │  后缀 (suffix)
┌────────────────┼──────────────┐
│ ...def fib(a): │    return... │
└────────────────┴──────────────┘
          ↓
POST /beta/completions  { prompt, suffix }
          ↓
       补全中间内容 → 幽灵文本展示
```

1. 输入停顿（debounce）后，截取光标前 `prefixLength` 字符作为 `prompt`、后 `suffixLength` 字符作为 `suffix`
2. 调用 `POST https://api.deepseek.com/beta/completions`
3. 返回文本经过去重、去重叠、空白清理后，以 InlineCompletionItem 展示
4. 用户按 `Tab` 接受 / `Esc` 忽略

## Roadmap

- [ ] 流式输出（SSE），边生成边展示
- [ ] 按语言过滤 / 排除文件模式
- [ ] 上下文缓存优化 token 成本
- [ ] 多候选补全（Alt+] 切换）

## License

MIT

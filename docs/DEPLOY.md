# 部署指南

## Secrets

在 Cloudflare Dashboard 或 Wrangler 中配置：

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

建议值：

- `BETTER_AUTH_SECRET`：至少 32 位随机字符串
- `BETTER_AUTH_URL`：生产域名，如 `https://favor-ledger.xfy196.workers.dev`（必须与浏览器访问 Origin 一致，否则注册/登录会报 `INVALID_ORIGIN`）
- `BETTER_AUTH_TRUSTED_ORIGINS`（可选）：逗号分隔的额外可信 Origin
- `RESEND_API_KEY`：Resend API Key（用于密码重置邮件）
- `EMAIL_FROM`：已验证发件人，如 `人情记账簿 <noreply@yourdomain.com>`

未配置 `RESEND_API_KEY` 时，密码重置邮件会跳过发送并在服务端打日志。

## D1

```bash
npx wrangler d1 create favor-ledger
# 将 database_id 写入 wrangler.jsonc
npm run db:migrate:remote
```

## 发布

本地：

```bash
npm run deploy
```

### Workers Builds（Git 连接）

Dashboard → Worker → Settings → Build，必须改成：

| 设置 | 值 |
|------|-----|
| Build command | `npm run build:worker` |
| Deploy command | `npx wrangler deploy` |

不要用默认的 `npm run build`：那只会跑 `next build`，不会生成 `.open-next`。随后 `wrangler deploy` 会检测到 OpenNext 并转调 `opennextjs-cloudflare deploy`，于是报 `Could not find compiled Open Next config`。

也可把 Deploy command 设为 `npm run deploy`（内部会先 build 再 deploy）；此时 Build command 可留空，避免重复构建。

## 本地验收清单（§11）

1. 注册 / 登录邮箱账号
2. 录入收礼 800（张三婚礼）→ 显示待回礼
3. 回礼配对该事项，回 800 → 两清；回 500 → 回少 300；回 1000 → 回多 200
4. 同一人另一条收礼仍为待回礼
5. 重名提醒可继续保存
6. 配偶经手与本人经手合并到同一对方
7. 删除已配对收礼后回礼解除配对
8. 编辑回礼可解除配对
9. 导出 JSON → 清空 → 导入，状态一致
10. 移动端可完成录入与查看

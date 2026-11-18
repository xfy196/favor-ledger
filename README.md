# 人情记账簿

家庭人情往来记账：收礼 / 回礼一对一配对、两清判定、按人聚合。  
技术栈：Next.js · Cloudflare Workers (OpenNext) · D1 · Better Auth · Drizzle。

## 本地开发

需要 Node.js ≥ 22.12（推荐 24）。

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

打开 http://localhost:3000 ，注册邮箱账号后即可使用。

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | Next 开发服务器（含本地 D1 绑定） |
| `npm test` | 领域层单测 |
| `npm run db:migrate:local` | 应用 D1 迁移到本地 |
| `npm run preview` | OpenNext 本地 Workers 预览 |
| `npm run deploy` | 构建并部署到 Cloudflare |

## 生产部署

1. `npx wrangler d1 create favor-ledger`，把返回的 `database_id` 写入 `wrangler.jsonc`
2. `npm run db:migrate:remote`
3. 配置 secrets：

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

4. `npm run deploy`

未配置 `RESEND_API_KEY` 时，密码重置邮件会跳过发送（开发可用）。

---
title: Redis 开机自启
date: 2026-03-16
tags:
  - 自定义
  - Redis
categories:
  - 开发技巧
cover: https://valaxy-theme-sakura.s3.bitiful.net/wallpaper-2025%2Fwallhaven-858k3j.jpg
description: 在用户自己电脑上配置 Redis 开机自启
---

# 在用户自己电脑上配置 Redis 开机自启

关于**在用户自己电脑上配置 Redis 开机自启**的系统运维操作，并不涉及本仓库的代码变更，因此无需修改任何代码文件。

以下是三个平台的详细执行步骤，用户根据自己的系统选对应章节执行即可：

------

## Windows

假设你的 Redis 文件夹路径为 `C:\Redis`（按实际替换）：

**管理员方式运行命令行**

```bash
# 1. 以管理员身份打开 cmd，进入 Redis 目录
cd C:\Redis

# 2. 安装为 Windows 服务（指定配置文件）
redis-server --service-install redis.windows.conf --loglevel verbose

# 3. 设为自动启动并立即启动
sc config Redis start= auto
net start Redis

# 4. 验证
redis-cli ping
# 应返回 PONG
```

------

## Linux (systemd)

假设 Redis 可执行文件在 `/usr/local/redis/bin/redis-server`，配置文件在 `/usr/local/redis/etc/redis.conf`（按实际替换）：

```bash
# 1. 创建 systemd 服务单元文件
sudo tee /etc/systemd/system/redis.service > /dev/null <<'EOF'
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /usr/local/redis/etc/redis.conf
ExecStop=/usr/local/redis/bin/redis-cli shutdown
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 2. 重载 systemd 并启用开机自启
sudo systemctl daemon-reload
sudo systemctl enable redis
sudo systemctl start redis

# 3. 验证
sudo systemctl status redis
redis-cli ping   # 应返回 PONG
```

------

## macOS

**方式一：Homebrew（推荐）**



```bash
brew services start redis
# 验证
redis-cli ping
```

**方式二：手动（launchd），适用于自定义路径**

假设 Redis 安装在 `/opt/redis`：



```bash
# 1. 创建 plist 文件
sudo tee /Library/LaunchDaemons/io.redis.redis-server.plist > /dev/null <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.redis.redis-server</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/redis/bin/redis-server</string>
    <string>/opt/redis/etc/redis.conf</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
EOF

# 2. 加载并启动
sudo launchctl load -w /Library/LaunchDaemons/io.redis.redis-server.plist

# 3. 验证
redis-cli ping   # 应返回 PONG
```
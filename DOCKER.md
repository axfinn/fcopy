# Docker 镜像使用指南

## 镜像拉取

从 Docker Hub 拉取最新版本的 fcopy 镜像：

```bash
docker pull axiu/fcopy:latest
```

或者拉取特定版本：

```bash
docker pull axiu/fcopy:1.2.11
```

## 快速启动

使用以下命令快速启动 fcopy 服务：

```bash
docker run -d \
  --name fcopy \
  -p 2001:3000 \
  -v /path/to/data:/app/uploads \
  -e CLIPBOARD_API_KEY=your_secret_api_key \
  axiu/fcopy:latest
```

## 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `CLIPBOARD_API_KEY` | API 访问密钥 | `shared_secret_key` |
| `NODE_ENV` | 运行环境 | `production` |

## 数据持久化

为了确保数据持久化，请将容器内的 `/app/uploads` 目录挂载到宿主机：

```bash
docker run -d \
  --name fcopy \
  -p 2001:3000 \
  -v $(pwd)/data:/app/uploads \
  -e CLIPBOARD_API_KEY=your_secret_api_key \
  axiu/fcopy:latest
```

## 使用 Docker Compose（推荐）

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  fcopy:
    image: axiu/fcopy:latest
    container_name: fcopy
    ports:
      - "2001:3000"
    volumes:
      - ./data:/app/uploads
    environment:
      - CLIPBOARD_API_KEY=your_secret_api_key
    restart: unless-stopped
```

然后运行：

```bash
docker-compose up -d
```

## 访问应用

启动容器后，可以通过以下地址访问应用：

```
http://localhost:2001
```

## 日志查看

查看容器运行日志：

```bash
docker logs -f fcopy
```

## 更新镜像

更新到最新版本：

```bash
docker pull axiu/fcopy:latest
docker stop fcopy
docker rm fcopy
docker run -d --name fcopy -p 2001:3000 -v ./data:/app/uploads -e CLIPBOARD_API_KEY=your_secret_api_key axiu/fcopy:latest
```
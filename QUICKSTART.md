# ⚡ Quick Start - MCP Docker Hub

Get your badass MCP server running in 60 seconds!

## 🚀 One-Command Deploy

```bash
# Start everything
docker-compose up -d

# Wait 30 seconds, then open:
# http://localhost:3001  - MCP Server
# http://localhost:3000  - Grafana (admin/mcpadmin123)
# http://localhost:3002  - Analytics
```

That's it! 🎉

## 📱 What's Running

| Service | URL | Purpose |
|---------|-----|---------|
| MCP Server | http://localhost:3001 | Main server & dashboard |
| Grafana | http://localhost:3000 | Analytics dashboards |
| Analytics | http://localhost:3002 | Metrics & tracking |
| Prometheus | http://localhost:9090 | Metrics database |
| cAdvisor | http://localhost:8080 | Container monitoring |

## 🎯 Common Commands

```bash
# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Check health
curl http://localhost:3001/api/status
```

## 🔧 With Make

If you have `make` installed:

```bash
make up          # Start
make down        # Stop
make logs        # View logs
make health      # Health check
make grafana     # Open Grafana
```

## ⚙️ First Time Setup

1. **Install dependencies** (first time only):
   ```bash
   npm install
   cd analytics && npm install
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Open Grafana**:
   - Go to http://localhost:3000
   - Login: admin/mcpadmin123
   - View pre-configured dashboards

## 🐛 Troubleshooting

**Services not starting?**
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

**Port conflicts?**
Edit `docker-compose.yml` and change ports:
```yaml
ports:
  - "3002:3001"  # Change 3001 to 3002
```

**Need help?**
```bash
docker-compose logs
```

## 📚 Full Documentation

See [DOCKER-README.md](./DOCKER-README.md) for complete guide.

---

**You're ready to rock! 🤘**

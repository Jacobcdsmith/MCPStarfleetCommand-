# MCP Server Docker Hub - Makefile

.PHONY: help build up down restart logs clean dev prod status health

help:
	@echo "🚀 MCP Server Docker Hub - Available Commands"
	@echo "================================================"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs from all services"
	@echo "  make clean      - Remove all containers, volumes, and images"
	@echo "  make dev        - Start in development mode"
	@echo "  make prod       - Start in production mode"
	@echo "  make status     - Show service status"
	@echo "  make health     - Check health of all services"
	@echo "  make analytics  - Open analytics dashboard"
	@echo "  make grafana    - Open Grafana dashboard"
	@echo "  make prometheus - Open Prometheus dashboard"

build:
	@echo "🔨 Building Docker images..."
	docker-compose build

up:
	@echo "🚀 Starting MCP Hub services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "🌐 MCP Server: http://localhost:3001"
	@echo "📊 Grafana: http://localhost:3000 (admin/mcpadmin123)"
	@echo "📈 Analytics: http://localhost:3002"
	@echo "🔍 Prometheus: http://localhost:9090"

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

restart:
	@echo "🔄 Restarting services..."
	docker-compose restart

logs:
	@echo "📋 Viewing logs..."
	docker-compose logs -f

clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v --rmi all
	@echo "✅ Cleanup complete!"

dev:
	@echo "🔧 Starting in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

prod:
	@echo "🏭 Starting in production mode..."
	docker-compose up -d --build
	@make status

status:
	@echo "📊 Service Status:"
	docker-compose ps

health:
	@echo "🏥 Health Check:"
	@curl -s http://localhost:3001/api/status | jq || echo "MCP Server: ❌"
	@curl -s http://localhost:3002/api/health | jq || echo "Analytics: ❌"
	@curl -s http://localhost:9090/-/healthy || echo "Prometheus: ❌"
	@curl -s http://localhost:3000/api/health || echo "Grafana: ❌"

analytics:
	@echo "📈 Opening analytics dashboard..."
	@open http://localhost:3002 || xdg-open http://localhost:3002 || start http://localhost:3002

grafana:
	@echo "📊 Opening Grafana dashboard..."
	@open http://localhost:3000 || xdg-open http://localhost:3000 || start http://localhost:3000

prometheus:
	@echo "🔍 Opening Prometheus..."
	@open http://localhost:9090 || xdg-open http://localhost:9090 || start http://localhost:9090

# Scaling commands
scale-up:
	@echo "⬆️ Scaling up services..."
	docker-compose up -d --scale mcp-server=3

scale-down:
	@echo "⬇️ Scaling down services..."
	docker-compose up -d --scale mcp-server=1

# Backup commands
backup:
	@echo "💾 Creating backup..."
	@mkdir -p backups
	docker-compose exec redis redis-cli BGSAVE
	docker run --rm -v mcp_prometheus-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/prometheus-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	docker run --rm -v mcp_grafana-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/grafana-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "✅ Backup complete!"

# Install npm dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	cd analytics && npm install
	@echo "✅ Dependencies installed!"

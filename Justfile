# ==========================================
# 🌸 Daily Glow Diary — Justfile Automation
# ==========================================

# Default recipe: list available commands
default:
    @just --list

# 🚀 Khởi chạy toàn bộ hệ thống bằng Docker Compose (Build & Run ngầm)
up:
    docker compose up -d --build
    @echo "✨ Glow Diary is up at http://localhost:4000"

# 🛑 Dừng container
down:
    docker compose down

# 🔄 Khởi động lại container
restart:
    docker compose restart diary

# 📜 Xem logs thời gian thực của container
logs:
    docker compose logs -f diary

# ⚡ CẬP NHẬT NHANH NHẤT (Fastest Update Workflow):
# Kéo code mới nhất từ git -> Build lại image -> Cập nhật container tức thì mà KHÔNG mất dữ liệu
update:
    @echo "📥 Pulling latest changes from git..."
    git pull origin main
    @echo "🔨 Building updated container..."
    docker compose build
    @echo "🚀 Restarting container with zero data loss..."
    docker compose up -d
    @echo "🧹 Cleaning dangling build caches..."
    docker image prune -f
    @echo "✅ Updated successfully! Checking container status:"
    docker compose ps

# 🔍 Kiểm tra trạng thái và mức tiêu hao tài nguyên CPU/RAM
status:
    docker compose ps
    @echo ""
    docker stats --no-stream diary-app

# 💾 Kích hoạt tạo bản sao lưu ngay lập tức bên trong container
backup:
    docker compose exec diary sh -c "cd /app/packages/backend && node -e \"import('./dist/services/backup.service.js').then(m => m.runFullBackup()).then(console.log)\""

# 💻 Mở terminal tương tác bên trong container
shell:
    docker compose exec diary sh

# 📦 Đồng bộ schema database SQLite bên trong container
db-sync:
    docker compose exec diary sh -c "cd /app/packages/backend && npx prisma db push --skip-generate"

# 🧹 Dọn dẹp images và build cache của Docker
prune:
    docker system prune -f

# 💻 Chạy chế độ development cục bộ (không qua Docker)
dev:
    pnpm dev

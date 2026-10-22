#!/usr/bin/env bash
# Script tiện ích để chạy Cloudflare Tunnel cho dự án Daily Glow Diary
echo "🌸 Khởi chạy Cloudflare Tunnel cho http://localhost:5173..."
cloudflared tunnel --protocol http2 --url http://localhost:5173

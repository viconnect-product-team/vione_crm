#!/bin/sh
set -e

echo "🚀 Kích hoạt tiến trình Entrypoint kiểm soát vòng đời dịch vụ..."

echo "🟢 Môi trường sẵn sàng. Khởi động ứng dụng SSR (Nitro)..."
exec node .output/server/index.mjs

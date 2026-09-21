# --- Stage 1: Thiết lập môi trường và Biên dịch mã nguồn ---
FROM node:22-alpine AS development
WORKDIR /usr/src/app

# Cài đặt các thư viện phụ thuộc phục vụ build
RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# --- Stage 2: Môi trường chạy Production chính thức ---
FROM node:22-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PORT=4000
ENV HOSTNAME=0.0.0.0
WORKDIR /usr/src/app

RUN apk add --no-cache openssl
# Nguyên tắc an toàn: Khởi tạo Group và User thường để thực thi ứng dụng
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Đồng bộ các sản phẩm đã hoàn thiện biên dịch từ Stage 1 sang
COPY --from=development /usr/src/app/.output ./.output
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000', (r) => {if (r.statusCode >= 400) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

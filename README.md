# Shopify Clone - E-Commerce Platform

포트폴리오용 실서비스급 쇼핑몰 프로젝트

## Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | Next.js 15, TypeScript, Tailwind CSS   |
| Backend     | Spring Boot 3, Java 17, Spring Security|
| Database    | PostgreSQL 16, Redis 7, Elasticsearch 8|
| Messaging   | Apache Kafka                           |
| Infra       | Docker, GitHub Actions, Nginx          |
| Monitoring  | Prometheus, Grafana                    |

## Quick Start

### 1. 인프라 실행 (Docker)
```bash
docker compose up -d
```

### 2. 백엔드 실행
```bash
cd backend
./gradlew bootRun
```
- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

### 3. 프론트엔드 실행
```bash
cd frontend
npm run dev
```
- Web: http://localhost:3000

### 4. 관리 도구
- Kafka UI: http://localhost:8989
- Elasticsearch: http://localhost:9200

## Project Structure
```
shopify-clone/
├── backend/                 # Spring Boot
│   └── src/main/java/com/shopify/backend/
│       ├── domain/
│       │   ├── auth/        # 인증, 회원
│       │   ├── product/     # 상품, 카테고리
│       │   ├── order/       # 주문, 결제
│       │   └── admin/       # 관리자
│       ├── global/          # 공통 설정, 예외, Security
│       └── infra/           # Kafka, Redis, S3, ES 설정
├── frontend/                # Next.js
├── docker-compose.yml
├── docs/                    # 설계 문서, ERD
└── .github/workflows/       # CI/CD
```

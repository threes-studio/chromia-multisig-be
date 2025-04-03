infra:
	docker-compose -f docker-compose.infra.yml --env-file .env up -d

infra-down:
	docker-compose -f docker-compose.infra.yml down

build:
	docker build -t chromia-multisig-be:latest .
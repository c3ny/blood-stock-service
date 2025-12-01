# 🩸 Blood Stock Service

> Sistema de gestão de estoque sanguíneo desenvolvido com Spring Boot, PostgreSQL e Docker

![Java](https://img.shields.io/badge/Java-17-red?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 📋 Sobre

O **Blood Stock Service** é um serviço backend que integra o ecossistema **Sangue Solidário**, oferecendo controle completo sobre o estoque de sangue com rastreabilidade e auditoria de movimentações.

### Principais recursos

- **Gestão de estoque** por tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Controle de lotes** com registro de validade e quantidades
- **Histórico completo** de entradas e saídas com timestamp
- **Auditoria automática** de todas as movimentações
- **API RESTful** documentada com OpenAPI/Swagger
- **Pronto para produção** com Docker Compose

---

## 🚀 Quick Start

### Pré-requisitos

- Docker & Docker Compose
- Java 17+ (apenas para desenvolvimento local)
- Gradle 8.x (apenas para desenvolvimento local)

### Executando com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/FireC4io/blood-stock-service.git
cd blood-stock-service

# Inicie os containers
docker-compose up --build -d

# Verifique os logs
docker-compose logs -f
```

A aplicação estará disponível em:

| Serviço | URL |
|---------|-----|
| **API REST** | http://localhost:8081 |
| **Swagger UI** | http://localhost:8081/swagger-ui/index.html |
| **OpenAPI Docs** | http://localhost:8081/v3/api-docs |

### Executando localmente (Desenvolvimento)

```bash
# Compile o projeto
./gradlew clean build

# Execute a aplicação
./gradlew bootRun

# Ou execute o JAR gerado
java -jar build/libs/blood-stock-service.jar
```

---

## 🏗️ Arquitetura

```
src/main/java/com/example/
│
├── config/           # Configurações (Swagger, CORS, Beans)
├── controller/       # Endpoints REST
├── dto/              # Data Transfer Objects
│   ├── request/      # Payloads de entrada
│   └── response/     # Payloads de saída
├── entity/           # Entidades JPA
├── exception/        # Tratamento global de erros
├── filter/           # Filtros (MDC, Logging)
├── mapper/           # Conversores DTO ↔ Entity (MapStruct)
├── repository/       # Camada de persistência
├── security/         # Segurança e autenticação (em desenvolvimento)
└── service/          # Lógica de negócio
```

### Stack Tecnológica

| Categoria | Tecnologia |
|-----------|-----------|
| **Linguagem** | Java 17 |
| **Framework** | Spring Boot 3.5.5 |
| **Persistência** | Hibernate/JPA + PostgreSQL 15 |
| **Build** | Gradle 8.x |
| **Mapeamento** | MapStruct |
| **Documentação** | Springdoc OpenAPI 3 |
| **Containerização** | Docker + Docker Compose |

---

## 📡 Endpoints Principais

### Stock Management

```http
GET    /api/v1/stock              # Lista todos os estoques
GET    /api/v1/stock/{id}         # Busca por ID
POST   /api/v1/stock              # Cria novo registro
PUT    /api/v1/stock/{id}         # Atualiza estoque
DELETE /api/v1/stock/{id}         # Remove registro
```

### Movement History

```http
GET    /api/v1/movements          # Histórico de movimentações
GET    /api/v1/movements/{id}     # Detalhes de movimentação
POST   /api/v1/movements          # Registra entrada/saída
```

> 💡 **Dica**: Acesse o Swagger UI para testar todos os endpoints interativamente

---

## 🧪 Testes

```bash
# Execute todos os testes
./gradlew test

# Execute com relatório de cobertura
./gradlew test jacocoTestReport

# Execute testes específicos
./gradlew test --tests "com.example.service.*"
```

---

## 🗺️ Roadmap

| Feature | Status | Prioridade |
|---------|--------|-----------|
| Controle de estoque e lotes | ✅ Concluído | - |
| Histórico de movimentações | ✅ Concluído | - |
| Documentação OpenAPI | ✅ Concluído | - |
| Containerização Docker | ✅ Concluído | - |
| Integração com User Service | 🚧 Em desenvolvimento | Alta |
| Auditoria avançada com logs estruturados | 🔜 Planejado | Média |
---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-funcionalidade`)
3. Commit suas mudanças usando [Conventional Commits](https://www.conventionalcommits.org/)
4. Push para a branch (`git push origin feat/nova-funcionalidade`)
5. Abra um Pull Request

### Padrão de Commits

```
feat: adiciona nova funcionalidade
fix: corrige bug identificado
docs: atualiza documentação
refactor: refatora código sem alterar comportamento
test: adiciona ou modifica testes
chore: atualiza dependências ou configurações
style: ajusta formatação do código
perf: melhora performance
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Caio Cesar Martins de Lima**

- GitHub: [@FireC4io](https://github.com/FireC4io)
- Email: euacaio14@gmail.com
- LinkedIn: [Adicionar link se disponível]

---

## 🙏 Agradecimentos

- Comunidade Spring Boot
- Projeto Sangue Solidário
- Contribuidores e colaboradores

---

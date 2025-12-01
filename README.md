# 🩸 Blood Stock Service

Serviço backend responsável pela gestão de estoque sanguíneo, desenvolvido com **Spring Boot**, persistência em **PostgreSQL**, documentação com **OpenAPI** e deploy simplificado via **Docker Compose**.

---

### 🚀 Stack Tecnológica

![Java](https://img.shields.io/badge/Java-17-red?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Hibernate](https://img.shields.io/badge/Hibernate-ORM-59666C?logo=hibernate&logoColor=white)
![MapStruct](https://img.shields.io/badge/MapStruct-Mapper-blue)
![OpenAPI](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?logo=swagger&logoColor=black)
![Gradle](https://img.shields.io/badge/Gradle-8.x-02303A?logo=gradle&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-✔️-2496ED?logo=docker&logoColor=white)

---

## 📌 Sobre o Projeto

O **Blood Stock Service** faz parte do ecossistema **Sangue Solidário**, sendo responsável por:

- Gestão do estoque sanguíneo por tipo
- Registro histórico de entradas e saídas
- Auditoria simplificada de movimentações
- Integração futura com o **User Service** para autenticação/autorização

---

## ✨ Funcionalidades

| Funcionalidade              | Status | Descrição |
|----------------------------|--------|-----------|
| Controle de estoque        | ✅     | Registrar e atualizar lotes e quantidades |
| Histórico de movimentação  | ✅     | Registro automático de alterações |
| Swagger documentado        | ✅     | Testes interativos direto via UI |
| Integração User Service    | 🚧     | Autenticação e autorização via token |
| Relatórios                 | 🔜     | Resumos filtrados por empresa/período |
| Auditoria avançada         | 🔜     | Logs estruturados e trilha completa |

---

## 🧰 Tecnologias

| Categoria       | Ferramenta |
|----------------|------------|
| Linguagem      | Java 17 |
| Framework      | Spring Boot 3.5 |
| Banco de Dados | PostgreSQL 15 |
| ORM            | JPA / Hibernate |
| Build System   | Gradle |
| Containers     | Docker + Docker Compose |
| Docs API       | Springdoc OpenAPI + Swagger UI |

---

## 🐳 Como Executar com Docker (Recomendado)


docker-compose up --build -d
Após subir:

Serviço	URL
API	http://localhost:8081
Swagger	http://localhost:8081/swagger-ui/index.html

🔧 Execução Manual (Sem Docker)
sh
Copiar código
./gradlew clean build
java -jar build/libs/blood-stock-service.jar
📚 Documentação da API
Swagger UI:
http://localhost:8081/swagger-ui/index.html

OpenAPI JSON:
http://localhost:8081/v3/api-docs

📂 Estrutura do Projeto
bash
Copiar código
src/main/java/com/example
│
├── config/        # Swagger / OpenAPI / CORS
├── controller/    # REST endpoints
├── dto/           # Requests / Responses
├── entity/        # Modelos persistidos
├── exception/     # Handler global e exceptions
├── filter/        # MDC Logging
├── mapper/        # MapStruct DTO ↔ entity
├── repository/    # Spring Data JPA
├── security/      # Futuro: integração com User Service
└── service/       # Regras de negócio
🧪 Testes
sh
Copiar código
./gradlew test
🛣️ Roadmap
Objetivo	Status
Docker + Compose	✔ Finalizado
Refactor backend	✔ Finalizado
Integração User Service	🚧 Em progresso
Auditoria avançada	🔜 Planejado
Permissões e roles	🔜 Planejado
Deployment CI/CD	🔜 Planejado

🤝 Contribuição
Padrão de commits: Conventional Commits

makefile
Copiar código
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
refactor: melhoria interna
chore: manutenção / build
test: adição/alteração de testes
📄 Licença
Distribuído sob licença MIT — uso livre para modificação e distribuição.

👤 Autor
Caio Cesar Martins de Lima
📌 GitHub: @FireC4io
📧 E-mail: euacaio14@gmail.com

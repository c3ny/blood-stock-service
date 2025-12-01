🩸 Blood Stock Service

Serviço backend responsável pela gestão de estoque sanguíneo, desenvolvido com **Spring Boot**, persistência em **PostgreSQL**, documentação com **OpenAPI** e deploy simplificado via **Docker Compose**.

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

O **Blood Stock Service** integra o ecossistema **Sangue Solidário**, sendo o serviço responsável por:

- Controle de estoque por tipo sanguíneo
- Registro e histórico de entradas e saídas
- Auditoria básica de movimentações
- Integração futura com o **User Service** para autenticação/autorização

---

## ✨ Funcionalidades

| Funcionalidade              | Status | Descrição                                  |
|----------------------------|--------|--------------------------------------------|
| Controle de estoque        | ✅     | Registrar e atualizar lotes e quantidades  |
| Histórico de movimentação  | ✅     | Registro automático de alterações          |
| Swagger documentado        | ✅     | Testes interativos direto na UI            |
| Integração User Service    | 🚧     | Autenticação e autorização por token       |
| Relatórios                 | 🔜     | Consultas e resumos por empresa/período    |
| Auditoria avançada         | 🔜     | Logs estruturados e trilha completa        |

---

## 🛠 Tecnologias

| Componente   | Stack                         |
|-------------|-------------------------------|
| Linguagem   | Java 17                       |
| Framework   | Spring Boot 3.5               |
| Database    | PostgreSQL 15                 |
| ORM         | Hibernate / JPA               |
| Build       | Gradle                        |
| Containers  | Docker + Docker Compose       |
| Documentação| Springdoc OpenAPI / Swagger   |

---

## 🐳 Executando com Docker (Recomendado)


docker-compose up --build -d
Após subir, acesse:

Serviço	URL
API	http://localhost:8081
Swagger	http://localhost:8081/swagger-ui/index.html

🔧 Execução Manual (Opcional)
bash
Sempre exibir os detalhes

Copiar código
./gradlew clean build
java -jar build/libs/blood-stock-service.jar
📚 Documentação da API
Swagger UI

text
Sempre exibir os detalhes

Copiar código
http://localhost:8081/swagger-ui/index.html
OpenAPI JSON

text
Sempre exibir os detalhes

Copiar código
http://localhost:8081/v3/api-docs
📂 Estrutura do Projeto
text
Sempre exibir os detalhes

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
bash
Sempre exibir os detalhes

Copiar código
./gradlew test
🛣️ Roadmap
Feature	Status
Docker + Compose	✔ Finalizado
Refactor backend	✔ Finalizado
Integração User Service	🚧 Em progresso
Auditoria avançada	🔜 Planejado
Permissões e roles	🔜 Planejado
Deployment CI/CD	🔜 Planejado

🤝 Contribuindo
Padrão de commits (Conventional Commits):

text
Sempre exibir os detalhes

Copiar código
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
refactor: melhoria interna
chore: tarefa de manutenção/build
test: adição ou ajuste de testes
📄 Licença
Licença MIT — livre para uso, modificação e distribuição.

👤 Autor
Nome: Caio Cesar Martins de Lima

GitHub: @FireC4io

Email: euacaio14@gmail.com

🩸 Blood Stock Service

Sistema backend para gestão de estoque de sangue, desenvolvido em Spring Boot com persistência em PostgreSQL, integração com serviços externos e deployment via Docker.

![Java](https://img.shields.io/badge/Java-17-red?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Hibernate](https://img.shields.io/badge/Hibernate-ORM-59666C?logo=hibernate&logoColor=white)
![MapStruct](https://img.shields.io/badge/MapStruct-Mapper-blue)
![OpenAPI](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?logo=swagger&logoColor=black)
![Gradle](https://img.shields.io/badge/Gradle-8.x-02303A?logo=gradle&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-✔️-2496ED?logo=docker&logoColor=white)

📌 Sobre o Projeto

O Blood Stock Service é um serviço backend independente responsável por:

Controle de estoque por tipo sanguíneo

Registro e histórico de entradas e saídas

Auditoria de movimentações

Integração futura com serviço de usuários (autenticação/autorização)

Este módulo faz parte do ecossistema Sangue Solidário.

✨ Funcionalidades
Categoria	Status	Descrição
Controle de estoque	✅	Registrar lotes e atualizar quantidades
Histórico	✅	Registrar quem movimentou e quando
Relatórios	➖ futuro	Relatórios resumidos por período
Autenticação via User Service	🚧 em planejamento	Tokens e roles
Auditoria	🚧 planejado	Logs estruturados e trilha completa
🛠 Tecnologias
Componente	Stack
Linguagem	Java 17
Framework	Spring Boot 3.5
Database	PostgreSQL 15
ORM	Hibernate/JPA
Build	Gradle
Containers	Docker + Docker Compose
Documentação	Springdoc OpenAPI / Swagger
🐳 Executando com Docker

Forma recomendada.

docker-compose up --build -d


Após subir, acesse:

Serviço	URL
API	http://localhost:8081

Swagger	http://localhost:8081/swagger-ui/index.html


🔧 Configuração Manual (Opcional)
./gradlew clean build
java -jar build/libs/blood-stock-service.jar

📚 Documentação da API

Swagger UI disponível em:

http://localhost:8081/swagger-ui/index.html


OpenAPI JSON:

http://localhost:8081/v3/api-docs

📂 Estrutura Atualizada
src/main/java/com/example
│
├── config/               # Swagger / OpenAPI / CORS
├── controller/           # Endpoints REST
├── dto/                 # Payloads de entrada e saída
├── entity/              # Modelos persistidos
├── exception/           # Handler global
├── filter/              # MDC Logging
├── mapper/              # Conversores DTO ↔ entidade
├── repository/          # Spring Data
├── security/            # Para futura integração auth
└── service/             # Regras de negócio

🧪 Testes

Executar:

./gradlew test

📌 Roadmap
Feature	Status
Docker + Compose	✔ finalizado
Refactor backend	✔ finalizado
Integração User Service	🚧 em progresso
Auditoria avançada	🔜
Permissões e roles	🔜
Deployment CI/CD	🔜
🤝 Contribuindo

Commits seguem o padrão:

feat: nova funcionalidade
fix: correção
docs: atualização do readme
refactor: melhoria interna

📄 Licença

Licença MIT — livre para uso e modificação.

👤 Autor

Caio Cesar — @FireC4io
📧 euacaio14@gmail.com

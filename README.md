# 🩸 Blood Stock Service

Sistema completo de gerenciamento de estoque de sangue desenvolvido com **Spring Boot** (backend) e **JavaFX** (frontend), seguindo as melhores práticas de desenvolvimento com arquitetura MVC, documentação automática de API e sistema de logs estruturado.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Executar](#como-executar)
- [Documentação da API](#documentação-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Testes](#testes)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

O **Blood Stock Service** é uma aplicação completa para gerenciamento de estoque de sangue em bancos de sangue e instituições de saúde. O sistema permite controlar entradas e saídas de bolsas de sangue por tipo sanguíneo, manter histórico de movimentações e gerar relatórios detalhados.

### Principais Diferenciais

- **Arquitetura Moderna**: Backend REST API com Spring Boot e Frontend JavaFX seguindo padrão MVC
- **Documentação Automática**: Swagger UI integrado para fácil exploração da API
- **Rastreamento de Requisições**: Sistema de logs com MDC (Mapped Diagnostic Context)
- **Validação Robusta**: DTOs tipados com validação automática
- **Interface Responsiva**: Frontend JavaFX com CSS customizado
- **Requisições Assíncronas**: CompletableFuture para melhor performance

---

## ✨ Funcionalidades

### Backend (API REST)

- ✅ **Gerenciamento de Empresas/Instituições**
  - Cadastro, listagem, atualização e exclusão de empresas
  - Informações: CNPJ, nome, endereço, telefone, email

- ✅ **Controle de Estoque de Sangue**
  - Registro de estoque por tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - Movimentações de entrada e saída
  - Consulta de estoque atual por empresa
  - Validação de estoque insuficiente

- ✅ **Histórico de Movimentações**
  - Registro completo de todas as movimentações
  - Rastreamento de usuário responsável
  - Quantidade antes/depois de cada movimentação
  - Data e hora de cada operação

- ✅ **Geração de Relatórios**
  - Relatório de estoque atual
  - Relatório de histórico de movimentações
  - Exportação em formato JSON

### Frontend (JavaFX)

- ✅ **Interface Gráfica Intuitiva**
  - Seleção de empresa
  - Seleção de tipo sanguíneo
  - Botões de Entrada/Saída
  - Visualização de estoque em tabela

- ✅ **Relatórios Visuais**
  - Pré-visualização de estoque
  - Pré-visualização de histórico
  - Geração de PDF
  - Impressão direta

- ✅ **Dashboard**
  - Visualização gráfica do estoque
  - Indicadores visuais de níveis críticos
  - Atualização em tempo real

---

## 🛠️ Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Java** | 17 | Linguagem de programação |
| **Spring Boot** | 3.5.5 | Framework principal |
| **Spring Data JPA** | 3.5.5 | Persistência de dados |
| **PostgreSQL** | 15.14 | Banco de dados |
| **Hibernate** | 6.6.26 | ORM |
| **Springdoc OpenAPI** | 2.7.0 | Documentação automática (Swagger) |
| **MapStruct** | 1.5.5 | Mapeamento de objetos |
| **Jackson** | 2.17.2 | Serialização JSON |
| **Hibernate Validator** | - | Validação de beans |
| **Log4j2** | - | Sistema de logs |

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **JavaFX** | 17.0.12 | Framework de interface gráfica |
| **Java HttpClient** | 17 | Cliente HTTP moderno |
| **iText PDF** | 7.2.5 | Geração de PDFs |
| **CSS** | 3 | Estilização da interface |

### Ferramentas

- **Gradle** 8.x - Build automation
- **Git** - Controle de versão
- **IntelliJ IDEA / VS Code** - IDEs recomendadas

---

## 🏗️ Arquitetura

### Backend - Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│                  CONTROLLER LAYER                    │
│  - BloodstockController                              │
│  - CompanyController                                 │
│  - GlobalExceptionHandler                            │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   SERVICE LAYER                      │
│  - BloodstockService                                 │
│  - CompanyService                                    │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                 REPOSITORY LAYER                     │
│  - StockRepository                                   │
│  - BloodstockMovementRepository                      │
│  - CompanyRepository                                 │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                  DATABASE (PostgreSQL)               │
└─────────────────────────────────────────────────────┘
```

### Frontend - Padrão MVC

```
┌─────────────────────────────────────────────────────┐
│                      VIEW LAYER                      │
│  BloodstockFormRefactored.java                       │
│  - Interface gráfica (JavaFX)                        │
│  - Eventos de usuário                                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   CONTROLLER LAYER                   │
│  BloodstockViewController.java                       │
│  - Lógica de negócio                                 │
│  - Validações                                        │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                    SERVICE LAYER                     │
│  BloodstockApiService.java                           │
│  - Requisições HTTP assíncronas                      │
│  - Parsing JSON                                      │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   BACKEND REST API                   │
│  Spring Boot (porta 8081)                            │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Pré-requisitos

Antes de começar, você precisará ter instalado:

- **Java JDK 17** ou superior
  ```bash
  java -version
  ```

- **PostgreSQL 15** ou superior
  ```bash
  psql --version
  ```

- **Gradle 8.x** (ou use o wrapper `./gradlew`)
  ```bash
  gradle --version
  ```

- **Git**
  ```bash
  git --version
  ```

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/blood-stock-service.git
cd blood-stock-service
```

### 2. Configure o Banco de Dados

#### Criar o banco de dados:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE "SangueSolidario";
CREATE USER sa WITH PASSWORD '1';
GRANT ALL PRIVILEGES ON DATABASE "SangueSolidario" TO sa;
\q
```

#### Executar script de inicialização (opcional):

```bash
sudo -u postgres psql -d SangueSolidario -f docker/init.sql
```

### 3. Configure as variáveis de ambiente (opcional)

Edite `src/main/resources/application.properties`:

```properties
# Banco de Dados
spring.datasource.url=jdbc:postgresql://localhost:5432/SangueSolidario
spring.datasource.username=sa
spring.datasource.password=1

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Porta do servidor
server.port=8081
```

### 4. Compile o projeto

```bash
./gradlew clean build
```

---

## ▶️ Como Executar

### Opção 1: Executar Backend e Frontend Separadamente

#### **Backend (API REST):**

```bash
./gradlew runBackend
```

O backend estará disponível em: `http://localhost:8081`

#### **Frontend (JavaFX):**

```bash
./gradlew runFrontend
```

A interface gráfica será aberta automaticamente.

---

### Opção 2: Executar com Gradle Tasks

```bash
# Listar todas as tasks disponíveis
./gradlew tasks

# Executar backend
./gradlew runBackend

# Executar frontend
./gradlew runFrontend
```

---

## 📚 Documentação da API

### Swagger UI (Interativo)

Acesse a documentação interativa da API:

```
http://localhost:8081/swagger-ui/index.html
```

### OpenAPI JSON

Especificação OpenAPI em formato JSON:

```
http://localhost:8081/v3/api-docs
```

### Recursos da Documentação

- ✅ Todos os endpoints documentados
- ✅ Schemas de requisição e resposta
- ✅ Exemplos de uso
- ✅ Teste direto no navegador ("Try it out")
- ✅ Códigos de resposta HTTP

---

## 📂 Estrutura do Projeto

```
blood-stock-service/
├── src/
│   ├── main/
│   │   ├── java/com/example/
│   │   │   ├── config/
│   │   │   │   └── OpenApiConfig.java              # Configuração Swagger
│   │   │   ├── controler/                          # Controllers REST
│   │   │   │   ├── BloodstockController.java
│   │   │   │   └── CompanyController.java
│   │   │   ├── entity/                             # Entidades JPA
│   │   │   │   └── Company.java
│   │   │   ├── exception/                          # Tratamento de exceções
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── InsufficientStockException.java
│   │   │   ├── filter/                             # Filtros HTTP
│   │   │   │   └── MdcFilter.java                  # MDC para logs
│   │   │   ├── mapper/                             # MapStruct mappers
│   │   │   │   └── CompanyMapper.java
│   │   │   ├── model/                              # DTOs e Models
│   │   │   │   ├── Bloodstock.java
│   │   │   │   ├── BloodstockMovement.java
│   │   │   │   ├── BloodstockMovementRequestDTO.java
│   │   │   │   └── CompanyDTO.java
│   │   │   ├── respository/                        # Repositories JPA
│   │   │   │   ├── StockRepository.java
│   │   │   │   ├── BloodstockMovementRepository.java
│   │   │   │   └── CompanyRepository.java
│   │   │   ├── service/                            # Serviços de negócio
│   │   │   │   ├── BloodstockService.java
│   │   │   │   └── CompanyService.java
│   │   │   ├── view/                               # Frontend JavaFX
│   │   │   │   ├── controller/
│   │   │   │   │   └── BloodstockViewController.java
│   │   │   │   ├── service/
│   │   │   │   │   └── BloodstockApiService.java
│   │   │   │   ├── BloodstockFormRefactored.java   # View MVC
│   │   │   │   └── BloodstockForm.java             # View original (backup)
│   │   │   └── BloodStockServiceApplication.java   # Classe principal
│   │   └── resources/
│   │       ├── application.properties              # Configurações
│   │       ├── log4j2.xml                          # Configuração de logs
│   │       └── style.css                           # Estilos JavaFX
│   └── test/                                       # Testes unitários
├── docker/
│   ├── docker-compose.yml                          # Docker Compose
│   └── init.sql                                    # Script de inicialização
├── build.gradle                                    # Configuração Gradle
├── gradlew                                         # Gradle Wrapper (Unix)
├── gradlew.bat                                     # Gradle Wrapper (Windows)
└── README.md                                       # Este arquivo
```

---

## 🌐 Endpoints da API

### Estoque de Sangue

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/stock` | Lista todo o estoque |
| `POST` | `/api/stock` | Cria novo item de estoque |
| `PUT` | `/api/stock/{id}` | Atualiza quantidade |
| `GET` | `/api/stock/company/{companyId}` | Estoque por empresa |
| `POST` | `/api/stock/company/{companyId}/movement` | Registra movimentação |
| `GET` | `/api/stock/{bloodstockId}/history` | Histórico de um item |
| `GET` | `/api/stock/history/report/{companyId}` | Relatório de histórico |

### Empresas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/company` | Lista todas as empresas |
| `POST` | `/api/company` | Cria nova empresa |
| `GET` | `/api/company/{id}` | Busca empresa por ID |
| `PUT` | `/api/company/{id}` | Atualiza empresa |
| `DELETE` | `/api/company/{id}` | Deleta empresa |

---

## 🧪 Testes

### Executar todos os testes

```bash
./gradlew test
```

### Executar testes com relatório

```bash
./gradlew test --info
```

### Ver relatório de testes

Após executar os testes, abra:

```
build/reports/tests/test/index.html
```

---

## 🎨 Frontend - Funcionalidades

### Tela Principal

- **Seleção de Empresa**: ComboBox com todas as empresas cadastradas
- **Seleção de Tipo Sanguíneo**: ComboBox com tipos (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Botões de Movimentação**: Entrada (verde) e Saída (vermelho)
- **Campo de Quantidade**: Input numérico
- **Tabela de Estoque**: Visualização em tempo real do estoque atual
- **Botões de Relatório**: Gerar relatório de estoque e histórico

### Recursos Visuais

- ✅ CSS customizado para melhor aparência
- ✅ Feedback visual de sucesso/erro
- ✅ ScrollPane para conteúdo extenso
- ✅ Tabelas responsivas
- ✅ Botões coloridos por função

---

## 🔒 Segurança

### Implementações de Segurança

- ✅ **Validação de Entrada**: DTOs com anotações `@NotNull`, `@Min`, etc.
- ✅ **Tratamento de Exceções**: GlobalExceptionHandler para erros consistentes
- ✅ **Logs Estruturados**: MDC Filter para rastreamento de requisições
- ✅ **Validação de Estoque**: Impede saídas com estoque insuficiente

### Recomendações para Produção

- [ ] Implementar autenticação (Spring Security + JWT)
- [ ] Adicionar HTTPS/TLS
- [ ] Configurar CORS adequadamente
- [ ] Implementar rate limiting
- [ ] Adicionar auditoria de ações

---

## 📊 Monitoramento e Logs

### Sistema de Logs

O projeto usa **MDC (Mapped Diagnostic Context)** para adicionar um `requestId` único a cada requisição HTTP.

**Exemplo de log:**

```
2025-10-15 17:00:01 INFO  - [req-abc123] - Buscando estoque da empresa
2025-10-15 17:00:01 INFO  - [req-abc123] - Estoque encontrado: 5 itens
```

### Configuração de Logs

Arquivo: `src/main/resources/log4j2.xml`

- **Console**: Logs no terminal
- **File**: Logs em arquivo (`logs/bloodstock-service.log`)
- **JSON**: Formato estruturado para processamento

---

## 🚧 Melhorias Futuras

### Backend

- [ ] Implementar autenticação e autorização
- [ ] Adicionar paginação nos endpoints
- [ ] Implementar cache (Redis)
- [ ] Adicionar métricas (Prometheus)
- [ ] Implementar notificações (email/SMS)
- [ ] Adicionar testes de integração
- [ ] Implementar CI/CD

### Frontend

- [ ] Adicionar gráficos (JavaFX Charts)
- [ ] Implementar tema escuro/claro
- [ ] Adicionar ícones aos botões
- [ ] Implementar busca e filtros
- [ ] Adicionar animações de transição
- [ ] Exportar relatórios em Excel
- [ ] Implementar dashboard analítico

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Padrões de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação de código
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de build/config

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- Caio Cesar Martins de Lima - *Desenvolvimento inicial* - [@firec4io](https://github.com/firec4io)

---

## 🙏 Agradecimentos

- Spring Boot Team
- JavaFX Community
- PostgreSQL Team
- Springdoc OpenAPI
- Todos os contribuidores

---

## 📞 Suporte

Se você tiver alguma dúvida ou problema:

- 📧 Email: euacaio14@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/blood-stock-service/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/seu-usuario/blood-stock-service/discussions)

---


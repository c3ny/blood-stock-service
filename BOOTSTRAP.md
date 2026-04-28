# Bootstrap — Sangue Solidário em outra máquina

> **Tempo estimado:** 20 min (15 min de build na primeira vez).
> **Para quem:** dev novo na equipe, ou você mesmo num notebook que ainda não tem o sistema rodando (apresentação acadêmica, demo, deploy local de teste).

Esse repo é o **backend principal** do PI e contém o `docker-compose.yml` que orquestra TODOS os 6 microsserviços + frontend + 4 bancos.

---

## Pré-requisitos

- **Docker Desktop 24+** rodando (Windows: WSL2 backend)
- **Git** e shell bash (Git Bash no Windows)
- **8 GB RAM livre, 10 GB de disco**
- **Portas livres no host:** `3000-3006`, `5432-5435`, `27017`

Verifique com:

```bash
docker version
docker info | grep "Server Version"
```

---

## 1. Clonar todos os 7 repos como **siblings** (irmãos)

⚠️ A estrutura de pastas é OBRIGATÓRIA — o `docker-compose.yml` referencia os outros repos com path relativo `../<repo>`.

```bash
mkdir -p sangue-solidario && cd sangue-solidario

git clone https://github.com/c3ny/blood-stock-service
git clone https://github.com/c3ny/sangue-solidario-nextjs
git clone https://github.com/c3ny/users-service
git clone https://github.com/c3ny/donation-service
git clone https://github.com/c3ny/cdn-service-node
git clone https://github.com/c3ny/campaign-service
git clone https://github.com/c3ny/appointments-service-node
```

Estrutura final:

```
sangue-solidario/
├── blood-stock-service/        ← compose mora aqui (este repo)
├── sangue-solidario-nextjs/
├── users-service/
├── donation-service/
├── cdn-service-node/
├── campaign-service/
└── appointments-service-node/
```

---

## 2. Restaurar `.env` em cada repo

O sistema precisa de **8 arquivos `.env`** (raiz + 7 subprojetos), que **NÃO ficam no git** porque contêm secrets reais (Cloudinary, Mapbox, Google OAuth, JWT, Cookie, Postgres password, etc).

A pessoa responsável (owner) gera um pacote `env-pack.tar.gz` (~2 KB) na máquina principal e transfere por **canal seguro** (pen drive, e-mail privado, mensageria pessoal — **NUNCA cloud público sem expiração**).

Receba o `env-pack.tar.gz`, coloque na raiz do `sangue-solidario/` e extraia:

```bash
# Estando na raiz sangue-solidario/
tar xzf env-pack.tar.gz
rm env-pack.tar.gz

# Confirmar que os 8 .env foram criados
ls .env */(.env) 2>/dev/null || true
for f in .env */.env; do [ -f "$f" ] && echo "✓ $f ($(wc -l < $f) linhas)"; done
```

**Sem o env-pack:** copie os respectivos `.env.example` de cada repo para `.env` e preencha manualmente. Você vai precisar de credenciais Cloudinary, Mapbox token, Google OAuth Client ID, e gerar 3 secrets aleatórios (JWT, Cookie, Internal):

```bash
openssl rand -base64 48   # rode 3 vezes, um pra cada secret
```

---

## 3. Pre-flight check

```bash
cd blood-stock-service
./scripts/preflight.sh
```

Sai com **exit 0** se tudo OK. Se algo vermelho, siga as instruções no output (porta ocupada, `.env` faltando, repo sibling ausente, etc.) antes de continuar.

---

## 4. Subir tudo

```bash
docker compose up -d --build
# ou: ./up.sh

# Acompanhar progresso (Ctrl+C sai sem derrubar)
docker compose logs -f
```

**1ª vez demora 10-15 min** — o Docker está buildando 7 imagens. As imagens ficam em cache; próximas subidas levam < 1 min.

---

## 5. Validar

| URL | Esperado |
|---|---|
| <http://localhost:3000> | Home Sangue Solidário carrega (mapa + listas) |
| <http://localhost:3002/api-docs> | Swagger users-service |
| <http://localhost:3003/api-docs> | Swagger appointments-service |
| <http://localhost:3004/docs> | Scalar blood-stock-service |
| <http://localhost:3006/api/docs> | Swagger campaign-service |

`docker compose ps` deve mostrar 11 containers `Up`.

**Smoke test funcional rápido:**

1. Cadastrar como DONOR → login → home mostra solicitações
2. Cadastrar como COMPANY → painel `/hemocentros/painel` carrega
3. Criar campanha (testa JWT do campaign-service)
4. Agendar doação numa campanha (testa appointments-service)

---

## Troubleshooting

### `https://localhost:3000` — `ERR_SSL_PROTOCOL_ERROR`

HSTS cache do browser. Em Chrome/Edge:

1. Abra `chrome://net-internals/#hsts`
2. **Delete domain security policies** → digite `localhost` → Delete
3. Feche TODAS as abas localhost e abra em aba anônima/incógnito

Alternativa: use `http://127.0.0.1:3000` (HSTS é por host, IP escapa).

### Mapbox: `An API access token is required`

O token não foi embutido no build do nextjs. Confirme:

```bash
grep MAPBOX .env
# Deve mostrar pk.eyJ... (não pk.xxx placeholder)
```

Se OK, force rebuild SÓ do nextjs:

```bash
docker compose build --no-cache nextjs-frontend
docker compose up -d nextjs-frontend
```

### `database "campaigns_db" does not exist` (com S)

`dist/` antigo no source ou imagem em cache:

```bash
cd ../campaign-service && rm -rf dist/
cd ../blood-stock-service
docker rmi -f $(docker images -q "*campaign-service*") 2>/dev/null
docker builder prune -af
docker compose build --no-cache campaign-service
docker compose up -d --force-recreate campaign-service
```

### `connect ECONNREFUSED` no startup

Race condition normal. O `depends_on` do compose só espera o container existir, não o Postgres aceitar conexão. NestJS retenta automaticamente até 9x. **Aguarde 30s** e veja se sobe.

### Porta ocupada

```bash
# Linux/Mac/WSL/Git-Bash
ss -tlnp | grep ":3000"
# ou: lsof -i :3000
```

Mate o processo dono ou troque a porta no compose.

### Container em loop de restart

```bash
docker compose logs --tail=50 <serviço>
```

Causas comuns:
- `.env` mal-parseado (aspas extras, espaços ao redor de `=`)
- Var crítica faltando
- Postgres ainda inicializando (esperar mais 30s)

### Reset completo (last resort — apaga TUDO)

```bash
docker compose down -v          # ⚠️ apaga volumes (banco zera)
docker system prune -af --volumes  # ⚠️ apaga TODAS as imagens não-em-uso
docker compose up -d --build
```

---

## Modo standalone (rodar SÓ blood-stock para dev focado)

Se quiser desenvolver apenas neste serviço sem subir todo o sistema:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

Esse compose sobe apenas `bloodstock-service` + `postgres_bloodstock`, em uma rede isolada.

---

## Arquitetura de redes Docker

O compose unificado cria 5 redes bridge isoladas. Containers só se enxergam dentro da mesma rede:

| Rede | Containers |
|---|---|
| `blood-users-network` | users-service + bloodstock-service + 2 Postgres + **campaign-service** (validar JWT) |
| `donation-network` | donation-service + Mongo |
| `cdn-network` | cdn-service |
| `campaign-network` | campaign-service + Postgres campaign |
| `appointments-network` | appointments-service-node + Postgres appointments + campaign-service |

O `nextjs-frontend` está em **todas** as redes (precisa falar com todos os backends).

Dentro de cada rede, containers usam **nome do serviço** como hostname (ex: `http://bloodstock-service:3004`, `http://users-service:3002`).

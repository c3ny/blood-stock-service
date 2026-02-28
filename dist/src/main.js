"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ioredis_1 = __importDefault(require("ioredis"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
function createRateLimiter(maxRequests, windowSeconds) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        const redisClient = new ioredis_1.default(redisUrl, {
            enableOfflineQueue: false,
            maxRetriesPerRequest: 2,
            lazyConnect: false,
        });
        const limiter = new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: 'blood-stock-rate-limit',
            points: maxRequests,
            duration: windowSeconds,
            insuranceLimiter: new rate_limiter_flexible_1.RateLimiterMemory({
                points: maxRequests,
                duration: windowSeconds,
            }),
        });
        return { limiter, backend: 'redis', redisClient };
    }
    return {
        limiter: new rate_limiter_flexible_1.RateLimiterMemory({
            points: maxRequests,
            duration: windowSeconds,
        }),
        backend: 'memory',
    };
}
function resolveClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const rateLimitWindowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60);
    const rateLimitWindowMs = rateLimitWindowSeconds * 1000;
    const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
    const { limiter, backend, redisClient } = createRateLimiter(rateLimitMaxRequests, rateLimitWindowSeconds);
    if (backend === 'memory') {
        console.warn('[rate-limit] Using in-memory limiter (single-instance mode).');
    }
    else {
        console.log('[rate-limit] Using Redis-backed limiter (distributed mode).');
    }
    if (redisClient) {
        redisClient.on('error', (error) => {
            console.error('[rate-limit] Redis error:', error.message);
        });
    }
    app.use(async (req, res, next) => {
        const traceId = req.headers['x-trace-id'] || (0, node_crypto_1.randomUUID)();
        req.traceId = traceId;
        res.setHeader('x-trace-id', traceId);
        if (req.path.startsWith('/api-docs')) {
            return next();
        }
        const key = resolveClientIp(req);
        try {
            const result = await limiter.consume(key);
            res.setHeader('x-ratelimit-limit', String(rateLimitMaxRequests));
            res.setHeader('x-ratelimit-remaining', String(result.remainingPoints));
            res.setHeader('x-ratelimit-reset', String(Math.ceil((Date.now() + result.msBeforeNext) / 1000)));
            return next();
        }
        catch (error) {
            const rateLimitError = error;
            const retryAfterMs = rateLimitError?.msBeforeNext ?? rateLimitWindowMs;
            res.setHeader('retry-after', String(Math.ceil(retryAfterMs / 1000)));
            return res.status(429).json({
                statusCode: 429,
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Try again later.',
                details: {
                    windowMs: rateLimitWindowMs,
                    maxRequests: rateLimitMaxRequests,
                    retryAfterMs,
                },
                traceId,
            });
        }
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Blood Stock Service API')
        .setDescription('## 🩸 Blood Stock Service\n\n' +
        'API RESTful para gerenciamento de estoque de sangue desenvolvida com **Clean Architecture** (Arquitetura Hexagonal).\n\n' +
        '### Funcionalidades\n' +
        '- ✅ Consulta de estoque por empresa e tipo sanguíneo\n' +
        '- ✅ Ajuste de estoque (entrada/saída de bolsas)\n' +
        '- ✅ Histórico de movimentações com auditoria\n' +
        '- ✅ Validação de quantidade suficiente antes de saídas\n' +
        '- ✅ Suporte para 8 tipos sanguíneos (A+, A-, B+, B-, AB+, AB-, O+, O-)\n\n' +
        '### Arquitetura\n' +
        'O sistema segue os princípios de Clean Architecture com camadas bem definidas:\n' +
        '- **Domain**: Entidades e regras de negócio\n' +
        '- **Application**: Casos de uso\n' +
        '- **Adapters**: Controllers (web), Repositories (persistência)\n\n' +
        '### Tecnologias\n' +
        '- NestJS + TypeScript\n' +
        '- Prisma ORM + PostgreSQL\n' +
        '- Docker + Docker Compose\n' +
        '- Class Validator para validação de DTOs\n')
        .setVersion('1.1.0')
        .setContact('Blood Stock Team', 'https://github.com/bloodstock/blood-stock-service', 'support@bloodstock.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .setExternalDoc('Documentação Completa', 'https://github.com/bloodstock/blood-stock-service/wiki')
        .addTag('Estoque de Sangue', 'Endpoints para gerenciamento de estoque de sangue')
        .addTag('Sistema', 'Endpoints de monitoramento e saúde da aplicação')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT para autenticação (será implementado em versões futuras)',
        in: 'header',
    }, 'JWT-auth')
        .addServer('http://localhost:3000', 'Desenvolvimento Local')
        .addServer('http://localhost:3000', 'Docker Local')
        .addServer('https://staging.bloodstock.com', 'Ambiente de Staging')
        .addServer('https://api.bloodstock.com', 'Ambiente de Produção')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    console.log('[Swagger] Paths originais:', Object.keys(document.paths));
    const newPaths = {};
    Object.keys(document.paths).forEach(path => {
        if (path.startsWith('/api/v1')) {
            const newPath = path.substring(7);
            newPaths[newPath] = document.paths[path];
            console.log(`[Swagger] Remapping: ${path} -> ${newPath}`);
        }
        else {
            newPaths[path] = document.paths[path];
        }
    });
    document.paths = newPaths;
    console.log('[Swagger] Paths modificados:', Object.keys(document.paths));
    swagger_1.SwaggerModule.setup('api-docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'Blood Stock API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
    });
    await app.listen(3000, () => {
        console.log('Application is running on: http://localhost:3000/api/v1');
        console.log('Swagger documentation available at: http://localhost:3000/api-docs');
    });
}
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
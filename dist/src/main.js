"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const rateLimitMap = new Map();
    const rateLimitWindowMs = 60_000;
    const rateLimitMaxRequests = 120;
    app.use((req, res, next) => {
        const traceId = req.headers['x-trace-id'] || (0, node_crypto_1.randomUUID)();
        req.traceId = traceId;
        res.setHeader('x-trace-id', traceId);
        if (req.path.startsWith('/api-docs')) {
            return next();
        }
        const key = req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const current = rateLimitMap.get(key);
        if (!current || now > current.resetAt) {
            rateLimitMap.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
            return next();
        }
        current.count += 1;
        rateLimitMap.set(key, current);
        if (current.count > rateLimitMaxRequests) {
            return res.status(429).json({
                statusCode: 429,
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Try again later.',
                details: {
                    windowMs: rateLimitWindowMs,
                    maxRequests: rateLimitMaxRequests,
                    retryAfterMs: Math.max(current.resetAt - now, 0),
                },
                traceId,
            });
        }
        return next();
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
        .addServer('http://localhost:3000/api/v1', 'Desenvolvimento Local')
        .addServer('http://localhost:3000/api/v1', 'Docker Local')
        .addServer('https://staging.bloodstock.com/api/v1', 'Ambiente de Staging')
        .addServer('https://api.bloodstock.com/api/v1', 'Ambiente de Produção')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
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
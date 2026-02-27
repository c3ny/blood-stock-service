export declare class HealthResponseDTO {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        database: 'up' | 'down';
        api: 'up' | 'down';
    };
    error?: string;
}

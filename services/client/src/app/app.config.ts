import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ClientConfig, createApiClient } from '@webpieces/http-client';
import { EnvironmentConfig } from '../services/EnvironmentConfig';
import { ExampleApi } from '@myorg/apis';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        {
            provide: ClientConfig,
            useFactory: (envConfig: EnvironmentConfig) => {
                return new ClientConfig(envConfig.apiBaseUrl());
            },
            deps: [EnvironmentConfig],
        },
        {
            provide: ExampleApi,
            useFactory: (config: ClientConfig) => {
                return createApiClient(ExampleApi, config);
            },
            deps: [ClientConfig],
        },
    ],
};

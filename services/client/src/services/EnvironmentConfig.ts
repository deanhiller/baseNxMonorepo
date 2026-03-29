import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class EnvironmentConfig {
    isCloud(): boolean {
        return !window.location.hostname.includes('localhost');
    }

    webBaseUrl(): string {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;

        if (port) {
            return `${protocol}//${hostname}:${port}`;
        }
        return `${protocol}//${hostname}`;
    }

    apiBaseUrl(): string {
        if (this.isCloud()) {
            return this.webBaseUrl();
        }

        const clientPort = parseInt(window.location.port) || 4200;
        const serverPort = clientPort + 4000;
        return `http://localhost:${serverPort}`;
    }
}

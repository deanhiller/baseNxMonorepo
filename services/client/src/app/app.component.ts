import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ExampleApi, GreetRequest } from '@myorg/apis';
import { EnvironmentConfig } from '../services/EnvironmentConfig';
import { toError } from '@webpieces/core-util';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet],
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    private exampleApi = inject(ExampleApi);
    public envConfig = inject(EnvironmentConfig);

    title = 'MyOrg App';
    apiBaseUrl = '';
    // webpieces-disable no-any-unknown -- template display of dynamic API response
    greetResponse: any = null;
    loading = false;
    error: string | null = null;

    ngOnInit(): void {
        this.apiBaseUrl = this.envConfig.apiBaseUrl();
    }

    async callGreetApi(): Promise<void> {
        this.loading = true;
        this.error = null;
        this.greetResponse = null;
        // eslint-disable-next-line @webpieces/no-unmanaged-exceptions
        try {
            const request: GreetRequest = { name: 'World' };
            this.greetResponse = await this.exampleApi.greet(request);
        } catch (err: any) {
            const error = toError(err);
            this.error = error.message || 'Failed to call ExampleApi';
        } finally {
            this.loading = false;
        }
    }
}

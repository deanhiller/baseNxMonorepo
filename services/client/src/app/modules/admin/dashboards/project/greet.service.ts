import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ExampleApi, GreetResponse } from '@myorg/apis';

@Injectable()
export class GreetService {
    private exampleApi = inject(ExampleApi);

    private greetResponse: BehaviorSubject<GreetResponse | null> =
        new BehaviorSubject<GreetResponse | null>(null);

    get greetResponse$(): Observable<GreetResponse | null> {
        return this.greetResponse.asObservable();
    }

    async fetchGreeting(name: string): Promise<GreetResponse> {
        const response = await this.exampleApi.greet({ name: name });
        this.greetResponse.next(response);
        return response;
    }
}

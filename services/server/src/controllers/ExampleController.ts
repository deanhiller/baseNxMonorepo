import { Controller, provideSingleton } from '@webpieces/http-routing';
import { GreetRequest, GreetResponse } from '@myorg/apis';
import { greet } from '@myorg/root-api-util';

@provideSingleton()
@Controller()
export class ExampleController {
    async greet(request: GreetRequest): Promise<GreetResponse> {
        return {
            greeting: greet(request.name ?? 'World'),
            serverTime: new Date().toISOString(),
        };
    }
}

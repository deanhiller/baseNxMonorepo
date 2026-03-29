import { ApiPath, Endpoint, Authentication, AuthenticationConfig } from '@webpieces/http-api';

export interface GreetRequest {
    name?: string;
}

export interface GreetResponse {
    greeting?: string;
    serverTime?: string;
}

@Authentication(new AuthenticationConfig(false))
@ApiPath('/example')
export abstract class ExampleApi {
    @Endpoint('/greet')
    greet(request: GreetRequest): Promise<GreetResponse> {
        throw new Error('Method greet() must be implemented by subclass');
    }
}

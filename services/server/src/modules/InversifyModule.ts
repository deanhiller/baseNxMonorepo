import { ContainerModule } from 'inversify';
import { PlatformHeader, PlatformHeadersExtension, HEADER_TYPES } from '@webpieces/http-api';

export class AppHeaders {
    static readonly CLIENT_TYPE = new PlatformHeader('x-client-type', true, false, true);

    static getAllHeaders(): PlatformHeader[] {
        return [AppHeaders.CLIENT_TYPE];
    }
}

export const InversifyModule = new ContainerModule((options) => {
    const appExtension = new PlatformHeadersExtension(AppHeaders.getAllHeaders());
    options
        .bind<PlatformHeadersExtension>(HEADER_TYPES.PlatformHeadersExtension)
        .toConstantValue(appExtension);
});

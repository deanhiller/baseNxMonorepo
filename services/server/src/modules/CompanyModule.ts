import { ContainerModule } from 'inversify';
import { PlatformHeader, PlatformHeadersExtension, HEADER_TYPES } from '@webpieces/http-api';

export class CompanyHeaders {
    static readonly TENANT_ID = new PlatformHeader('x-tenant-id', true, false, true);
    static readonly API_VERSION = new PlatformHeader('x-api-version', true, false, true);
    static readonly AUTHORIZATION = new PlatformHeader('authorization', true, true, false);

    static getAllHeaders(): PlatformHeader[] {
        return [CompanyHeaders.TENANT_ID, CompanyHeaders.API_VERSION, CompanyHeaders.AUTHORIZATION];
    }
}

export const CompanyModule = new ContainerModule((options) => {
    const companyExtension = new PlatformHeadersExtension(CompanyHeaders.getAllHeaders());
    options
        .bind<PlatformHeadersExtension>(HEADER_TYPES.PlatformHeadersExtension)
        .toConstantValue(companyExtension);
});

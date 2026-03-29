import { injectable } from 'inversify';
import { provideSingleton, MethodMeta } from '@webpieces/http-routing';
import { RequestContext } from '@webpieces/core-context';
import { Filter, WpResponse, Service } from '@webpieces/http-filters';
import { HttpUnauthorizedError } from '@webpieces/http-api';
import { CompanyHeaders } from '../modules/CompanyModule';

@provideSingleton()
@injectable()
// webpieces-disable no-any-unknown -- Filter generic params use unknown for response type flexibility
export class AuthFilter extends Filter<MethodMeta, WpResponse<unknown>> {
    // webpieces-disable no-any-unknown -- Filter generic params use unknown for response type flexibility
    async filter(
        meta: MethodMeta,
        nextFilter: Service<MethodMeta, WpResponse<unknown>>,
    ): Promise<WpResponse<unknown>> {
        const authMeta = meta.authMeta;

        if (!authMeta || !authMeta.authenticated) {
            return await nextFilter.invoke(meta);
        }

        const token = RequestContext.getHeader(CompanyHeaders.AUTHORIZATION);
        if (!token) {
            throw new HttpUnauthorizedError('Authentication required');
        }

        return await nextFilter.invoke(meta);
    }
}

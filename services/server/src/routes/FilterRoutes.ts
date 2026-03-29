import { Routes, RouteBuilder, FilterDefinition } from '@webpieces/http-routing';
import { ContextFilter, LogApiFilter } from '@webpieces/http-server';
import { AuthFilter } from '../filters/AuthFilter';

export class FilterRoutes implements Routes {
    configure(routeBuilder: RouteBuilder): void {
        routeBuilder.addFilter(new FilterDefinition(2000, ContextFilter, '*'));
        routeBuilder.addFilter(new FilterDefinition(1900, AuthFilter, '*'));
        routeBuilder.addFilter(new FilterDefinition(1800, LogApiFilter, '*'));
    }
}

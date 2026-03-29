import { WebAppMeta, Routes, ApiRoutingFactory } from '@webpieces/http-routing';
import { ContainerModule } from 'inversify';
import { WebpiecesModule } from '@webpieces/http-server';
import { CompanyModule } from './modules/CompanyModule';
import { InversifyModule } from './modules/InversifyModule';
import { FilterRoutes } from './routes/FilterRoutes';
import { ExampleApi } from '@myorg/apis';
import { ExampleController } from './controllers/ExampleController';

export class ProdServerMeta implements WebAppMeta {
    getDIModules(): ContainerModule[] {
        return [WebpiecesModule, CompanyModule, InversifyModule];
    }

    getRoutes(): Routes[] {
        return [
            new FilterRoutes(),
            new ApiRoutingFactory(ExampleApi, ExampleController),
        ];
    }
}

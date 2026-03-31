import 'reflect-metadata';
import { WebpiecesFactory } from '@webpieces/http-server';
import { WebpiecesConfig } from '@webpieces/http-routing';
import { ProdServerMeta } from './ProdServerMeta';
import { toError } from '@webpieces/core-util';

async function main(): Promise<void> {
    // eslint-disable-next-line @webpieces/no-unmanaged-exceptions -- Top-level server startup
    try {
        const config = new WebpiecesConfig();
        const server = await WebpiecesFactory.create(new ProdServerMeta(), config);

        const port = parseInt(process.env['PORT'] || '8200', 10);
        await server.start(port);
        console.log(`Server started on port ${port}`);

        await new Promise((resolve) => {
            process.on('SIGTERM', () => resolve(undefined));
            process.on('SIGINT', () => resolve(undefined));
        });
    } catch (err: unknown) {
        const error = toError(err);
        console.error('[Server] Startup error:', error);
        process.exit(1);
    }
}

main();

export { main };

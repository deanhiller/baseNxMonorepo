import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        watch: false,
        globals: true,
        environment: 'node',
        include: [
            'libraries/*/{src,tests}/**/*.{test,spec}.{js,ts}',
            'services/server/{src,tests}/**/*.{test,spec}.{js,ts}',
        ],
        passWithNoTests: true,
        pool: 'forks',
        poolOptions: {
            forks: {
                maxForks: 2,
            },
        },
    },
});

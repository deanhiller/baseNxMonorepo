import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'root-api-util',
        watch: false,
        globals: true,
        environment: 'node',
        include: ['{src,tests}/**/*.{test,spec}.{js,ts}'],
        passWithNoTests: true,
        pool: 'forks',
        poolOptions: {
            forks: {
                maxForks: 2,
            },
        },
    },
});

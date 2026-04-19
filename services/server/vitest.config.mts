import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'server',
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

import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => ({
    projects: await getJestProjectsAsync(),
    maxWorkers: 2,
    workerIdleMemoryLimit: '1GB',
});

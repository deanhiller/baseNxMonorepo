import { nxPreset } from '@nx/jest/preset.js';

export default {
    passWithNoTests: true,
    ...(process.env.JEST_SILENT ? { silent: true } : {}),
    ...nxPreset,
};

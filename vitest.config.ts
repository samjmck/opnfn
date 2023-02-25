import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
    test: {
        environment: "miniflare",
        exclude: [
            ...configDefaults.exclude,
            // "test/OpnfnStore.test.ts",
        ]
    },
});

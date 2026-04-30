// No-op shim for the `server-only` package, used in vitest tests so that
// modules guarded by `import "server-only"` can be loaded directly.
export {};

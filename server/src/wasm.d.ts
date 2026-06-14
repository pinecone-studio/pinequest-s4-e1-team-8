// wrangler/esbuild bundles `*.wasm` imports as precompiled `WebAssembly.Module`
// instances (the only way to use WASM in the Workers runtime, which forbids
// compiling from a buffer at runtime).
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}

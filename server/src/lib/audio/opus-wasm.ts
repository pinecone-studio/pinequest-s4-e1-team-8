// Worker-only entry point that imports the vendored libopus module as a
// precompiled `WebAssembly.Module`. Kept separate from the decode logic so the
// pure functions can be unit-tested under Bun without the bundler-specific
// `.wasm` import.
import opusModule from "./opus-decoder.wasm";

export default opusModule;

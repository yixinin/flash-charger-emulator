// wasm-loader.js - 加载和管理 WebAssembly 模块

class WasmLoader {
  constructor() {
    this.module = null;
    this.isInitialized = false;
    this.state = null;
  }

  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('start init wasm module');
      // 加载 wasm_exec.js
      await this.loadWasmExec();

      console.log('wasm_exec.js load complete', 'start load charger.wasm');

      // 创建 Go 实例
      window.go = new Go();

      // 加载 WebAssembly 模块
      const { instance } = await WebAssembly.instantiateStreaming(
        fetch('/wasm/charger.wasm'),
        window.go.importObject
      );

      window.go.run(instance);

      // 初始化充电站
      window.chargerInit();

      this.isInitialized = true;
      console.log('Wasm 模块初始化成功');
    } catch (error) {
      console.error('Wasm 模块初始化失败:', error);
      throw error;
    }
  }

  loadWasmExec() {
    return new Promise((resolve, reject) => {
      // 检查 go 对象是否已存在
      if (typeof window.Go !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/wasm/wasm_exec.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  update(timeSpeed = 1) {
    if (!this.isInitialized) {
      throw new Error('Wasm 模块未初始化');
    }

    // 使用实际的 Wasm 模块
    const stateJson = window.chargerUpdate();
    const state = JSON.parse(stateJson);
    return state;
  }

  updateConfig(config) {
    if (!this.isInitialized) {
      throw new Error('Wasm 模块未初始化');
    }

    window.chargerUpdateConfig(JSON.stringify(config));
  }

  getState() {
    if (!this.isInitialized) {
      throw new Error('Wasm 模块未初始化');
    }

    const stateJson = window.chargerGetState();
    return JSON.parse(stateJson);
  }
}

// 导出单例
const wasmLoader = new WasmLoader();
export default wasmLoader;

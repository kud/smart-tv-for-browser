var webext = (function (exports) {
  'use strict';

  // @kud/webext@0.2.0 — vendored build, do not edit by hand.

  // src/api.ts
  var resolveApi = () => {
    const scope = globalThis;
    return scope.browser?.runtime ? scope.browser : scope.chrome?.runtime ? scope.chrome : void 0;
  };
  var api = new Proxy({}, {
    get: (_target, prop) => {
      const resolved = resolveApi();
      if (!resolved) {
        throw new Error(
          `@kud/webext: no WebExtension API found \u2014 expected a global \`browser\` or \`chrome\` when reading \`${prop}\`. This code is not running in an extension context.`
        );
      }
      return resolved[prop];
    }
  });
  var invoke = (target, method, ...args) => new Promise((resolve, reject) => {
    const settle = (value) => {
      const failure = resolveApi()?.runtime?.lastError;
      failure ? reject(new Error(failure.message)) : resolve(value);
    };
    const returned = target[method](...args, settle);
    if (returned && typeof returned.then === "function")
      returned.then(resolve, reject);
  });

  // src/settings.ts
  var deepFreeze = (value) => {
    if (!value || typeof value !== "object" || Object.isFrozen(value))
      return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  };
  var defineSettings = (defaults, options = {}) => {
    const area = options.area ?? "sync";
    deepFreeze(defaults);
    const keys = Object.keys(defaults);
    const store = () => api.storage[area];
    const get = async () => {
      const stored = await invoke(store(), "get", keys);
      return { ...defaults, ...stored };
    };
    const set = (patch) => {
      const unknown = Object.keys(patch).filter((key) => !(key in defaults));
      if (unknown.length) {
        throw new Error(
          `@kud/webext: unknown setting${unknown.length > 1 ? "s" : ""} ${unknown.map((k) => `"${k}"`).join(", ")} \u2014 declared keys are ${keys.map((k) => `"${k}"`).join(", ")}.`
        );
      }
      return invoke(store(), "set", patch).then(() => void 0);
    };
    const onChange = (listener) => {
      const handler = (changes, changedArea) => {
        if (changedArea !== area) return;
        const changed = {};
        for (const key of keys) {
          if (!(key in changes)) continue;
          const { newValue } = changes[key];
          changed[key] = newValue === void 0 ? defaults[key] : newValue;
        }
        if (!Object.keys(changed).length) return;
        get().then((values) => listener(values, changed));
      };
      api.storage.onChanged.addListener(handler);
      return () => api.storage.onChanged.removeListener(handler);
    };
    return { defaults, get, set, onChange };
  };

  // src/messaging.ts
  var sendToActiveTab = async (message, options = {}) => {
    const query = options.window === "lastFocused" ? { active: true, lastFocusedWindow: true } : { active: true, currentWindow: true };
    try {
      const [tab] = await invoke(api.tabs, "query", query);
      if (tab?.id === void 0) return void 0;
      return await invoke(api.tabs, "sendMessage", tab.id, message);
    } catch {
      return void 0;
    }
  };

  exports.api = api;
  exports.defineSettings = defineSettings;
  exports.invoke = invoke;
  exports.sendToActiveTab = sendToActiveTab;

  return exports;

})({});

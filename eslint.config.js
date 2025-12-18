/**
 * ESLint 9.x configuration for Bug Tracer extension
 * Migrated from .eslintrc.json
 */

export default [
  {
    files: ["**/*.js"],
    ignores: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly",
        XMLHttpRequest: "readonly",
        Blob: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        MediaRecorder: "readonly",
        MutationObserver: "readonly",

        // Browser timers and functions
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        confirm: "readonly",
        alert: "readonly",

        // Browser APIs
        indexedDB: "readonly",
        FormData: "readonly",
        btoa: "readonly",
        atob: "readonly",

        // Chrome extension APIs
        chrome: "readonly",
        browser: "readonly",

        // Node.js globals (for scripts)
        module: "writable",
        exports: "writable",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",

        // Bug Tracer specific globals
        BugTracerStorage: "readonly",
        UploadManager: "readonly",
        BaseUploadProvider: "readonly",
        CloudinaryProvider: "readonly",
        AWSS3Provider: "readonly",
        GenericHTTPProvider: "readonly"
      }
    },
    rules: {
      // Code style
      "indent": "off",
      "linebreak-style": "off",
      "quotes": "off",
      "semi": "off",

      // Best practices
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-undef": "error",
      "no-var": "warn",
      "prefer-const": "warn",

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error"
    }
  }
];

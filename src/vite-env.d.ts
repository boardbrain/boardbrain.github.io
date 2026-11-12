/// <reference types="vite/client" />

/** App version from `package.json`, inserted by Vite at build time (`define`). */
declare const __APP_VERSION__: string;

/** Short Git commit of the build, empty without Git (K-9). */
declare const __BUILD_COMMIT__: string;

/** Time of the build as a UTC timestamp (K-9). */
declare const __BUILD_TIME__: string;

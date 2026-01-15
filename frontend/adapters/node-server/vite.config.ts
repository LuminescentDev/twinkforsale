import { nodeServerAdapter } from "@builder.io/qwik-city/adapters/node-server/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.node-server.tsx", "@qwik-city-plan"],
        // Add options to handle readonly property issues
        onwarn(warning, warn) {
          // Skip certain warnings that might cause issues
          if (warning.code === 'THIS_IS_UNDEFINED' || warning.code === 'CIRCULAR_DEPENDENCY') {
            return;
          }
          warn(warning);
        },
      },
    },
    plugins: [nodeServerAdapter({ name: "node-server" })],
  };
});

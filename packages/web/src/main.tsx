import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { queryClient } from "#infrastructure/query-client.ts";
import { Provider } from "#provider.tsx";

import { router } from "./router.ts";

function App() {
  return <RouterProvider context={{ queryClient }} router={router} />;
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <Provider>
        <App />
      </Provider>
    </StrictMode>,
  );
}

interface ClosableTestApp {
  close: () => Promise<void>;
  server: {
    closeAllConnections?: () => void;
  };
}

/** Tear down in-flight multipart uploads without hanging on open keep-alive sockets. */
export async function closeTestApp(app: ClosableTestApp | undefined): Promise<void> {
  if (!app) {
    return;
  }

  const server = app.server;

  if (typeof server.closeAllConnections === "function") {
    server.closeAllConnections();
  }

  await app.close();
}

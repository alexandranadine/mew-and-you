import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Mew & You API listening on http://localhost:${env.port}`);
});

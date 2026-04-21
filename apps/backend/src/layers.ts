import { Layer } from "effect";

import { InMemoryRequestRepositoryLayer } from "./infra/persistence/in-memory-request-repository";
import { InMemorySessionRepositoryLayer } from "./infra/persistence/in-memory-session-repository";
import { makePrismaRequestRepositoryLayer } from "./infra/persistence/request-repository";
import { makePrismaSessionRepositoryLayer } from "./infra/persistence/session-repository";
import { makeNeonAuthProviderLayer } from "./infra/auth/neon-auth-provider";
import { getDatabaseUrl } from "./shared/config/runtime-env";

export const makeAppLayer = (env: Env) => {
  const databaseUrl = getDatabaseUrl(env);

  const requestLayer = databaseUrl
    ? makePrismaRequestRepositoryLayer(databaseUrl)
    : InMemoryRequestRepositoryLayer;

  const sessionLayer = databaseUrl
    ? makePrismaSessionRepositoryLayer(databaseUrl)
    : InMemorySessionRepositoryLayer;

  const authLayer = databaseUrl
    ? makeNeonAuthProviderLayer(databaseUrl)
    : makeNeonAuthProviderLayer("");

  return Layer.mergeAll(requestLayer, sessionLayer, authLayer);
};

export type AppServices = Layer.Layer.Success<ReturnType<typeof makeAppLayer>>;

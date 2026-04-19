import { Layer } from "effect";

import { InMemoryRequestRepositoryLayer } from "./infra/persistence/in-memory-request-repository";
import { InMemorySessionRepositoryLayer } from "./infra/persistence/in-memory-session-repository";
import { makePrismaRequestRepositoryLayer } from "./infra/persistence/request-repository";
import { makePrismaSessionRepositoryLayer } from "./infra/persistence/session-repository";
import { makeNeonAuthProviderLayer } from "./infra/auth/neon-auth-provider";

export const makeAppLayer = (env: Env) => {
  const requestLayer = env.DATABASE_URL
    ? makePrismaRequestRepositoryLayer(env.DATABASE_URL)
    : InMemoryRequestRepositoryLayer;

  const sessionLayer = env.DATABASE_URL
    ? makePrismaSessionRepositoryLayer(env.DATABASE_URL)
    : InMemorySessionRepositoryLayer;

  const authLayer = env.DATABASE_URL
    ? makeNeonAuthProviderLayer(env.DATABASE_URL)
    : makeNeonAuthProviderLayer("");

  return Layer.mergeAll(requestLayer, sessionLayer, authLayer);
};

export type AppServices = Layer.Layer.Success<ReturnType<typeof makeAppLayer>>;

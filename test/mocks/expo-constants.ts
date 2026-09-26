export const ExecutionEnvironment = {
  Bare: "bare",
  Standalone: "standalone",
  StoreClient: "storeClient",
} as const;

const Constants = {
  executionEnvironment: ExecutionEnvironment.Bare as string,
  expoConfig: { name: "DevHub", slug: "devhub", version: "1.0.0" },
};

export default Constants;

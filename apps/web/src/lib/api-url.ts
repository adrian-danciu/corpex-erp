export function getApiBaseUrl(): string {
  const graphqlUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/graphql";
  return graphqlUrl.replace(/\/graphql\/?$/, "");
}

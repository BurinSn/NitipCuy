export interface MutationRequestMetadata {
  readonly appOrigin: string;
  readonly origin: string | null;
  readonly fetchSite: string | null;
  readonly contentType: string | null;
}

export function isSameOriginJsonMutation(
  metadata: MutationRequestMetadata,
): boolean {
  return (
    metadata.origin === metadata.appOrigin &&
    metadata.fetchSite === "same-origin" &&
    metadata.contentType?.split(";", 1)[0] === "application/json"
  );
}

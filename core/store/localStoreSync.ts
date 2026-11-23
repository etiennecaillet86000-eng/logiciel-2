/** Les méthodes get* sont des lectures : elles ne doivent pas notifier le store. */
export function shouldPersistActorCall(method: string, readMethods: Record<string, string>): boolean {
  return !(method in readMethods);
}

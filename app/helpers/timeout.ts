export async function timeout(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

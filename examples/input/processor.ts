export default async function codegen(
  data: any,
): Promise<Record<string, unknown>> {
  return {
    data: {
      ...(data ? data : {}),
      pi: Math.PI,
      e: Math.E,
      c: 299792458,
    }
  }
}
export function asDefaultPattern(datetime: string | Date): string {
  return new Date(datetime).toLocaleString();
}

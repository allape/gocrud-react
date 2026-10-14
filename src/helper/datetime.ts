export function datetimeStringify(datetime: string | Date): string {
  return new Date(datetime).toLocaleString();
}

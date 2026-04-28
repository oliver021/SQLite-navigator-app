export function getPrimaryKey(columns: any[]): string | null {
  const pk = columns.find((c: any) => c.pk === 1);
  return pk ? pk.name : null;
}

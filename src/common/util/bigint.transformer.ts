// PostgreSQL returns bigint columns as strings. These transformers handle the conversion.

export const BigintTransformer = {
  from: (value: string): number => parseInt(value, 10),
  to: (value: number): number => value,
};

export const NullableBigintTransformer = {
  from: (value: string | null | undefined): number | null =>
    value !== null && value !== undefined ? parseInt(value, 10) : null,
  to: (value: number | null): number | null => value,
};
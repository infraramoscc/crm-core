export function normalizeSearchText(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
        return value.map((item) => normalizeSearchText(item)).join(" ");
    }
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function matchesSearch(query: string, ...values: unknown[]): boolean {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;
    return values.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

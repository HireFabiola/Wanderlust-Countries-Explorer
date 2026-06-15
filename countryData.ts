export interface Country {
    cca2: string;
    cca3: string;
    name: {
        common: string;
        official: string;
        nativeName?: Record<string, {
            common: string;
            official: string;
        }>;
    };
    capital?: string[];
    region: string;
    subregion?: string;
    population: number;
    flags: {
        svg: string;
    };
    tld?: string[];
    currencies?: Record<string, {
        name: string;
        symbol?: string;
    }>;
    languages?: Record<string, string>;
    borders?: string[];
}

export function normalizeCountryValue(value: string): string {
    return value.trim().toLocaleLowerCase();
}

export function searchCountries(countries: Country[], query: string): Country[] {
    const normalizedQuery = normalizeCountryValue(query);

    return countries.filter((country) => {
        const commonName = normalizeCountryValue(country.name.common);
        const officialName = normalizeCountryValue(country.name.official);
        return commonName.includes(normalizedQuery) || officialName.includes(normalizedQuery);
    });
}

export function findCountryByName(
    countries: Country[],
    name: string
): Country | undefined {
    const normalizedName = normalizeCountryValue(name);

    return countries.find((country) =>
        normalizeCountryValue(country.name.common) === normalizedName ||
        normalizeCountryValue(country.name.official) === normalizedName
    ) ?? searchCountries(countries, name)[0];
}

export function getNativeName(country: Country): string {
    const nativeNames = country.name.nativeName
        ? Object.values(country.name.nativeName)
        : [];

    return nativeNames[0]?.common ?? country.name.official;
}

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
export declare function normalizeCountryValue(value: string): string;
export declare function searchCountries(countries: Country[], query: string): Country[];
export declare function findCountryByName(countries: Country[], name: string): Country | undefined;
export declare function getNativeName(country: Country): string;
//# sourceMappingURL=countryData.d.ts.map
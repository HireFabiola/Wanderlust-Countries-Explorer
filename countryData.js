export function normalizeCountryValue(value) {
    return value.trim().toLocaleLowerCase();
}
export function searchCountries(countries, query) {
    const normalizedQuery = normalizeCountryValue(query);
    return countries.filter((country) => {
        const commonName = normalizeCountryValue(country.name.common);
        const officialName = normalizeCountryValue(country.name.official);
        return commonName.includes(normalizedQuery) || officialName.includes(normalizedQuery);
    });
}
export function findCountryByName(countries, name) {
    const normalizedName = normalizeCountryValue(name);
    return countries.find((country) => normalizeCountryValue(country.name.common) === normalizedName ||
        normalizeCountryValue(country.name.official) === normalizedName) ?? searchCountries(countries, name)[0];
}
export function getNativeName(country) {
    const nativeNames = country.name.nativeName
        ? Object.values(country.name.nativeName)
        : [];
    return nativeNames[0]?.common ?? country.name.official;
}

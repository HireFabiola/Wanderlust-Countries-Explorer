import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
    findCountryByName,
    getNativeName,
    normalizeCountryValue,
    searchCountries
} from "../countryData.js";

const countries = JSON.parse(
    await readFile(new URL("../data/countries.json", import.meta.url), "utf8")
);

test("the local snapshot contains complete country records", () => {
    assert.equal(countries.length, 250);
    assert.ok(countries.every((country) =>
        country.name?.common &&
        country.cca2 &&
        country.cca3 &&
        country.region &&
        Number.isFinite(country.population) &&
        country.flags?.svg
    ));
});

test("country searches are case-insensitive and support partial names", () => {
    assert.equal(normalizeCountryValue("  EuRoPe "), "europe");
    assert.ok(searchCountries(countries, "united").length >= 3);
    assert.equal(findCountryByName(countries, "united states")?.cca3, "USA");
});

test("border codes and native names resolve from the snapshot", () => {
    const countryCodes = new Set(countries.map((country) => country.cca3));
    assert.ok(countries.every((country) =>
        (country.borders ?? []).every((border) => countryCodes.has(border))
    ));

    const haiti = findCountryByName(countries, "Haiti");
    assert.ok(haiti);
    assert.equal(getNativeName(haiti), "Haïti");
});

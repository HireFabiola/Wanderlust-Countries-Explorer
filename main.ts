
import {
    type Country,
    findCountryByName,
    getNativeName,
    normalizeCountryValue,
    searchCountries
} from "./countryData.js";

// =================================================================================
//                                  DOM REFERENCES
// =================================================================================
// Root + Theme
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle") as HTMLInputElement | null;
const logo = document.getElementById("logoImage") as HTMLImageElement | null;

// Search + Filters
const searchForm = document.getElementById("searchForm") as HTMLFormElement | null;
const searchInput = document.getElementById("searchField") as HTMLInputElement | null;
const filterDD = document.getElementById("regionFilter") as HTMLSelectElement | null;

// Layout Containers
const countryContainer = document.getElementById("countryFlags") as HTMLElement | null;
const homePage = document.getElementById("onLoadLayout") as HTMLElement | null;
const newPage = document.getElementById("newLayout") as HTMLElement | null;

// Header / UI Elements
const travelCounter = document.getElementById("travelCounter") as HTMLElement | null;
const visitedFilterContainer = document.getElementById("visitedFilterContainer") as HTMLElement | null;

// Auth Elements
const authLink = document.getElementById("authLink") as HTMLAnchorElement | null;
const logoutLink = document.getElementById("logoutLink") as HTMLAnchorElement | null;

// Forms
const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;
const registerForm = document.getElementById("registerForm") as HTMLFormElement | null;

// Form Inputs (Login)
const loginEmail = document.getElementById("loginEmail") as HTMLInputElement | null;
const loginPassword = document.getElementById("loginPassword") as HTMLInputElement | null;

// Form Inputs (Register)
const registerName = document.getElementById("registerName") as HTMLInputElement | null;
const registerEmail = document.getElementById("registerEmail") as HTMLInputElement | null;
const registerPassword = document.getElementById("registerPassword") as HTMLInputElement | null;

// Message Areas
const loginMessage = document.getElementById("loginMessage") as HTMLElement | null;
const registerMessage = document.getElementById("registerMessage") as HTMLElement | null;

// Modal
const authModal = document.getElementById("authModal") as HTMLElement | null;

// Global state
let totalWorldCountries: number = 0;
let visitedMap: any = null;

// REST Countries v3.1 was deprecated in June 2026, so the app uses a local
// snapshot of its open-source dataset instead of exposing a v5 API key.
const COUNTRY_DATA_URL = "./data/countries.json";
let cachedCountries: Country[] | null = null;
let countryDataPromise: Promise<Country[]> | null = null;
// Registered user stored in localStorage
type RegisteredUser = {
    name: string;
    email: string;
    password: string;
    visitedCountries: string[];
    countryPhotos?: Record<string, string[]>;
    countryJournal?: Record<string, string>;
};

// Active logged-in session
type ActiveSession = {
    name: string;
    email: string;
};
// ================================================================
//                       HELPER FUNCTIONS
// ================================================================

// Get the main container where country cards are rendered
function getCountryFlagsContainer(): HTMLElement | null {
    return document.getElementById("countryFlags");
}

// Clear all existing content from a container
function clearContainer(container: HTMLElement): void {
    container.innerHTML = "";
}

async function loadCountries(): Promise<Country[]> {
    if (cachedCountries) {
        return cachedCountries;
    }

    if (!countryDataPromise) {
        countryDataPromise = fetch(COUNTRY_DATA_URL)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load country data (${response.status})`);
                }

                const countries: unknown = await response.json();
                if (!Array.isArray(countries)) {
                    throw new Error("Country data has an unexpected format");
                }

                cachedCountries = countries as Country[];
                return cachedCountries;
            })
            .catch((error) => {
                countryDataPromise = null;
                throw error;
            });
    }

    return countryDataPromise;
}

// Display a success or error message inside a target element
function setMessage(
    elementId: string,
    message: string,
    isError: boolean = true
): void {
    const el = document.getElementById(elementId);

    if (!el) return;

    el.textContent = message;
    el.classList.remove("text-danger", "text-success");
    el.classList.add(isError ? "text-danger" : "text-success");
}

// Load journal
function getCountryJournal(countryName: string): string {
    const user = getLoggedInRegisteredUser();

    if (!user || !user.countryJournal) return "";

    return user.countryJournal[countryName] ?? "";
}

// Save journal
function saveCountryJournal(countryName: string, note: string): void {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const users = getRegisteredUsers();
    const user = users.find(
        u => u.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (!user) return;

    if (!user.countryJournal) {
        user.countryJournal = {};
    }

    user.countryJournal[countryName] = note;
    saveRegisteredUsers(users);
}

// Clear any text message inside a target element
function clearMessage(elementId: string): void {
    const el = document.getElementById(elementId);

    if (!el) return;

    el.textContent = "";
}

// Clear error message once corrected
function clearCountryError(): void {
    if (!countryContainer) return;

    // Only clear if it's currently showing an error
    if (countryContainer.querySelector(".alert")) {
        countryContainer.innerHTML = "";
    }
}
// ==========================================================
//              AUTHENTICATION AND USER DATA
// ==========================================================

// Get all registered users from localStorage
function getRegisteredUsers(): RegisteredUser[] {
    const raw = localStorage.getItem("wanderlustUsers");
    return raw ? JSON.parse(raw) as RegisteredUser[] : [];
}


// Save all registered users to localStorage
function saveRegisteredUsers(users: RegisteredUser[]): void {
    localStorage.setItem("wanderlustUsers", JSON.stringify(users));
}


// Get the current logged-in user session
function getCurrentUser(): ActiveSession | null {
    const raw = localStorage.getItem("wanderlustCurrentUser");
    return raw ? JSON.parse(raw) as ActiveSession : null;
}


// Save the current logged-in user session
function saveCurrentUser(user: ActiveSession): void {
    localStorage.setItem("wanderlustCurrentUser", JSON.stringify(user));
}


// Clear the current logged-in user session
function clearCurrentUser(): void {
    localStorage.removeItem("wanderlustCurrentUser");
    sessionStorage.removeItem("wanderlustCurrentUser");
}


// Get the full registered user object for the currently logged-in user
function getLoggedInRegisteredUser(): RegisteredUser | null {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    const users = getRegisteredUsers();

    return users.find(
        user => user.email.toLowerCase() === currentUser.email.toLowerCase()
    ) ?? null;
}


// Update authentication-related UI elements
function updateAuthUI(): void {
    const authLink = document.getElementById("authLink") as HTMLAnchorElement | null;
    const welcomeUser = document.getElementById("welcomeUser") as HTMLElement | null;
    const logoutLink = document.getElementById("logoutLink") as HTMLAnchorElement | null;

    const currentUser = getCurrentUser();

    if (currentUser) {
        if (authLink) authLink.classList.add("d-none");
        if (logoutLink) logoutLink.classList.remove("d-none");
        if (welcomeUser) welcomeUser.textContent = "";
    } else {
        if (authLink) authLink.classList.remove("d-none");
        if (logoutLink) logoutLink.classList.add("d-none");
        if (welcomeUser) welcomeUser.textContent = "";
    }
}


// Update the search input placeholder based on login state
function updateSearchPlaceholder(): void {
    const user = getCurrentUser();

    if (!searchInput) return;

    if (user) {
        searchInput.placeholder = "Pack your bags! Where to next... ";
    } else {
        searchInput.placeholder = "Search a country...";
    }
}


// Close the Bootstrap authentication modal
function closeAuthModal(): void {
    const modalEl = document.getElementById("authModal");
    if (!modalEl) return;

    const modal = (window as any).bootstrap?.Modal.getInstance(modalEl);
    modal?.hide();
}


// Initialize login, registration, and logout behavior
function initAuth(): void {
    const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;
    const registerForm = document.getElementById("registerForm") as HTMLFormElement | null;
    const logoutLink = document.getElementById("logoutLink") as HTMLAnchorElement | null;

    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearMessage("registerMessage");

            const name = (document.getElementById("registerName") as HTMLInputElement).value.trim();
            const email = (document.getElementById("registerEmail") as HTMLInputElement).value.trim();
            const password = (document.getElementById("registerPassword") as HTMLInputElement).value.trim();

            if (!name || !email || !password) {
                setMessage("registerMessage", "Please complete all fields.");
                return;
            }

            const users = getRegisteredUsers();
            const exists = users.some(
                user => user.email.toLowerCase() === email.toLowerCase()
            );

            if (exists) {
                setMessage("registerMessage", "An account with this email already exists.");
                return;
            }

            users.push({
                name,
                email,
                password,
                visitedCountries: []
            });

            saveRegisteredUsers(users);
            saveCurrentUser({ name, email });

            setMessage("registerMessage", "Registration successful.", false);
            updateAuthUI();
            updateSearchPlaceholder();
            getCountryInfo();
            renderVisitedFilter();
            registerForm.reset();

            setTimeout(() => closeAuthModal(), 500);
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearMessage("loginMessage");

            const email = (document.getElementById("loginEmail") as HTMLInputElement).value.trim();
            const password = (document.getElementById("loginPassword") as HTMLInputElement).value.trim();

            if (!email || !password) {
                setMessage("loginMessage", "Please enter email and password.");
                return;
            }

            const user = getRegisteredUsers().find(
                u => u.email.toLowerCase() === email.toLowerCase()
            );

            if (!user) {
                setMessage("loginMessage", "No account found with that email.");
                return;
            }

            if (user.password !== password) {
                setMessage("loginMessage", "Incorrect password.");
                return;
            }

            saveCurrentUser({ name: user.name, email: user.email });

            setMessage("loginMessage", "Login successful.", false);
            updateAuthUI();
            updateSearchPlaceholder();
            getCountryInfo();
            renderVisitedFilter();
            loginForm.reset();

            setTimeout(() => closeAuthModal(), 500);
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener("click", (event) => {
            event.preventDefault();

            clearCurrentUser();
            updateAuthUI();
            updateSearchPlaceholder();
            getCountryInfo();
            renderVisitedFilter();
        });
    }

    updateAuthUI();
    updateSearchPlaceholder();
}

// ====================================================================
//              VISITED COUNTRIES & PROGRESS TRACKING
// =====================================================================
function renderVisitedWorldMap(countries: Country[]): void {
    const mapContainer = document.getElementById("visitedWorldMap");
    const user = getLoggedInRegisteredUser();

    if (!mapContainer) return;

    mapContainer.classList.add(
        "w-100",
        "mx-auto",
        "border",
        "rounded-4",
        "overflow-hidden",
        "shadow-sm"
    );

    mapContainer.style.maxWidth = "900px";
    mapContainer.style.width = "100%";
    mapContainer.style.aspectRatio = "16 / 9";
    mapContainer.style.minHeight = "240px";
    mapContainer.style.maxHeight = "420px";
    mapContainer.style.height = "auto";

    mapContainer.innerHTML = "";

    // ===== Travel Header =====
const header = document.createElement("h4");
header.classList.add("text-center", "fw-bold", "mb-1");
header.textContent = "✈️ WanderLust Map";

// ===== Dynamic Message =====
const message = document.createElement("p");
message.classList.add("text-center", "text-muted", "mb-2");

if (!user) {
    message.textContent = "Log in to start tracking your adventures.";
} else if (user.visitedCountries.length === 0) {
    message.textContent = "Your journey starts here — mark your first destination!";
} else {
    message.textContent = "Look at you go! Your journey is lighting up the world one country at a time.";
}

// Add to container
mapContainer.appendChild(header);
mapContainer.appendChild(message);

    const mapDiv = document.createElement("div");
    mapDiv.id = "mapInner";
    mapDiv.style.width = "100%";
    mapDiv.style.height = "100%";

    mapContainer.appendChild(mapDiv);

    const visitedCountryCodes = user
        ? countries
            .filter(country => user.visitedCountries.includes(country.name.common))
            .map(country => country.cca2)
        : [];

    const selectedRegions = visitedCountryCodes;

    visitedMap = new (window as any).jsVectorMap({
        selector: "#mapInner",
        map: "world",
        zoomButtons: true,
        selectedRegions,
        regionStyle: {
            initial: {
                fill: "#dee2e6"
            },
            selected: {
                fill: "#198754"
            }
        },
        onRegionTooltipShow(event: Event, tooltip: any, code: string) {
            const country = countries.find(country => country.cca2 === code);
            if (!country) return;

            const visited = user
                ? user.visitedCountries.includes(country.name.common)
                : false;

            tooltip.text(
                visited
                    ? `${country.name.common} ✓ Visited`
                    : country.name.common
            );
        }
    });

    setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
    }, 100);
}

// Check if a country has been marked as visited
function isCountryVisited(countryName: string): boolean {
    const user = getLoggedInRegisteredUser();
    if (!user) return false;

    return user.visitedCountries.includes(countryName);
}


// Add or remove a country from visited list
function toggleVisitedCountry(countryName: string): void {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        alert("Please log in or register to track countries you've visited.");
        return;
    }

    const users = getRegisteredUsers();
    const user = users.find(
        u => u.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (!user) return;

    const alreadyVisited = user.visitedCountries.includes(countryName);

    if (alreadyVisited) {
        user.visitedCountries = user.visitedCountries.filter(
            name => name !== countryName
        );
    } else {
        user.visitedCountries.push(countryName);
    }

    saveRegisteredUsers(users);
}


// Update the visual state of the visited button
function updateVisitedButtonState(
    button: HTMLButtonElement,
    countryName: string
): void {
    const visited = isCountryVisited(countryName);

    button.innerHTML = visited
        ? `<i class="bi bi-bookmark-check-fill"></i>`
        : `<i class="bi bi-bookmark"></i>`;

    button.classList.toggle("visited", visited);
    button.title = visited ? "Visited" : "Mark as visited";

    button.setAttribute(
        "aria-label",
        visited
            ? `${countryName} marked as visited`
            : `Mark ${countryName} as visited`
    );
}

// Refresh the current country display and counter after toggling visited status
async function refreshCountryDisplayAfterToggle(visitedAfterToggle: boolean): Promise<void> {
    updateTravelCounterFromStoredCountries();
    renderVisitedFilter();

    const countryFlagsContainer = document.getElementById("countryFlags");

    if (!countryFlagsContainer) return;

    const selectedRegion = filterDD?.value;

    if (selectedRegion === "visited" && !visitedAfterToggle) {
        await getCountryInfo();
        return;
    }

    await handleChange(new Event("change"));
}

// Create the visited toggle button for each country card
function createVisitedToggle(country: Country): HTMLButtonElement {
    const button = document.createElement("button");

    button.type = "button";
    button.classList.add("visited-toggle", "btn", "btn-sm");
    button.setAttribute("aria-label", `Mark ${country.name.common} as visited`);
    button.title = "Mark as visited";

    updateVisitedButtonState(button, country.name.common);

    button.addEventListener("click", async (event) => {
        event.stopPropagation();

        const wasVisited = isCountryVisited(country.name.common);
        const visitedAfterToggle = !wasVisited;

        toggleVisitedCountry(country.name.common);
        updateVisitedButtonState(button, country.name.common);
        await refreshCountryDisplayAfterToggle(visitedAfterToggle);
    });

    return button;
}

function renderTravelCounter(totalCountries: number): void {

    const counter = document.getElementById("travelCounter");
    const user = getLoggedInRegisteredUser();

    if (!counter) return;

    if (!user) {
        counter.innerHTML = `
            <div class="text-center">
                <div class="fw-bold">Because Not All Who Wander Are Lost 🌍</div>
                <div>Log in or register to track the countries you've explored.</div>
            </div>
        `;
        return;
    }

    const username = user.name;
    const visited = user.visitedCountries.length;

    const percent = totalCountries > 0
        ? ((visited / totalCountries) * 100).toFixed(1)
        : "0";

    counter.innerHTML = `
        <div class="text-center">
            <div>Welcome <strong>${username}</strong>!</div>
            <div>You’ve explored <strong>${visited}</strong> countries</div>
            <div><strong>${percent}%</strong> of the globe 🌍</div>
            <div class="mt-1">Where will your next adventure be? ✈️</div>
        </div>
    `;
}

// Recalculate counter based on currently rendered countries
function updateTravelCounterFromStoredCountries(): void {
    if (totalWorldCountries > 0) {
        renderTravelCounter(totalWorldCountries);
    }
}

// Show only visited countries in the grid
function showVisitedCountries(): void {
    const user = getLoggedInRegisteredUser();
    const container = getCountryFlagsContainer();

    if (!container) return;

    if (!user) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    Log in to view your visited countries.
                </div>
            </div>
        `;
        return;
    }

    const visitedNames = user.visitedCountries;

    if (visitedNames.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    You haven't marked any countries as visited yet.
                </div>
            </div>
        `;
        return;
    }

    // Load all countries to get the visited ones
    loadCountries()
        .then((countries: Country[]) => {
            const visitedCountries = countries.filter(country =>
                visitedNames.includes(country.name.common)
            );

            clearContainer(container);

            // Create visited countries section
            const visitedSection = document.createElement("div");
            visitedSection.classList.add("mb-4");

            const visitedHeading = document.createElement("h3");
            visitedHeading.textContent = "Countries Visited";
            visitedHeading.classList.add("text-success", "mb-3", "mt-3");
            visitedSection.appendChild(visitedHeading);

            const visitedContainer = document.createElement("div");
            visitedContainer.classList.add("row", "g-3");

            for (const country of visitedCountries) {
                const col = createCountryCard(country, async () => {
                    await navigateToCountryDetail(country.name.common);
                });
                col.classList.add("col-12", "col-md-6", "col-lg-3", "border", "rounded", "shadow-sm");
                visitedContainer.appendChild(col);
            }

            visitedSection.appendChild(visitedContainer);
            container.appendChild(visitedSection);
        })
        .catch(error => {
            console.error("Error fetching countries:", error);
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        Error loading visited countries.
                    </div>
                </div>
            `;
        });
}


// Render the "Visited" filter button dynamically
function renderVisitedFilter(): void {
    const container = document.getElementById("visitedFilterContainer");

    if (!container) return;

    const user = getLoggedInRegisteredUser();

    container.innerHTML = "";

    if (!user || user.visitedCountries.length === 0) {
        return;
    }

    let showingVisited = false;

    const button = document.createElement("button");
    button.classList.add("btn", "btn-outline-success", "btn-sm");
    button.textContent = `Visited (${user.visitedCountries.length})`;

    button.addEventListener("click", () => {
        showingVisited = !showingVisited;

        if (showingVisited) {
            button.textContent = "Show All";
            showVisitedCountries();
        } else {
            button.textContent = `Visited (${user.visitedCountries.length})`;
            getCountryInfo();
            renderVisitedFilter();
        }
    });

    container.appendChild(button);
}

// ====================================================================
//                       PHOTO UPLOADS + PREVIEWS
// ====================================================================

// Create the photo upload button for visited countries
function createPhotoUploadButton(country: Country): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("photo-upload-toggle", "btn", "btn-sm");
    button.innerHTML = `<i class="bi bi-camera-fill"></i>`;
    button.title = `Add photos for ${country.name.common}`;
    button.setAttribute("aria-label", `Add photos for ${country.name.common}`);

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        openPhotoPicker(country.name.common);
    });

    return button;
}

// Also create the journal icon
function createJournalButton(country: Country): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("journal-toggle", "btn", "btn-sm");
    button.innerHTML = `<i class="bi bi-pencil-fill"></i>`;
    button.title = `Journal about ${country.name.common}`;
    button.setAttribute("aria-label", `Journal about ${country.name.common}`);

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        openCountryMemoryModal(country.name.common);
    });

    return button;
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("File read failed"));

        reader.readAsDataURL(file);
    });
}

function openPhotoPicker(countryName: string): void {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Please log in to add travel photos.");
        return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.addEventListener("change", async () => {
        const files = input.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            const imageDataUrl = await fileToDataUrl(file);
            saveCountryPhoto(countryName, imageDataUrl);
        }

        alert(`Photo saved for ${countryName}`);
        getCountryInfo();
    });

    input.click();
}

function saveCountryPhoto(countryName: string, imageDataUrl: string): void {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const users = getRegisteredUsers();
    const user = users.find(
        u => u.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (!user) return;

    if (!user.countryPhotos) {
        user.countryPhotos = {};
    }

    if (!user.countryPhotos[countryName]) {
        user.countryPhotos[countryName] = [];
    }

    user.countryPhotos[countryName].push(imageDataUrl);

    saveRegisteredUsers(users);
}

function createCountryPhotoPreview(countryName: string): HTMLDivElement | null {
    const user = getLoggedInRegisteredUser();

    if (!user || !user.countryPhotos) return null;

    const photos = user.countryPhotos[countryName];
    if (!photos || photos.length === 0) return null;

    const firstPhoto = photos[0];
    if (!firstPhoto) return null;

    const wrapper = document.createElement("div");
    wrapper.classList.add(
        "w-100",
        "rounded",
        "overflow-hidden",
        "mt-2"
    );

    wrapper.style.aspectRatio = "4 / 3";
    wrapper.style.maxHeight = "180px";

    const img = document.createElement("img");
    img.src = firstPhoto;
    img.alt = `${countryName} travel photo`;

    img.classList.add("w-100", "h-100");
    img.style.objectFit = "cover";
    img.style.display = "block";

    wrapper.appendChild(img);
    return wrapper;
}

function getCountryPhotos(countryName: string): string[] {
    console.log("Maybe here?")
    const user = getLoggedInRegisteredUser();

    if (!user || !user.countryPhotos) return [];

    return user.countryPhotos[countryName] ?? [];
}

// Auto search logic
const suggestionsBox = document.getElementById("countrySuggestions") as HTMLElement | null;

let searchTimeout: number | undefined;

searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim();

    window.clearTimeout(searchTimeout);

    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = "";

    if (query.length < 2) return;

    searchTimeout = window.setTimeout(async () => {
        try {
            const countries = searchCountries(await loadCountries(), query);

            suggestionsBox.innerHTML = "";

            countries.slice(0, 8).forEach((country) => {
                const button = document.createElement("button");
                button.type = "button";
                button.classList.add(
                    "list-group-item",
                    "list-group-item-action",
                    "d-flex",
                    "align-items-center",
                    "gap-2"
                );

                button.innerHTML = `
                    <img src="${country.flags.svg}" alt="${country.name.common}" width="28">
                    <span>${country.name.common}</span>
                `;

                button.addEventListener("click", async () => {
                    searchInput.value = country.name.common;
                    suggestionsBox.innerHTML = "";
                    await getSearchCountry(country.name.common);
                });

                suggestionsBox.appendChild(button);
            });
        } catch (error) {
            console.error("Autocomplete error:", error);
            suggestionsBox.innerHTML = "";
        }
    }, 300);
});


// Navigate to a country detail view inside the single page app
async function navigateToCountryDetail(countryName: string): Promise<void> {
    removeHoverCard();
    await getSearchCountry(countryName);

    const newPage = document.getElementById("newLayout");
    newPage?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openCountryMemoryModal(countryName: string): void {
    const existing = document.getElementById("memoryModal");
    if (existing) {
        existing.remove();
    }

    const photos = getCountryPhotos(countryName);
    const journalText = getCountryJournal(countryName);

    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "memoryModal";
    modal.tabIndex = -1;

    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${countryName} Memories</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body">
                    <div class="mb-3">
                        <div class="row g-2" id="memoryGallery">
                            ${photos.length > 0
            ? photos.map(photo => `
                                    <div class="col-6 col-md-4">
                                        <img src="${photo}" class="img-fluid rounded border memory-thumb" alt="${countryName} memory">
                                    </div>
                                `).join("")
            : `<p class="text-muted">No photos uploaded yet.</p>`
        }
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="countryJournalInput" class="form-label fw-bold">Travel Journal</label>
                        <textarea
                            id="countryJournalInput"
                            class="form-control"
                            rows="5"
                            placeholder="Write about your experience in ${countryName}..."
                        >${journalText}</textarea>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" id="memoryUploadButton">Add Photo</button>
                    <button type="button" class="btn btn-primary" id="saveJournalButton">Save Journal</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalInstance = new (window as any).bootstrap.Modal(modal);
    modalInstance.show();

    const saveButton = document.getElementById("saveJournalButton");
    const uploadButton = document.getElementById("memoryUploadButton");
    const journalInput = document.getElementById("countryJournalInput") as HTMLTextAreaElement | null;

    saveButton?.addEventListener("click", () => {
        saveCountryJournal(countryName, journalInput?.value ?? "");
        modalInstance.hide();
    });

    uploadButton?.addEventListener("click", () => {
        openPhotoPicker(countryName);
        modalInstance.hide();
    });

    modal.addEventListener("hidden.bs.modal", () => {
        modal.remove();
    });
}
//======================================================
//               MAIN COUNTRIES CARD BUILDER
// =====================================================

// Create the country flag image wrapper
function createCountryImage(country: Country): HTMLDivElement {
    const imgWrapper = document.createElement("div");
    imgWrapper.classList.add("flag-wrapper");

    const img = document.createElement("img");
    img.src = country.flags.svg;
    img.alt = country.name.common;
    img.classList.add("flag-img");

    imgWrapper.appendChild(img);
    return imgWrapper;
}

function createCountryName(country: Country): HTMLHeadingElement {
    const name = document.createElement("h6");
    name.textContent = country.name.common;
    name.classList.add("mt-2", "fw-bold");
    return name;
}

function createCountryCapital(country: Country): HTMLParagraphElement {
    const capital = document.createElement("p");
    capital.textContent = `Capital: ${country.capital?.[0] ?? "N/A"}`;
    return capital;
}

function createCountryRegion(country: Country): HTMLParagraphElement {
    const region = document.createElement("p");
    region.textContent = `Region: ${country.region}`;
    return region;
}

function createCountryPopulation(country: Country): HTMLParagraphElement {
    const population = document.createElement("p");
    population.textContent = `Population: ${country.population.toLocaleString()}`;
    return population;
}

// Create the country name heading
function createCountryCard(
    country: Country,
    clickHandler: () => void | Promise<void>
): HTMLDivElement {
    const col = document.createElement("div");
    col.classList.add("country-card", "position-relative", "border", "rounded", "p-2", "shadow-sm");

    const currentUser = getCurrentUser();

    col.addEventListener("click", () => {
        const isVisited = isCountryVisited(country.name.common);
        const photos = getCountryPhotos(country.name.common);
        const journal = getCountryJournal(country.name.common).trim();

        if (isVisited && (photos.length > 0 || journal.length > 0)) {
            openCountryMemoryModal(country.name.common);
        } else {
            clickHandler();
        }
    });

    if (currentUser) {
        const visitedToggle = createVisitedToggle(country);
        col.appendChild(visitedToggle);
    }

    if (currentUser && isCountryVisited(country.name.common)) {
        const photoButton = createPhotoUploadButton(country);
        const journalButton = createJournalButton(country);
        col.appendChild(photoButton);
        col.appendChild(journalButton);
    }

    const img = createCountryImage(country);
    const name = createCountryName(country);
    const thumbnail = createCountryPhotoPreview(country.name.common);

    col.appendChild(img);
    col.appendChild(name);

    if (thumbnail) {
        col.appendChild(thumbnail);
        return col;
    }

    const capital = createCountryCapital(country);
    const region = createCountryRegion(country);
    const population = createCountryPopulation(country);

    col.appendChild(capital);
    col.appendChild(region);
    col.appendChild(population);

    return col;
}

function renderCountryCards(
    countryList: Country[],
    clickHandlerBuilder: (country: Country) => () => void | Promise<void>
): void {
    const container = getCountryFlagsContainer();

    if (!container) return;

    clearContainer(container);

    // Separate countries into visited and unvisited
    const visitedCountries: Country[] = [];
    const unvisitedCountries: Country[] = [];

    for (const country of countryList) {
        if (isCountryVisited(country.name.common)) {
            visitedCountries.push(country);
        } else {
            unvisitedCountries.push(country);
        }
    }

    // Create visited countries section
    if (visitedCountries.length > 0) {
        const visitedSection = document.createElement("div");
        visitedSection.classList.add("mb-4");

        const visitedHeading = document.createElement("h3");
        visitedHeading.textContent = "Countries Visited";
        visitedHeading.classList.add("text-success", "mb-3", "mt-3");
        visitedSection.appendChild(visitedHeading);

        const visitedContainer = document.createElement("div");
        visitedContainer.classList.add("row", "g-3");

        for (const country of visitedCountries) {
            const col = createCountryCard(country, clickHandlerBuilder(country));
            col.classList.add("col-12", "col-md-6", "col-lg-3", "border", "rounded", "shadow-sm");
            visitedContainer.appendChild(col);
        }

        visitedSection.appendChild(visitedContainer);
        container.appendChild(visitedSection);
    }

    // Create unvisited countries section
    if (unvisitedCountries.length > 0) {
        const unvisitedSection = document.createElement("div");
        unvisitedSection.classList.add("mb-4");

        const unvisitedHeading = document.createElement("h3");
        unvisitedHeading.textContent = "Explore Next";
        unvisitedHeading.classList.add("text-primary", "mb-3", "mt-3");
        unvisitedSection.appendChild(unvisitedHeading);

        const unvisitedContainer = document.createElement("div");
        unvisitedContainer.classList.add("row", "g-3");

        for (const country of unvisitedCountries) {
            const col = createCountryCard(country, clickHandlerBuilder(country));
            col.classList.add("col-12", "col-md-6", "col-lg-3", "border", "rounded", "shadow-sm");
            unvisitedContainer.appendChild(col);
        }

        unvisitedSection.appendChild(unvisitedContainer);
        container.appendChild(unvisitedSection);
    }
}
// ===================================================================================
//                       SEARCH & INFORMATION PAGE LAYOUT BUILDER
// ====================================================================================

// Create back button for returning to main layout
function createBackButton(homePage: HTMLElement, newPage: HTMLElement): HTMLDivElement {
    const backButton = document.createElement("div");
    backButton.textContent = "← Back";
    backButton.classList.add("back-btn", "btn", "btn-outline-secondary", "mb-3", "d-inline-block");

    backButton.addEventListener("click", async () => {
        newPage.classList.add("d-none");
        homePage.classList.remove("d-none");
    });

    return backButton;
}


// Create left column with the country flag
function createSearchLeftColumn(searchedCountry: Country): HTMLDivElement {
    const leftCol = document.createElement("div");
    leftCol.classList.add(
        "col-12",
        "col-lg-6",
        "d-flex",
        "justify-content-center",
        "align-items-center",
        "position-relative"
    );

    const img = document.createElement("img");
    img.src = searchedCountry.flags.svg;
    img.alt = searchedCountry.name.common;
    img.classList.add("flag-img", "border", "rounded");
    img.style.objectFit = "cover";

    leftCol.appendChild(img);

    const currentUser = getCurrentUser();
    if (currentUser) {
        const visitedToggle = createVisitedToggle(searchedCountry);
        leftCol.appendChild(visitedToggle);

        if (isCountryVisited(searchedCountry.name.common)) {
            const photoButton = createPhotoUploadButton(searchedCountry);
            leftCol.appendChild(photoButton);

            const journalButton = createJournalButton(searchedCountry);
            leftCol.appendChild(journalButton);
        }
    }

    return leftCol;
}

// Create top-right detail column
function createTopRightDetails(searchedCountry: Country): HTMLDivElement {
    const topRight = document.createElement("div");
    topRight.classList.add("col-6", "p-3");

    const tld = document.createElement("p");
    tld.textContent = `Top Level Domain: ${searchedCountry.tld?.join(", ") ?? "N/A"}`;

    const currencies = document.createElement("p");
    const currencyList = searchedCountry.currencies
        ? Object.values(searchedCountry.currencies)
            .map((currency) => currency.name)
            .join(", ")
        : "N/A";
    currencies.textContent = `Currencies: ${currencyList}`;

    const languages = document.createElement("p");
    const languageList = searchedCountry.languages
        ? Object.values(searchedCountry.languages).join(", ")
        : "N/A";
    languages.textContent = `Languages: ${languageList}`;

    topRight.appendChild(tld);
    topRight.appendChild(currencies);
    topRight.appendChild(languages);

    return topRight;
}


// Create the top section of the detail layout
function createSearchTopSection(searchedCountry: Country): HTMLDivElement {
    const topSection = document.createElement("div");
    topSection.classList.add("p-3");
    topSection.style.flex = "2";

    const topRow = document.createElement("div");
    topRow.classList.add("row", "g-3", "h-100");

    const topLeft = createTopLeftDetails(searchedCountry);
    const topRight = createTopRightDetails(searchedCountry);

    topRow.appendChild(topLeft);
    topRow.appendChild(topRight);
    topSection.appendChild(topRow);

    return topSection;
}

// Create top left sectiom of the detail layout
function createTopLeftDetails(searchedCountry: Country): HTMLDivElement {
    const topLeft = document.createElement("div");
    topLeft.classList.add("col-12", "col-lg-6", "p-3");

    const countryName = document.createElement("h4");
    countryName.textContent = searchedCountry.name.common;

    const nativeName = document.createElement("p");
    nativeName.textContent = `Native Name: ${getNativeName(searchedCountry)}`;

    const population = document.createElement("p");
    population.textContent = `Population: ${searchedCountry.population.toLocaleString()}`;

    const region = document.createElement("p");
    region.textContent = `Region: ${searchedCountry.region}`;

    const subRegion = document.createElement("p");
    subRegion.textContent = `Sub-region: ${searchedCountry.subregion ?? "N/A"}`;

    const capital = document.createElement("p");
    capital.textContent = `Capital: ${searchedCountry.capital?.[0] ?? "N/A"}`;

    topLeft.appendChild(countryName);
    topLeft.appendChild(nativeName);
    topLeft.appendChild(population);
    topLeft.appendChild(region);
    topLeft.appendChild(subRegion);
    topLeft.appendChild(capital);

    return topLeft;
}

// Create bottom section shell for border countries
function createBottomSectionShell(): {
    bottomSection: HTMLDivElement;
    borderWrap: HTMLDivElement;
} {
    const bottomSection = document.createElement("div");
    bottomSection.classList.add("p-3");
    bottomSection.style.flex = "1";

    const borderTitle = document.createElement("p");
    borderTitle.classList.add("fw-bold", "mb-2");
    borderTitle.textContent = "Border Countries:";

    const borderWrap = document.createElement("div");
    borderWrap.classList.add("d-flex", "flex-wrap", "gap-2", "position-relative");

    bottomSection.appendChild(borderTitle);
    bottomSection.appendChild(borderWrap);

    return { bottomSection, borderWrap };
}


// Create a border-country button
function createBorderCountryButton(country: { name: { common: string } }): HTMLButtonElement {
    const borderItem = document.createElement("button");
    borderItem.type = "button";
    borderItem.textContent = country.name.common;
    borderItem.classList.add("border-country-btn", "btn", "btn-outline-primary", "btn-sm");

    borderItem.addEventListener("mouseenter", async () => {
        await showBorderCountryHover(country.name.common, borderItem);
    });

    borderItem.addEventListener("mouseleave", () => {
        removeHoverCard();
    });

    borderItem.addEventListener("click", async (event) => {
        event.stopPropagation();

        await navigateToCountryDetail(country.name.common);
    });

    return borderItem;
}

// Fetch and render border countries
async function renderBorderCountries(
    searchedCountry: Country,
    borderWrap: HTMLDivElement
): Promise<void> {
    if (searchedCountry.borders && searchedCountry.borders.length > 0) {
        const borderCodes = new Set(searchedCountry.borders);
        const borderData = (await loadCountries()).filter((country) =>
            borderCodes.has(country.cca3)
        );

        borderData.forEach((country) => {
            const borderItem = createBorderCountryButton(country);
            borderWrap.appendChild(borderItem);
        });
    } else {
        const noBorders = document.createElement("span");
        noBorders.textContent = "None";
        borderWrap.appendChild(noBorders);
    }
}


// Create bottom section of detail layout
async function createSearchBottomSection(searchedCountry: Country): Promise<HTMLDivElement> {
    const { bottomSection, borderWrap } = createBottomSectionShell();
    await renderBorderCountries(searchedCountry, borderWrap);
    return bottomSection;
}


// Create right-hand detail column
async function createSearchRightColumn(searchedCountry: Country): Promise<HTMLDivElement> {
    const rightCol = document.createElement("div");
    rightCol.classList.add("col-12", "col-md-6");

    const rightColInner = document.createElement("div");
    rightColInner.classList.add("d-flex", "flex-column", "h-100", "gap-3");

    const topSection = createSearchTopSection(searchedCountry);
    const bottomSection = await createSearchBottomSection(searchedCountry);

    rightColInner.appendChild(topSection);
    rightColInner.appendChild(bottomSection);
    rightCol.appendChild(rightColInner);

    return rightCol;
}

// Render the full search/detail layout
export async function renderSearchCountryLayout(
    searchedCountry: Country,
    homePage: HTMLElement,
    newPage: HTMLElement
): Promise<void> {
    newPage.innerHTML = "";

    const container = document.createElement("div");
    container.classList.add("container", "py-3");

    if (document.getElementById("countryFlags")) {
        const backButton = createBackButton(homePage, newPage);
        container.appendChild(backButton);
    }

    const outerRow = document.createElement("div");
    outerRow.classList.add("row", "g-3", "align-items-stretch");

    const leftCol = createSearchLeftColumn(searchedCountry);
    const rightCol = await createSearchRightColumn(searchedCountry);

    outerRow.appendChild(leftCol);
    outerRow.appendChild(rightCol);

    container.appendChild(outerRow);
    newPage.appendChild(container);
}

// ==================================================================
//                       HOVER CARD BEHAVIOR
// ==================================================================

// Track the currently active hover card
let activeHoverCard: HTMLDivElement | null = null;

// Remove any existing hover card from the DOM
function removeHoverCard(): void {
    if (activeHoverCard) {
        activeHoverCard.remove();
        activeHoverCard = null;
    }
}

// Show hover card with country preview info
async function showBorderCountryHover(
    countryName: string,
    anchor: HTMLElement
): Promise<void> {
    removeHoverCard();

    try {
        const country = findCountryByName(await loadCountries(), countryName);

        if (!country) return;

        const hoverCard = document.createElement("div");
        hoverCard.classList.add("country-hover-card");

        hoverCard.innerHTML = `
            <div class="fw-bold mb-2">${country.name.common}</div>
            <img src="${country.flags.svg}" alt="${country.name.common}" class="mb-2 border rounded">
            <p class="mb-1"><strong>Capital:</strong> ${country.capital?.[0] ?? "N/A"}</p>
            <p class="mb-1"><strong>Region:</strong> ${country.region}</p>
            <p class="mb-0"><strong>Population:</strong> ${country.population.toLocaleString()}</p>
        `;

        // Position relative to parent container
        const parent = anchor.parentElement;
        if (!parent) return;

        parent.appendChild(hoverCard);

        hoverCard.style.position = "absolute";
        hoverCard.style.top = "calc(100% + 8px)";
        hoverCard.style.left = "0";

        activeHoverCard = hoverCard;

    } catch (error) {
        console.error("Hover card error:", error);
    }
}


// ===================================================================
//                              THEME LOGIC
// ===================================================================

// Theme options
type Theme = "dark" | "light";

// Logo paths for each theme
const logos: Record<Theme, string> = {
    dark: "./images/DarkLogo.png",
    light: "./images/WhiteLogo.png"
};

// Apply selected theme and matching logo
function applyTheme(theme: Theme): void {
    root.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);

    if (themeToggle) {
        themeToggle.checked = theme === "dark";
    }

    if (logo) {
        logo.src = logos[theme];
    }
}

// =============================================================
//               DATA FETCHING AND EVENT HANDLERS
// ==============================================================

// Handle dropdown filter changes
async function handleChange(event: Event): Promise<void> {
    const selectedRegion = filterDD?.value;

    if (!selectedRegion) {
        await getCountryInfo();
        return;
    }

    if (selectedRegion === "visited") {
        showVisitedCountries();
        return;
    }

    const result = (await loadCountries()).filter((country) =>
        normalizeCountryValue(country.region) === normalizeCountryValue(selectedRegion)
    );

    renderCountryCards(result, (country: Country) => {
        return async () => {
            await navigateToCountryDetail(country.name.common);
        };
    });
}


// Handle search form submission
async function handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    clearCountryError();

    const searchValue = searchInput?.value.trim();

    if (!searchValue) {
        console.log("No input provided");
        return;
    }

    console.log("Searching for:", searchValue);

    await getSearchCountry(searchValue);
}


// Fetch and render all countries on the main page
async function getCountryInfo(): Promise<void> {
    console.log("STEP 1: getCountryInfo started");

    const result = await loadCountries();

    totalWorldCountries = result.length;

 renderCountryCards(result, (country: Country) => {
    return async () => {
        await navigateToCountryDetail(country.name.common);
    };
});

    renderTravelCounter(totalWorldCountries);
    renderVisitedWorldMap(result);
}

// Fetch a single searched country and render the detail layout
export async function getSearchCountry(name: string): Promise<void> {
    try {
        const searchedCountry = findCountryByName(await loadCountries(), name);

        const homePage = document.getElementById("onLoadLayout");
        const newPage = document.getElementById("newLayout");

        if (!searchedCountry) {
            throw new Error("Country not found");
        }

        if (!homePage || !newPage) return;

        homePage.classList.add("d-none");
        newPage.classList.remove("d-none");

        await renderSearchCountryLayout(searchedCountry, homePage, newPage);
    } catch (error) {
        console.log("Search error:", error);
        showErrorMessage(
            "Country not found. Please ensure you are typing the name of an actual country."
        );
    }
}


// Render an error message inside the country container
function showErrorMessage(message: string): void {
    const container = document.getElementById("countryFlags");

    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger text-center">
                ${message}
            </div>
        </div>
    `;
}

// ===================================================================
//           APP STARTUP / INITIALIZATION
// ====================================================================

// Load saved theme or default to light
const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
applyTheme(savedTheme);


// Theme toggle listener
if (themeToggle) {
    themeToggle.addEventListener("change", () => {
        const newTheme: Theme = themeToggle.checked ? "dark" : "light";
        applyTheme(newTheme);
    });
}

// Clear error message if input is corrected
searchInput?.addEventListener("input", clearCountryError);

// Filter dropdown listener
filterDD?.addEventListener("change", handleChange);


// Search form listener
searchForm?.addEventListener("submit", handleSubmit);


// Initialize app state
initAuth();
updateSearchPlaceholder();
getCountryInfo().catch((error) => {
    console.error("Country data error:", error);
    showErrorMessage("Country data could not be loaded. Please refresh and try again.");
});
renderVisitedFilter();

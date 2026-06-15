Frontend Mentor - REST Countries API with Color Theme Switcher Solution

This is my adaptation of the REST Countries API with color theme switcher challenge on Frontend Mentor. I used this project to get more comfortable working with APIs, and building a clean, responsive UI.  While it was designed as a heavy in JavaScript challenge, I decided to challenge myself further and implement it with TypeScript.

Overview:
We were tasked with making an app meeting the following requirements:
See all countries from the API on the homepage
Search for a country using an input field
Filter countries by region
Click on a country to see more detailed information
Click through to border countries
Toggle between light and dark mode
This submission meets requirements to be an MVP.  The adaptation to the challenge, was my attempt to convert this REST API into a travel journal requiring additional implementation and a bit more extensive use of localStorage.

Screenshot
![REST Countries API application displaying a grid of country cards with flags, names, and statistics on a light-themed interface. The layout shows multiple country entries with flag images on the left and country information including population and region on the right. A search bar and region filter dropdown are visible at the top of the page, demonstrating the responsive design across desktop view.](images/Screenshot%202026-04-13%20at%203.42.38%20AM.png)

Links
Live Site URL: TBD

Built With
Semantic HTML5 markup
CSS custom properties
Bootstrap 5
Mobile-first workflow
TypeScript
Styled Components

Country Data
REST Countries deprecated the unauthenticated v3.1 API in June 2026. Because
this is a static browser application and v5 API keys must not be committed to
client-side code, the app now uses a local snapshot of the project's
[open-source v3.1 dataset](https://gitlab.com/restcountries/restcountries/-/blob/master/src/main/resources/countriesV3.1.json).
Searches, region filters, and border-country lookups run against that cached
snapshot in the browser.

What I Learned
This project allowed me to deepen my understanding in several key areas. I gained hands-on experience working with API data, learning how to manage it effectively through structured error handling with try-catch blocks. I also strengthened my proficiency in TypeScript, using it to introduce greater structure, catch errors earlier, and more confidently interpret compiler feedback during debugging.
In addition, I developed dynamic routing elements through DOM manipulation and began to appreciate the value of modularized code in building scalable and maintainable applications. While my implementation is not a perfect example of well-modularized code, the experience made it clear how much cleaner and more manageable the project would have been with stronger modularization from the start. Without taking the time to at least reorganize the code with clear sections and headers, it would have been far more difficult to read and follow.
I also focused on creating a responsive layout that delivers a seamless experience across a variety of screen sizes.
An unexpected but valuable discovery was the power of embedded SVG code. It gave me the ability to fine-tune visual elements with precision—especially when small alignment details weren’t quite right. As someone who notices even the slightest misalignment, having another tool to make those precise adjustments has been incredibly rewarding.


interface Country{
  name: {
        common: string;
        official: string;
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


Future Features
This application is still very much a work in progress, with significant opportunities for continued development and refinement. Looking ahead, I envision expanding the detailed country cards to include richer, more engaging content—potentially by integrating additional APIs that provide fun facts, cultural insights, or images of famous landmarks for each country. I would also like to incorporate a dedicated photo gallery and enhance the overall depth of information available for each destination.
There are also some functional improvements to address, including resolving a few logic issues that currently impact the accuracy of the travel counter. From a user experience standpoint, I plan to ensure that all images—both thumbnails and flags—are dynamically resized to fit their containers while preserving their full visibility within the viewing window.
Beyond technical enhancements, I see strong potential to evolve this into a more interactive and community-driven experience. I would like to make the app shareable among users, creating a “Wanderluster” community where individuals can track and compare their travel journeys. Introducing gamification elements—such as explorer titles or achievement tiers based on the percentage of the world a user has visited—could add a fun and motivating dimension to the app.
On a personal development level, I aim to continue strengthening my proficiency in TypeScript until I reach true fluency. As I take on more complex projects, I recognize the importance of improving how I structure and modularize code, as well as how I manage application state. Building these skills will allow me to create more scalable, maintainable, and robust applications moving forward.

Useful Resources
https://www.typescriptlang.org/docs/
https://styled-components.com/docs

Author
Name: Fabiola Aurelien

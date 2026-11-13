# EduMetrics — Automated Teacher Grade & Analytics Web Dashboard

A modular, vanilla JavaScript web application designed to help educators manage student grades, calculate performance metrics, and visualize classroom analytics in real time, featuring a decoupled multi-file architecture optimized for 100% JavaScript language detection on GitHub.

## Features

- **Modular Core Logic:** Pure JavaScript calculation and data management engines (`core.js`, `grades.js`) handling grade distributions, averages, and student performance metrics.
- **Dynamic DOM Rendering:** Responsive interface updates and component rendering (`render.js`, `app.js`) backed by clean markup (`index.html`) and styling (`styles.css`).
- **Language-Optimized Repository:** Configured with `.gitattributes` to exclude structural HTML and CSS from GitHub's Linguist statistics, maintaining a clean 100% JavaScript repository profile.

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 Modules), HTML5, CSS3
- **Data & State Management:** Client-side JavaScript modules

## Project Structure

```text
EduMetrics/
├── .gitattributes
├── index.html
├── styles.css
└── js/
    ├── app.js
    ├── core.js
    ├── grades.js
    └── render.js

<div align="center">
  <h1 style="display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; letter-spacing: 0.5px;">
    <img src="https://raw.githubusercontent.com/savvan0h/oura-profile-cards/main/images/ring.png" alt="Oura Ring" width="50" style="margin-right: 12px;" />
    Oura Profile Cards
  </h1>
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/github/license/savvan0h/oura-profile-cards?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/made%20with-Typescript-blue?style=flat-square" alt="Made with Typescript" />
  <img src="https://img.shields.io/badge/API-Oura-6A00F4?style=flat-square" alt="Oura API" />
  <p>
    <strong>Oura Profile Cards</strong> is a GitHub Action that generates SVG cards (e.g., a weekly readiness chart) using data collected by the <a href="https://ouraring.com/">Oura Ring</a>. These cards allow you to showcase your health metrics and insights on your GitHub profile.
  </p>
</div>

> [!Note]
> You must have an Oura Ring and a valid API token to use this action. Learn more about the Oura API [here](https://cloud.ouraring.com/docs).

## Available Cards

### Weekly Readiness Card

The Weekly Readiness card displays your Oura Ring readiness scores over the past 7 days with threshold indicators for optimal, good, and fair readiness levels.

![Weekly Readiness Card](images/weekly-readiness-card.svg)

## Usage

### Setup

1. **Create a workflow file** in your repository (e.g., `.github/workflows/oura-profile-cards.yml`) with the following content:

```yaml
name: Oura Profile Cards

on:
  schedule:
    - cron: '0 0 * * *' # Run every 24 hours
  workflow_dispatch: # Allow manual triggering

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: savvan0h/oura-profile-cards@v0.1.0
        with:
          OURA_API_TOKEN: ${{ secrets.OURA_API_TOKEN }}
```

2. **Add your Oura API token** as a repository secret:
   - Go to your repository's [Settings] > [Secrets and variables] > [Actions]
   - Create a new secret named `OURA_API_TOKEN` with your [personal access token](https://cloud.ouraring.com/personal-access-tokens)

### Using Generated Cards

The action automatically:

1. Fetches your latest Oura Ring data
2. Generates SVG charts in the `oura-profile-card-output` directory
3. Commits and pushes these files to your repository

To display a card in your GitHub profile README, use the following Markdown syntax:

```markdown
![My Oura Weekly Readiness](https://raw.githubusercontent.com/YOUR-USERNAME/YOUR-REPO/main/oura-profile-card-output/weekly-readiness-card.svg)
```

For a live example, see [@savvan0h's profile](https://github.com/savvan0h).

## Troubleshooting

If your cards aren't generating:

- Check that your workflow is running properly in the Actions tab
- Verify your Oura API token is correct
- Make sure your Oura Ring is synced and providing data

## License

This project is MIT licensed. Feel free to use, modify, and distribute it.

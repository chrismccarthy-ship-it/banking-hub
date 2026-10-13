# Banking Hub

Multi-brand retail and commercial banking demo for Salesforce Experience Cloud: a hub plus five flows (account opening, loans, business onboarding, payment channels, international wires), built as Lightning Web Components with live calls to a Postman mock through a Named Credential.

- `force-app/` — components, Apex gateway, Named Credential, permission set and, once retrieved, the Experience Cloud site.
- `docs/experience-site-setup.md` — create the Build Your Own (LWR) site, add the Help and messaging pages, set up the demo customer login, and pull the site into this repo.
- `scripts/deploy.ps1 -Org <alias>` — deploy everything, assign the permission set and publish the site.
- `scripts/retrieve-site.ps1 -Org <alias>` — pull the site metadata into `force-app` after creating it in an org.

Demo guide and talk tracks live in the Claude doc "Banking Hub Demo Flow Guide and Talk Tracks".

# Banking Hub site setup (Build Your Own LWR)

The Banking Hub runs on a **Build Your Own (LWR)** Experience Cloud site. The site is created once by hand, then pulled into this repo with `scripts/retrieve-site.ps1` so later orgs get it from `scripts/deploy.ps1`.

Why LWR: the hub is seven custom LWCs calling Apex, which is what BYO (LWR) is built for. Agentforce (Embedded Messaging), Knowledge components and Search are all available on LWR. The trade-off is that LWR sites are frozen at publish, so every component change needs a publish; the deploy script does that.

## 0. Before you start

- Deploy the code first: `.\scripts\deploy.ps1 -Org <alias>` (it skips publishing until the site exists).
- **Setup → Digital Experiences → Settings**: Enable Digital Experiences if the org hasn't, with a domain such as `<org>.my.site.com`.
- For Agentforce: the org needs Agentforce enabled and an Agentforce Service Agent already built (Setup → Agentforce Agents). The site only embeds it.
- For Knowledge: Lightning Knowledge enabled with at least a few published, public articles in a data category.

## 1. Create the site

Setup → Digital Experiences → All Sites → **New** → **Build Your Own (LWR)**.

| Field | Value |
|---|---|
| Name | `Banking Hub` |
| URL suffix | `bankinghub` |

Keep the name exact; the scripts and the Network metadata use it.

## 2. Home page: the hub

Open **Builder** on the new site.

1. On **Home**, remove the sample content.
2. Components panel → **Custom Components** → drag **Banking Hub** into the content region. If it's missing, turn on *Show all components* in the panel settings (Builder resets this each session).
3. In the component's property panel set:
   - **Default Bank Brand** to the bank you demo most.
   - **Greeting Name** (for example `Priya`) when the page isn't on a Contact.
   - **Show Demo Controls** on for rehearsal, off before sharing a screen (Ctrl+Shift+B hides it live).
4. **Theme** (paint-brush icon): set the brand colour and font so the site chrome matches the hub. The hub's own colours come from its brand config, not the theme.

## 3. Help page: Knowledge and search

1. **Pages** → **+ New Page** → **Standard Page** → **Blank** → name `Help`, URL `help`.
2. Drag in a **Search Bar** at the top and a **Knowledge Article List** below it. In the list's properties, pick the data category group and category your articles use.
3. **Pages** → open the standard **Search** page and confirm it has **Search Bar** and **Results Layout**. This is the page the Search Bar sends people to.
4. Add **Help** to the navigation menu (**Settings → Navigation**, or edit the header's Navigation Menu component).

Knowledge Article List is Beta on LWR and is category-driven; there is no Topics or Case Deflection component on LWR. If the demo needs topic navigation, that is the one reason to consider an Aura Help Center instead.

## 4. Agentforce Service Agent: Embedded Messaging

In Setup, once per org:

1. **Messaging Settings** → New Channel → **Messaging for In-App and Web** → name `Banking Hub Web`. Activate it.
2. **Embedded Service Deployments** → New → **Messaging for In-App and Web** → **Experience Cloud site** → name `Banking Hub`, choose the `Banking Hub` site and the `Banking Hub Web` channel. Publish the deployment.
3. **Omni-Channel Flows**: the channel's routing flow must **Route Work → to Agentforce Service Agent** (the standard template does this; pick your agent). Activate the agent.
4. **CORS** and **Trusted URLs**: add the site's URL (`https://<org>.my.site.com`) to both. Chat silently fails to load without this.

Back in Builder:

5. **Settings → Advanced** (or the theme's footer region): drag the **Embedded Messaging** component into the footer so it appears on every page. Pick the `Banking Hub` deployment.
6. Guest visitors see the chat button unless the channel has **user verification** on. For a public demo, leave verification off.

Known issue to check before a demo: on custom domains the chat window sometimes opens blank until the Trusted URL entry is saved with *Connect source* checked.

## 5. Guest access to the APIs

Guest users must be able to run `BankingIntegrationService`, or every number falls back to **Demo data**.

Builder → **Settings → General** → click the **Guest User Profile** link, then on the profile:

- **Enabled Apex Class Access** → add `BankingIntegrationService`, **or**
- **Permission Set Assignments** → add **Banking Hub Integration** (same effect, kept in sync by the repo).

Leave **Allow guest users to access public APIs** off; it doesn't gate Apex on LWR and isn't needed.

If the hub is behind login instead, assign the permission set to the member profile or user. `deploy.ps1` already assigns it to the user running the script.

## 6. Publish and verify

1. Builder → **Publish**. Each later `deploy.ps1` run republishes automatically.
2. Open `https://<org>.my.site.com/bankinghub` in a private window (guest view).
3. Under the FICO score, the chip should read **Live via API · n ms**. **Demo data** means step 5 or the org can't reach `*.mock.pstmn.io` (Setup → Remote Site Settings isn't needed with a Named Credential, so check the guest profile first).
4. Open Help, search for an article; open the chat button and confirm the agent answers.

## 7. Put the site in the repo

```powershell
.\scripts\retrieve-site.ps1 -Org <alias>
git add force-app
git commit -m "Add the Banking Hub LWR site"
```

This pulls `DigitalExperienceBundle`, `DigitalExperienceConfig`, `Network` and `CustomSite`. Before committing, open `force-app/main/default/networks/Banking Hub.network-meta.xml` and check `emailSenderAddress` is an address that exists in every target org, since a bad value fails the deploy.

Messaging metadata is optional to retrieve (`EmbeddedServiceConfig`, `MessagingChannel`); the agent itself and the Omni-Channel flow are org-specific and are set up by hand per org.

## Deploying to a new org

```powershell
sf org login web --alias newOrg
.\scripts\deploy.ps1 -Org newOrg
```

Then repeat steps 4 (messaging, if wanted) and 5 (guest profile) in that org, because profile edits and messaging deployments don't travel with the site metadata.

## Gotchas specific to LWR

- Every LWC, custom label, message channel or Apex signature change needs a publish. `deploy.ps1` does it; if you deploy by hand, run `sf community publish --name "Banking Hub"`.
- Lightning Web Security blocks `window.location`, `document.location` and `window.top`. The hub uses `lightning/navigation` only.
- `ShowToastEvent` doesn't fire on LWR; the hub uses inline notices instead.
- Flows with Aura screen components or local actions (Navigate Everywhere, Open URL) break on LWR. The hub has no Flows today.
- Dev and Dev Pro sandboxes can't publish sites with asset files; use a Partial, Full, scratch org or the SDO.

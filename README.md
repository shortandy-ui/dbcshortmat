# Datchworth Short Mat Bowls League

The website itself (in `src/`) plus a small backend (`api/`) that gives it
somewhere to store data online, so admin, team leaders, and visitors all see
the same up-to-date league table from their own computer or phone.

You've already been through this process once for the Hatfield Indoor Bowls
site, so the steps below are the same shape — just repeated for this second,
separate app. It gets its **own GitHub repository** and its **own Azure
Static Web App**, so the two leagues stay completely independent.

---

## Part 1 — Put the code on GitHub

1. Go to [github.com](https://github.com) and create a **new repository** —
   e.g. `datchworth-short-mat-bowls`. Leave it empty (no README, no
   .gitignore — this project already has one).
2. On the repository's page, click **uploading an existing file**.
3. Unzip the file you were given, and drag in its **contents** (the `src`,
   `api`, `.github` folders and the loose files like `package.json`) — not
   the outer folder itself.
4. Commit the changes.

One thing to check afterward: confirm the `.github` folder made it into the
upload (some browsers hide dot-folders during drag-and-drop) — if it's
missing, upload that folder separately.

---

## Part 2 — Create the Azure Static Web App

1. In the [Azure Portal](https://portal.azure.com), **Create a resource** →
   **Static Web App** → **Create**.
2. Basics:
   - **Resource Group**: you can reuse the one from the Hatfield app, or
     create a new one (e.g. `datchworth-bowls-rg`) — either is fine, a
     resource group is just a folder.
   - **Name**: `datchworth-short-mat-bowls`.
   - **Plan type**: **Free**.
   - **Region**: same one you used before.
3. **Deployment details**: GitHub → sign in → pick this new repository →
   branch `main`.
4. **Build Details**:
   - **Build Presets**: React
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: `dist`

   ⚠️ This is the setting that caused the build to fail last time for the
   other app — Vite outputs to `dist`, not `build`. Double-check it says
   `dist` before continuing.
5. **Review + create** → **Create**.

Azure adds a workflow file to the repo and starts building automatically —
watch progress under the **Actions** tab on GitHub. Once it's green, the
**URL** on the Static Web App resource is your live site.

---

## Part 3 — Storage for the league data

You can either **reuse the same Azure Storage Account** you created for the
Hatfield app, or create a fresh one — both work, because this app's backend
saves its data under a differently-named container (`datchworth-data`) so
the two won't collide even sharing one account.

### Option A — reuse your existing storage account
1. Open that storage account → **Access keys** → **Show** on `key1` → copy
   the **Connection string**.
2. Go to this new Static Web App → **Configuration** → **+ Add**:
   - Name: `AZURE_STORAGE_CONNECTION_STRING`
   - Value: paste the connection string
3. **Save**.

### Option B — create a new storage account
1. **Create a resource** → **Storage account** → same resource group and
   region as above, any all-lowercase name, **Locally-redundant storage
   (LRS)**.
2. Once created: **Access keys** → **Show** on `key1` → copy the
   **Connection string**.
3. Add it to the Static Web App's **Configuration** the same way as Option A.

Either way, give it a minute or two after saving for the setting to take
effect.

---

## Part 4 — Try it out

Open the site's URL. Sign in as **Admin** with password `skip` to set the
league format (4 or 8 teams), team names, season calendar, and generate
fixtures. There's no password for the **Team leader** view — it's open for
anyone to enter scores.

---

## Updating the site later

Edit the files and re-upload them to GitHub the same way as Part 1 — Azure
rebuilds and redeploys automatically within a couple of minutes.

---

## A note on the admin password

`skip` is a simple password built into the app's code, not a real user
account — anyone who inspects the site's source could find it. That's an
intentional trade-off to keep this app simple and free to run. It keeps
casual visitors out of the admin screens but isn't strong security, so don't
rely on it for anything more sensitive than a fixture list.

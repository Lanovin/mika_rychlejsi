# Administrace vozů

## Přihlášení

Přihlášení do administrace je dostupné na `/admin/login`.

Přihlašovací údaje se berou **výhradně z proměnných prostředí** – v kódu není
uložené žádné konkrétní heslo:

- `ADMIN_LOGIN` – přihlašovací jméno
- `ADMIN_PASSWORD` – heslo
- `AUTH_SESSION_SECRET` – tajný klíč pro podpis přihlašovací cookie

Dokud nejsou nastavené **obě** proměnné `ADMIN_LOGIN` i `ADMIN_PASSWORD`,
je přihlášení vypnuté (nelze se přihlásit). Po přihlášení se zpřístupní `/admin`.

### Lokálně
Nastavte proměnné v `.env.local` podle vzoru v `.env.example` / `.env.local.example`.

### Na Vercelu
V Project → Settings → Environment Variables přidejte `ADMIN_LOGIN`,
`ADMIN_PASSWORD` a `AUTH_SESSION_SECRET`. **Po každé změně je nutný Redeploy**
(Deployments → ⋯ → Redeploy) – samotná změna proměnné se na běžící verzi
neprojeví. Push na GitHub k tomu potřeba není.

## Co klient zvládne z administrace

- přidat nový vůz
- upravit cenu, parametry a popis
- nahrát hlavní fotku i další galerii
- skrýt vůz z veřejné nabídky bez smazání
- zvýraznit vůz na domovské stránce
- smazat neaktuální inzerát

## Uložení dat

Vozy jsou uložené v `data/inventory.json`.
Nahrané obrázky se ukládají do `public/uploads/vehicles`.

## Poznámka k hostingu

Tato administrace zapisuje data a obrázky do souborů na serveru. Je vhodná pro klasický Node.js hosting nebo VPS s trvalým diskem. Pro čistě serverless hosting bez trvalého úložiště je vhodnější přejít na databázi a object storage.

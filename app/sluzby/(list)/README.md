Route group `(list)` – v URL se neprojeví, stránka je pořád `/sluzby`.

Je tu proto, aby se `loading.tsx` seznamu vztahoval jen na seznam. V App
Routeru totiž `app/sluzby/loading.tsx` obaluje i vnořený `/sluzby/[slug]`, a
protože se odpověď streamuje, odejde hlavička 200 dřív, než detail stihne
zavolat `notFound()`. Neexistující služba pak vracel „soft 404" – stránku
„nenalezeno" se stavem 200, kterou Google indexoval jako živou.

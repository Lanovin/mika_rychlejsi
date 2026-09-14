Route group `(list)` – v URL se neprojeví, stránka je pořád `/vozy`.

Je tu proto, aby se `loading.tsx` seznamu vztahoval jen na seznam. V App
Routeru totiž `app/vozy/loading.tsx` obaluje i vnořený `/vozy/[id]`, a
protože se odpověď streamuje, odejde hlavička 200 dřív, než detail stihne
zavolat `notFound()`. Neexistující vůz pak vracel „soft 404" – stránku
„nenalezeno" se stavem 200, kterou Google indexoval jako živou.

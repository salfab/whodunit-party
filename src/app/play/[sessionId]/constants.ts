// Help content for each role
export const HELP_CONTENT = {
  investigator: `# Comment jouer - Enquêteur

## Votre mission

**Écoutez attentivement chaque suspect** raconter son histoire

Chaque suspect doit placer **3 mots obligatoires** dans son récit :
- Les **innocents** ont des mots spécifiques
- Le **coupable** a des mots différents

**Votre objectif** : identifier qui est le coupable en repérant les mots qui sonnent faux ou qui ne collent pas au récit`,
  
  innocent: `# Comment jouer - Suspect Innocent

## Votre mission

1. **Placez vos 3 mots obligatoires** dans la conversation (vous avez 1 minute)

2. **Couvrez le coupable** en essayant de deviner ses mots
   - Dans ce jeu, les suspects n'aiment pas les forces de l'ordre !

3. **Utilisez votre alibi** pour démarrer votre histoire si besoin

4. **Pimentez votre récit** avec votre sombre secret si vous voulez étoffer votre personnage`,
  
  guilty: `# Comment jouer - Suspect Coupable

## Votre mission

1. **Placez vos 3 mots obligatoires** dans la conversation (vous avez 1 minute)

2. **Devinez les mots des innocents** pour brouiller les pistes
   - Essayez d'utiliser leurs mots pour détourner l'attention

3. **Utilisez votre alibi** pour démarrer votre histoire si besoin

4. **Pimentez votre récit** avec votre sombre secret si vous voulez étoffer votre personnage`,
  rules: `# Déroulement d'une manche

1. **Distribution des rôles**  
   Le jeu choisit au hasard **un Inspecteur** et **un Suspect coupable**. Tous les autres joueurs deviennent des **Suspects innocents**.  
   Chaque joueur reçoit une **fiche de personnage**.  
   **Important :** seul le coupable sait qu’il est coupable.

2. **Mise en place du mystère**  
   L’Inspecteur lit à voix haute le texte d’introduction.

3. **Présentation des suspects**  
   Chaque suspect s'annonce à tour de rôle.  
   Pour ce faire, l’Inspecteur "fait l'appel" grâce à la liste de suspects fournie sur sa fiche

4. **Début des interrogatoires**  
   L’Inspecteur choisit un suspect et lui demande son **alibi**.

5. **Alibi en 1 minute**  
   Le suspect dispose de **1 minute** pour exposer son alibi, **sans être interrompu**.  
   Il doit obligatoirement placer **ses 3 mots imposés** dans son récit.
   Il n’y a **ni deuxième tour**, **ni questions supplémentaires** de la part de l’Inspecteur.

6. **Interroger tout le monde**  
   L’Inspecteur recommence avec un autre suspect, jusqu’à avoir interrogé **tous** les suspects.

7. **Les mots imposés : le cœur du jeu**  
   Tous les **innocents** ont exactement les **mêmes 3 mots imposés**.  
   Le **coupable**, lui, a **3 mots différents**.

8. **Accusation finale**  
   Une fois tous les alibis entendus, l’Inspecteur doit identifier le coupable **en repérant celui dont les mots imposés diffèrent** des autres, puis **accuse** le suspect qu’il pense coupable.

9. **Révélation**  
   On révèle l’identité du coupable.  
   Il peut alors **avouer** en lisant à voix haute son texte de **“Sombre secret”**.

10. **Un peu de stratégie**  
   Le coupable doit essayer de deviner les mots des innocents pour brouiller les pistes
   Les innocents peuvent essayer de deviner les mots du coupable pour le couvrir.

**Note** un bref récapitulatif est disponible sur la fiche de personnage via l'icône ❓
`,
};

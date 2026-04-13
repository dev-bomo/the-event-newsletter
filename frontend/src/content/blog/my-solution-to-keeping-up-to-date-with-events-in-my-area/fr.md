---
title: My solution to keeping up to date with events in my area
excerpt: Pourquoi j ai arrete de compter sur les reseaux sociaux pour les evenements, et le systeme simple que j utilise aujourd hui.
---

Published: 2026-04-10  
Updated: 2026-04-10

## TL;DR

J ai arrete d utiliser les reseaux sociaux, mais je voulais quand meme decouvrir des evenements locaux. J ai construit un workflow simple, assiste par IA, que j execute chaque semaine: il regarde les evenements a 60 jours, envoie un email concis, et m aide a rester informe sans les inconvenients des reseaux sociaux.

## Pourquoi j ai quitte les reseaux sociaux

Vers 2016, j ai arrete d utiliser Facebook. J ai realise que je faisais beaucoup de doomscrolling, et je me retrouvais parfois a passer les 30 dernieres minutes dans les commentaires d un article, a critiquer les gens. Sans participer. Juste a desapprouver de loin.

J ai aussi remarque que cela semblait amplifier mon humeur du moment ou mon etat d esprit general. Je scrollais plus quand je me sentais anxieux, je passais plus de temps dans les commentaires, et globalement je ressentais plus le besoin de prendre mon telephone. Et quand j etais dehors a attendre quelqu un, je ne savais pas quoi faire de mes mains. Un peu comme si j etais fumeur.

Donc oui, moi qui ne suis pas medecin, j ai decide que ce ne pouvait pas etre bon pour moi. J ai donc arrete de publier, j ai unfollow tout le monde et j ai desinstalle l appli mobile.

Quelques annees plus tard, je ne l ai jamais vraiment manque. Je n ai jamais eu l impression de rater grand-chose, ni que les personnes dont je ne suivais plus les updates faisaient quelque chose que je ratais vraiment.

## Ce qui me manquait

Une chose me manquait quand meme: les evenements. Surtout les petits, les locaux, ceux de sources moins etablies. Certaines salles avaient des calendriers, certaines avaient des newsletters. Mais en realite, il y a beaucoup de sources, et il y en avait toujours que je ne suivais pas et que je decouvrais trop tard.

## Le workflow IA que j ai commence a utiliser

A un moment, j ai decide d essayer des prompts IA pour voir si je pouvais automatiser une partie du travail necessaire pour rester a jour. Et ca a plutot bien marche. Je lui donnais mes preferences, les types de sorties et d evenements, les genres, les artistes, les salles, etc., et il cherchait sur le web pour me donner une liste de choses susceptibles de m interesser.

C est non deterministe, ce qui est a la fois bien et moins bien. C est bien parce que ca trouve parfois des choses de niche. C est moins bien parce que parfois ca rate des choses simples et evidentes que j aimerais. C est en partie compense parce que je lui fais regarder 60 jours en avance et je verifie chaque semaine.

C est peu cher, mais pas gratuit. Si tu ecris ton propre prompt et que tu le lances chaque semaine, ca peut etre quasiment gratuit sur un plan gratuit ChatGPT ou Perplexity (ou un autre j imagine). Mais il faut le lancer manuellement, tu ne recois pas d email, et il faut passer quelques heures a affiner le prompt. Si tu veux automatiser avec une API pour acceder aux LLM, ca coute plus cher et c est plus difficile a faire, parce qu en fait les appels API doivent etre orchestres par toi. Ce que les web apps des fournisseurs font pour toi. Donc si tu le fais toi-meme avec ton prompt, c est gratuit mais ca prend du temps. Si tu utilises un service, ca coute un peu.

## Pourquoi c est devenu event-newsletter.com

C est assez peu intrusif. Le faire une fois par semaine, avec quelques ajustements de temps en temps, c est comme ca que je fonctionne depuis quelques mois, et je suis beaucoup plus satisfait de ma vision de ce qui se passe. En pratique, cela me prend environ 10-15 minutes par semaine pour relire et ajuster. J ai aussi limite a 20 evenements par semaine, donc l email se lit vite. Et j ai un melange de concerts que je ne raterais normalement pas parce que ce sont des groupes connus dans des salles connues, et de petits evenements comme des vide-greniers dans un bar local, par exemple.

Globalement, j ai trouve que ca valait le temps de le construire, et je me suis dit que ca pouvait aussi servir a d autres. C est comme ca que [event-newsletter.com](https://event-newsletter.com) est ne.

Je l ai configure avec mes preferences et ma localisation, et je recois un email tous les jeudis avec des evenements bases sur ca. Quand je vois un evenement qui ne m interesse pas du tout, je peux le marquer en dislike, et il est rattache a mon profil pour ne plus le recevoir ensuite. A part ca, je n ai quasiment rien change dans mon profil. Et bien sur, si un jour je m interesse a quelque chose de nouveau, je peux l ajouter a mon profil et ce sera pris en compte dans la prochaine newsletter.

Si vous voulez essayer, commencez sur [event-newsletter.com](https://event-newsletter.com), et si utile vous pouvez aussi lire la [FAQ](/faq) ou consulter [Pricing](/pricing).

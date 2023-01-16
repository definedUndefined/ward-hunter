## Installation

Pour commencer à utiliser cette application, commencer par installer les dépendances du projet en lançant la commande suivante : 

```
npm install
```

Il faut ensuite créer un projet [Upstash](https://upstash.com/) puis renseigner les informations de la base de données Redis dans le fichier `.env.local` comme indiqué dans `.env.example`

De même, il faudra créer un projet [Firebase](https://firebase.google.com/) puis renseigner les clés du projet dans le fichier d'environnement.

Finalement, générez une clé API temporaire sur le site officiel [Riot Developper](https://developer.riotgames.com/) et la renseigner dans les variables d'environnement.

## Sites utiles

Ci-dessous les liens utiles pour les projets liés à League of Legends :
- [communitydragon](https://raw.communitydragon.org/latest/) : derniers assets du jeu au format brut
- Pour télécharger la dernière version des assets via le CDN, vous pouvez regarder la dernière version du jeu sur le [lien suivant](https://ddragon.leagueoflegends.com/api/versions.json) puis la remplacer dans le lien suivant https://ddragon.leagueoflegends.com/cdn/dragontail-[version].tgz
- [Documentation non officielle](https://riot-api-libraries.readthedocs.io/en/latest/index.html)
- Un historique de l'ancien Blog de Riot Developper est disponible à [l'adresse suivante](https://hextechdocs.dev/)

## Utilisation

Vous pouvez tester la libraire en lançant le serveur local via la commande :

```
npm run dev
```

Un premier point d'accès pour la librairie est disponible à l'adresse `localhost:3000/api/lol/{region}/{summonerName}`
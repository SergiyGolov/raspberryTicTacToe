# raspberryTicTacToe
- Projet de conception OS
- Serveur nodeJS sur raspberry pi
- Deux clients se connectent au serveurJS pour pouvoir y jouer au morpion
- La partie est affiché sur une matrice de led bicolore connectée au raspberry

# prérequis matériels
- raspberry pi connectée à internet
- matrice de LED Adafruit 8x8 bicolore avec backpack i²c : https://learn.adafruit.com/adafruit-led-backpack/bi-color-8x8-matrix
- connecter les pins 5V, GND, SDA, SCL du backpack de la matrice vers la raspberry pi (voir poster présentant le projet)

# prérequis logiciels
- npm, node, python3.6, ngrok, pip

# installation
- `sudo pip install Adafruit-GPIO spidev Adafruit-PureIO`
- `npm install` depuis la racine du projet (le fichier `package.json` contient toutes les dépendances requis pour npm) ce qui installera les packages suivants:
    - discord.js
    - dotenv
    - ejs
    - express
    - express-session
    - express-socket.io-session
    - socket.io
- modifier le fichier `/etc/rc.local` sur la raspberry pour lancer le script `start.sh` en tâche de fond qui se trouve à la racine de ce projet au démarrage de la raspberry
- activer l'interface i²c sur la raspberry (avec `raspi-config`)
- configurer la raspberry pour qu'elle se connecte automatiquement en mode invite de commande au démarrage dés que la connexion internet est disponible (avec `raspi-config`)
- créer un fichier `.env` à la racine du projet avec le contenu suivant:

```
DISCORD_BOT_SECRET=<VOIR RAPPORT>
SESSION_SECRET<VOIR RAPPORT>
PROJECT_ROOT=<CHEMIN ABSOLU SUR RASPBERRY DU DOSSIER RACINE DU PROJET>
```

# lancement
- après les manipulations effectués décrites au dessus, il suffit d'allumer la raspberry en étant connectée à internet
- en cas de soucis:
    - `sudo pkill ngrok`
    - `sudo pkill node`
    - lancer manuellement `start.sh`
- ou alors si c'est que node qui plante:
    - `sudo pkill node`
    - `node server.js` depuis la racine du projet

# utilisation en tant que joueur
- voir poster présentant le projet
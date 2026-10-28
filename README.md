# Demon Torneo — El Jade del Alba

Juego de cartas táctico para navegador con duelos simultáneos 1 contra 1. Elige tres acciones por ronda, anticipa el plan rival y reúne los cinco fragmentos del Jade.

Personajes, arte y textos son originales. Las mecánicas están inspiradas en *Inuyasha: Demon Tournament*.

## Reglas

- Tablero de 5×3. Cada luchador empieza en extremos opuestos.
- Cada ronda eliges 3 cartas de tu mazo; se resuelven en el orden elegido.
- En cada acción se resuelve primero el movimiento, después la guardia y por último el ataque.
- Si ambos intentan ocupar la misma casilla, el movimiento se bloquea.
- La guardia protege solo durante su acción: 15 de daño, 25 con técnicas avanzadas o bloqueo total.
- La energía se paga al usar la carta, incluso si el ataque falla. Se recuperan 15 EN al final de cada ronda.
- Gana quien reduzca a cero la vida rival. Si ambos caen a la vez, el combate es empate.

## Campaña

- Cinco combates contra cinco rivales distintos, uno por cada fragmento.
- Cada victoria permite elegir una de cinco cartas para añadir al mazo.
- Al reunir los cinco fragmentos se desbloquean la cuarta acción, la carta **Poder del Jade** y el modo infinito.
- El progreso se guarda automáticamente en `localStorage`.

## Ejecutar

El proyecto es estático y no necesita compilación. Sirve la raíz con cualquier servidor HTTP:

```bash
python3 -m http.server 3002
```

En el entorno de OMGithub también puedes usar `./start.sh`, que arranca el servidor por defecto en el puerto 3002.

## Pruebas

```bash
node --test tests/engine.test.mjs
```

Las pruebas cubren movimiento, colisiones, guardias, energía, empates, campaña, recompensas, IA y simulación.

## Controles

- Clic en una carta para añadirla o quitarla del plan.
- Clic en una acción del plan para retirarla.
- `Esc` abre el menú durante el combate.
- El botón `1×`/`2×` cambia la velocidad de resolución.

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/Valtimor/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/Valtimor/PlayGround)

- 🎮 [Open the project](https://omgithub.com/Valtimor/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=Valtimor%2FPlayGround).
- 💻 [Explore the source](https://github.com/Valtimor/PlayGround).
- 🛠️ [Check build runs](https://github.com/Valtimor/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/Valtimor/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/Valtimor).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

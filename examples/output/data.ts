// Example Typescript code with a JSONC data file

class Player {
  name: string;
  level: number;
  isOnline: boolean;

  constructor(name: string, level: number, isOnline: boolean) {
    this.name = name;
    this.level = level;
    this.isOnline = isOnline;
  }

  toString() {
    return `${this.name} (Lvl. ${this.level})`;
  }
}

const players = [
  // This ain't no game, kid!
  new Player("art3mis", 10, true),

  // I'm not a gunter, I'm a gamer.
  new Player("parzival", 5, false),

  // It is on like Red Dawn!
  new Player("aech", 7, true),

  // I support the OASIS.
  new Player("gunter", 2, false),
];

console.log(`There are ${players.length} players in the game.`);

const onlinePlayers = players.filter((player) => player.isOnline).join(", ");

console.log(`The following players are online: ${onlinePlayers}`);
